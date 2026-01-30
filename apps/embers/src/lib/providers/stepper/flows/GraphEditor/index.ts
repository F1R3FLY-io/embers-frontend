import type { PrivateKey, Uri } from "@f1r3fly-io/embers-client-sdk";
import type { ReactFlowJsonObject } from "@xyflow/react";

import type { Edge, Node } from "@/lib/components/GraphEditor";

import { createStepper } from "@/lib/providers/stepper/StepperProvider";

export type GraphEditorStepperData = {
  description?: string | undefined;
  edges: Edge[];
  execType?: string;
  flow?: ReactFlowJsonObject<Node, Edge>;
  flowType?: string;
  hasGraphChanges: boolean;
  iconUrl?: string | undefined;
  id?: string;
  inputPrompt?: string;
  language?: string;
  lastDeployKey?: PrivateKey;
  name: string;
  nodes: Node[];
  uri?: Uri;
  version?: string;
};

export const {
  StepperProvider: GraphEditorStepperProvider,
  useStepper: useGraphEditorStepper,
} = createStepper<GraphEditorStepperData>({
  initialData: {
    edges: [],
    hasGraphChanges: false,
    name: "",
    nodes: [],
  },
  routes: [
    "/create-agents-team/create",
    "/create-agents-team",
    "/create-agents-team/deploy",
  ],
});
