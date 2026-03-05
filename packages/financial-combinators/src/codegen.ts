/**
 * Rholang code-gen for SP-J financial combinators.
 *
 * Each function returns a *rholang expression string* that, when sent on the
 * contract channel, evaluates the described contract.  The approach follows
 * the continuation-passing contract-valuation pattern used in F1R3FLY's
 * rholang implementation of SPJ:
 *
 *   contract(holderCh, counterpartyCh, resultCh)
 *
 * The `toRholang` functions are called by the Embers compiler when it
 * walks the dataflow graph in topological order and substitutes child
 * sub-expressions.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Rholang contract protocol (shared by every combinator)            │
 * │                                                                     │
 * │  A "contract value" ch is a channel that accepts:                  │
 * │    ch!(holderCh, counterpartyCh, resultCh)                         │
 * │                                                                     │
 * │  holderCh       – channel on which holder receives the payment     │
 * │  counterpartyCh – channel on which counterparty receives payment   │
 * │  resultCh       – returns `true` when settled, `false` if expired  │
 * └─────────────────────────────────────────────────────────────────────┘
 */

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Indent a multiline rholang block */
const indent = (src: string, n = 2): string =>
  src
    .split("\n")
    .map(l => " ".repeat(n) + l)
    .join("\n");

/** Unique name generator for intermediate channels */
let _seq = 0;
export function freshCh(prefix = "ch"): string {
  return `${prefix}_${++_seq}`;
}

// ────────────────────────────────────────────────────────────
// Primitive combinators
// ────────────────────────────────────────────────────────────

/**
 * zero – the contract that does nothing.
 *
 * new contractCh in {
 *   contract contractCh(holder, cp, result) = { result!(true) }
 * }
 */
export function zero(): string {
  return `new zeroCh in {
  contract zeroCh(holder, cp, result) = {
    result!(true)
  } |
  zeroCh
}`;
}

/**
 * one(currency) – immediately pays 1 unit of `currency` to holder.
 *
 * The rholang model assumes an on-chain payment oracle reachable via
 * @"paymentOracle", which the F1R3FLY shard provides.
 */
export function one(currency: string): string {
  return `new oneCh in {
  contract oneCh(holder, cp, result) = {
    new ackCh in {
      @"paymentOracle"!("pay", *holder, 1, "${currency}", *ackCh) |
      for(_ <- ackCh) { result!(true) }
    }
  } |
  oneCh
}`;
}

/**
 * give(sub) – reverses holder and counterparty.
 */
export function give(subExpr: string): string {
  return `new giveCh in {
  contract giveCh(holder, cp, result) = {
    new subCh in {
${indent(subExpr, 6)} |
      subCh!(cp, holder, result)  // swap holder ↔ counterparty
    }
  } |
  giveCh
}`;
}

/**
 * and(c1, c2) – both contracts must be fulfilled.
 */
export function and(leftExpr: string, rightExpr: string): string {
  return `new andCh in {
  contract andCh(holder, cp, result) = {
    new leftDone, rightDone, leftCh, rightCh in {
${indent(leftExpr, 6)} |
${indent(rightExpr, 6)} |
      leftCh!(holder, cp, *leftDone) |
      rightCh!(holder, cp, *rightDone) |
      for(l <- leftDone; r <- rightDone) { result!(l && r) }
    }
  } |
  andCh
}`;
}

/**
 * or(c1, c2) – holder chooses which contract to acquire.
 *
 * Holder signals choice by sending on holderChoiceCh:
 *   holderChoiceCh!("left")  or  holderChoiceCh!("right")
 */
export function or(leftExpr: string, rightExpr: string): string {
  return `new orCh in {
  contract orCh(holder, cp, result) = {
    new choiceCh, leftCh, rightCh in {
${indent(leftExpr, 6)} |
${indent(rightExpr, 6)} |
      holder!("choose", *choiceCh) |
      for(choice <- choiceCh) {
        match choice {
          "left"  => { leftCh!(holder, cp, result) }
          "right" => { rightCh!(holder, cp, result) }
          _       => { result!(false) }
        }
      }
    }
  } |
  orCh
}`;
}

/**
 * scale(obs, sub) – scales payments by observable value at acquisition time.
 *
 * obs is a rholang channel name that, when queried, returns a numeric value.
 */
