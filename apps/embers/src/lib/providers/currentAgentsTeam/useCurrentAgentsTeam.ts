import type { PrivateKey, Uri } from "@f1r3fly-io/embers-client-sdk";

import { createContext, useContext } from "react";

import type { Edge, Node } from "@/lib/components/GraphEditor";

export type CurrentAgentsTeam = {
  description?: string;
  edges?: Edge[];
  execType?: string;
  flowType?: string;
  hasGraphChanges?: boolean;
  iconUrl?: string;
  id?: string;
  inputPrompt?: string;
  language?: string;
  lastDeployKey?: PrivateKey;
  name?: string;
  nodes?: Node[];
  uri?: Uri;
  version?: string;
};

export type CurrentAgentsTeamContext = {
  agentsTeam: CurrentAgentsTeam;
  reset: () => void;
  update: (patch: Partial<CurrentAgentsTeam>) => void;
};

export const CurrentAgentsTeamContext = createContext<CurrentAgentsTeamContext>(
  {
    agentsTeam: {},
    reset: () => {},
    update: () => {},
  },
);

export function useCurrentAgentsTeam() {
  return useContext(CurrentAgentsTeamContext);
}
