import type { Direction } from "./Direction.js";

export type Transfer = {
  id: string;
  direction: Direction;
  date: string;
  amount: string;
  to_address: string;
  cost: string;
};
