import { createContext, useContext } from "react";

export type CurrentAgent = {
  code?: string;
  description?: string;
  environment?: string;
  iconUrl?: string;
  id?: string;
  name?: string;
  rhoLimit?: bigint;
  version?: string;
};

export type CurrentAgentContext = {
  agent: CurrentAgent;
  reset: () => void;
  update: (patch: Partial<CurrentAgent>) => void;
};

export const CurrentAgentContext = createContext<CurrentAgentContext>({
  agent: {},
  reset: () => {},
  update: () => {},
});

export function useCurrentAgent() {
  return useContext(CurrentAgentContext);
}
