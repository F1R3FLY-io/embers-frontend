export type QueryCallConfig = {
  signal?: AbortSignal | null;
};

export type ContractCallConfig = {
  maxWaitForFinalisation?: number | null;
  validAfterBlockNumber?: number | null;
  signal?: AbortSignal | null;
};
