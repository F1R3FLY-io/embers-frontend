import type { Request } from "./Request.js";
import type { Exchange } from "./Exchange.js";
import type { Boost } from "./Boost.js";
import type { Transfer } from "./Transfer.js";

export type WalletStateAndHistory = {
  balance: string;
  requests: Array<Request>;
  exchanges: Array<Exchange>;
  boosts: Array<Boost>;
  transfers: Array<Transfer>;
};