export function scale(obsChannel: string, subExpr: string): string {
  return `new scaleCh in {
  contract scaleCh(holder, cp, result) = {
    new valueCh, scaledSubCh, subCh in {
      @"${obsChannel}"!("read", *valueCh) |
${indent(subExpr, 6)} |
      for(v <- valueCh) {
        // wrap sub to multiply all payments by v
        new wrappedHolder in {
          contract wrappedHolder(amount, currency, ack) = {
            holder!(v * amount, currency, ack)
          } |
          subCh!(*wrappedHolder, cp, result)
        }
      }
    }
  } |
  scaleCh
}`;
}

/**
 * when(obs, sub) – acquire sub as soon as observable becomes true.
 *
 * obs channel returns a boolean; contract polls until true.
 */
export function when(obsChannel: string, subExpr: string): string {
  return `new whenCh in {
  contract whenCh(holder, cp, result) = {
    new subCh, pollCh in {
${indent(subExpr, 6)} |
      contract pollCh(_) = {
        new condCh in {
          @"${obsChannel}"!("read", *condCh) |
          for(cond <- condCh) {
            if(cond) { subCh!(holder, cp, result) }
            else { pollCh!(Nil) }
          }
        }
      } |
      pollCh!(Nil)
    }
  } |
  whenCh
}`;
}

/**
 * anytime(obs, sub) – holder may acquire sub at any time while obs holds.
 *
 * Holder signals exercise by sending on holder's exerciseCh.
 */
export function anytime(obsChannel: string, subExpr: string): string {
  return `new anytimeCh in {
  contract anytimeCh(holder, cp, result) = {
    new subCh, exerciseCh in {
${indent(subExpr, 6)} |
      holder!("awaitExercise", *exerciseCh) |
      for(_ <- exerciseCh) {
        new condCh in {
          @"${obsChannel}"!("read", *condCh) |
          for(cond <- condCh) {
            if(cond) { subCh!(holder, cp, result) }
            else { result!(false) }
          }
        }
      }
    }
  } |
  anytimeCh
}`;
}

/**
 * until(obs, sub) – truncate sub once obs becomes true.
 */
export function until(obsChannel: string, subExpr: string): string {
  return `new untilCh in {
  contract untilCh(holder, cp, result) = {
    new subCh, doneCh in {
${indent(subExpr, 6)} |
      subCh!(holder, cp, *doneCh) |
      new pollCh in {
        contract pollCh(_) = {
          new condCh in {
            @"${obsChannel}"!("read", *condCh) |
            for(cond <- condCh) {
              if(cond) { result!(false) }
              else { pollCh!(Nil) }
            }
          }
        } |
        for(done <- doneCh) { result!(done) } |
        pollCh!(Nil)
      }
    }
  } |
  untilCh
}`;
}

/**
 * get(sub) – acquire the underlying contract (lift from horizon to now).
 *
 * In the SPJ model `get` advances the acquisition date to the horizon.
 * In our rholang encoding we immediately evaluate sub.
 */
export function get(subExpr: string): string {
  return `new getCh in {
  contract getCh(holder, cp, result) = {
    new subCh in {
${indent(subExpr, 6)} |
      subCh!(holder, cp, result)
    }
  } |
  getCh
}`;
}

// ────────────────────────────────────────────────────────────
// Observable constructors
// ────────────────────────────────────────────────────────────

/** Constant observable – always returns the given numeric literal */
export function constObs(value: number): string {
  return `new constObsCh in {
  contract constObsCh("read", ret) = { ret!(${value}) } |
  constObsCh
}`;
}

/** Spot price observable – reads from on-chain price feed */
export function spotObs(ticker: string): string {
  return `new spotCh in {
  contract spotCh("read", ret) = {
    new priceCh in {
      @"priceFeed"!("spot", "${ticker}", *priceCh) |
      for(p <- priceCh) { ret!(p) }
    }
  } |
  spotCh
}`;
}

/** Date condition – true once blocktime >= ISO date string */
export function dateObs(isoDate: string): string {
  return `new dateCh in {
  contract dateCh("read", ret) = {
    new timeCh in {
      @"blocktime"!(*timeCh) |
      for(t <- timeCh) { ret!(t >= "${isoDate}") }
    }
  } |
  dateCh
}`;
}

/** Rate observable – reads interest rate from on-chain oracle */
export function rateObs(rateName: string): string {
  return `new rateCh in {
  contract rateCh("read", ret) = {
    new rCh in {
      @"rateOracle"!("${rateName}", *rCh) |
      for(r <- rCh) { ret!(r) }
    }
  } |
  rateCh
}`;
}
