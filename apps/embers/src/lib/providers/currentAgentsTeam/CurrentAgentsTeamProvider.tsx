import type React from "react";

import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAgentsTeam } from "@/lib/queries";

import type { CurrentAgentsTeam } from "./useCurrentAgentsTeam";

import { CurrentAgentsTeamContext } from "./useCurrentAgentsTeam";

export const CurrentAgentsTeamProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [agentsTeam, setAgentsTeam] = useState<CurrentAgentsTeam>({});

  const location = useLocation();
  const preload = location.state as CurrentAgentsTeam | undefined;
  useEffect(() => {
    if (preload) {
      setAgentsTeam(preload);
    }
  }, [preload]);

  const { data } = useAgentsTeam(agentsTeam.id, agentsTeam.version);

  useEffect(() => {
    if (data) {
      setAgentsTeam(data);
    }
    // agents teams are append only so this should be fine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, data?.version]);

  const update = useCallback(
    (patch: Partial<CurrentAgentsTeam>) =>
      setAgentsTeam((old) => ({
        ...old,
        ...patch,
      })),
    [],
  );

  const reset = useCallback(() => setAgentsTeam({}), []);

  return (
    <CurrentAgentsTeamContext.Provider
      value={{
        agentsTeam,
        reset,
        update,
      }}
    >
      {children}
    </CurrentAgentsTeamContext.Provider>
  );
};
