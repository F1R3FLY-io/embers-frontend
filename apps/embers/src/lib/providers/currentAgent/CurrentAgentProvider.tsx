import type React from "react";

import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAgent } from "@/lib/queries";

import type { CurrentAgent } from "./useCurrentAgent";

import { CurrentAgentContext } from "./useCurrentAgent";

export const CurrentAgentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [agent, setAgent] = useState<CurrentAgent>({});

  const location = useLocation();
  const preload = location.state as CurrentAgent | undefined;
  useEffect(() => {
    if (preload) {
      setAgent(preload);
    }
  }, [preload]);

  const { data } = useAgent(agent.id, agent.version);

  useEffect(() => {
    if (data) {
      setAgent(data);
    }
  }, [data]);

  const update = useCallback(
    (patch: Partial<CurrentAgent>) =>
      setAgent((old) => ({
        ...old,
        ...patch,
      })),
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
