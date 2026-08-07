import type { EmbersEvents } from "@/services/EmbersEvents";

/**
 * A finalization source a test controls directly.
 *
 * Every service takes its `EmbersEvents` as a constructor argument, which is
 * the seam this uses: a service test can then decide exactly when a deploy
 * finalizes, or that it never does, without a socket, a timer, or a real
 * `EmbersEvents` at all.
 *
 * It also records the arguments, because two contracts of the two-phase
 * protocol are only observable here: that the subscribed deploy id equals the
 * lowercase hex of the signature the client just sent, and that the wait budget
 * is either the default or the caller's override. A service that subscribed to
 * the wrong id would still resolve in production -- eventually, by timeout --
 * so nothing else catches it.
 */
export interface RecordedSubscription {
  deployId: string;
  maxWait: number | undefined;
}

export class FakeEmbersEvents {
  public readonly subscriptions: RecordedSubscription[] = [];

  private readonly settlers = new Map<
    string,
    { reject: (reason: unknown) => void; resolve: () => void }
  >();

  public async subscribeForDeploy(
    deployId: string,
    maxWait?: number,
  ): Promise<void> {
    this.subscriptions.push({ deployId, maxWait });

    return new Promise<void>((resolve, reject) => {
      this.settlers.set(deployId, { reject, resolve });
    });
  }

  /** The deploy ids currently awaited, in subscription order. */
  public pending(): string[] {
    return [...this.settlers.keys()];
  }

  /** The most recent subscription, i.e. the one the call under test made. */
  public lastSubscription(): RecordedSubscription {
    const last = this.subscriptions.at(-1);
    if (last === undefined) {
      throw new Error("no deploy was subscribed for");
    }
    return last;
  }

  /** Finalizes a deploy, resolving whatever is awaiting it. */
  public finalize(deployId: string): void {
    const settler = this.settlers.get(deployId);
    if (settler === undefined) {
      throw new Error(`nothing is awaiting deploy ${deployId}`);
    }
    this.settlers.delete(deployId);
    settler.resolve();
  }

  /** Fails a deploy's wait, e.g. to reproduce the honest-timeout rejection. */
  public fail(deployId: string, reason: unknown): void {
    const settler = this.settlers.get(deployId);
    if (settler === undefined) {
      throw new Error(`nothing is awaiting deploy ${deployId}`);
    }
    this.settlers.delete(deployId);
    settler.reject(reason);
  }

  /** Typed as the real thing for constructors that require it. */
  public asEvents(): EmbersEvents {
    return this as unknown as EmbersEvents;
  }
}
