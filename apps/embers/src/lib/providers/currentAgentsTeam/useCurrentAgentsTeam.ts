import type { PrivateKey, Uri } from "@f1r3fly-io/embers-client-sdk";

import { createContext, useContext } from "react";

import type { Edge, Node } from "@/lib/components/GraphEditor";
import type { WorkflowDefinitionV2 } from "@/lib/workflow";

export type CurrentAgentsTeam = {
  definition?: WorkflowDefinitionV2;
  description?: string;
  edges?: Edge[];
  execType?: string;
  flowType?: string;
  hasGraphChanges?: boolean;
  id?: string;
  inputPrompt?: string;
  language?: string;
  lastDeployKey?: PrivateKey;
  logo?: string;
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
