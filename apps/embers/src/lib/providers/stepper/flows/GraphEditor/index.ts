import { createStepper } from "../../StepperProvider";

export type GraphEditorStepperData = {
  agentName: string;
};

export const {
  StepperProvider: GraphEditorStepperProvider,
  useStepper: useGraphEditorStepper,
} = createStepper<GraphEditorStepperData>({
  initialData: {
    agentName: "",
  },
  routes: [
    "/create-ai-team-flow/create",
    "/create-ai-team-flow",
    "/create-ai-team-flow/deploy",
  ],
});
