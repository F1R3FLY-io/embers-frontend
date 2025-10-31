export type QueryCallConfig = {
  signal?: AbortSignal | null;
};

export type ContractCallConfig = {
  maxWaitForFinalisation?: number | null;
  signal?: AbortSignal | null;
};
