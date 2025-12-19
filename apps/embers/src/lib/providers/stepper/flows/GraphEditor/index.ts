import type { PrivateKey, Uri } from "@f1r3fly-io/embers-client-sdk";
import type { ReactFlowJsonObject } from "@xyflow/react";

import type { Edge, Node } from "@/lib/components/GraphEditor";

import { createStepper } from "@/lib/providers/stepper/StepperProvider";

export type GraphEditorStepperData = {
  agentId?: string;
  agentName: string;
  description?: string;
  edges: Edge[];
  encryptResult?: boolean;
  execType?: string;
  flow?: ReactFlowJsonObject<Node, Edge>;
  flowType?: string;
  hasGraphChanges: boolean;
  iconUrl?: string;
  inputPrompt?: string;
  inputs: CreateAiTeamInputs;
  language?: string;
  lastDeployKey?: PrivateKey;
  nodes: Node[];
  outputs: CreateAiTeamOutputs;
  uri?: Uri;
  version?: string;
};

type CreateAiTeamInputs = {
  external: boolean;
  media: boolean;
  textual: boolean;
};

type CreateAiTeamOutputs = {
  explanation: boolean;
  structured: boolean;
  visualization: boolean;
};

export const {
  StepperProvider: GraphEditorStepperProvider,
  useStepper: useGraphEditorStepper,
} = createStepper<GraphEditorStepperData>({
  initialData: {
    agentName: "",
    edges: [],
    hasGraphChanges: false,
    inputs: {
      external: true,
      media: false,
      textual: true,
    },
    nodes: [],
    outputs: {
      explanation: true,
      structured: true,
      visualization: false,
    },
  },
  routes: [
    "/create-ai-team/create",
    "/create-ai-team",
    "/create-ai-team/deploy",
  ],
});
