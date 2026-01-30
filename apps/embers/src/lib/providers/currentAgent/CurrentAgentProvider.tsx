import type React from "react";

import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";

import type { CurrentAgent } from "./useCurrentAgent";

import { CurrentAgentContext } from "./useCurrentAgent";

export const CurrentAgentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const preload = location.state as CurrentAgent | undefined;

  const [agent, setAgent] = useState<CurrentAgent>(preload ?? {});
  const update = useCallback(
    (patch: Partial<CurrentAgent>) => setAgent((old) => ({ ...old, ...patch })),
    [],
  );
  const reset = useCallback(() => setAgent({}), []);

  return (
    <CurrentAgentContext.Provider
      value={{
        agent,
        reset,
        update,
      }}
    >
      {children}
    </CurrentAgentContext.Provider>
  );
};
