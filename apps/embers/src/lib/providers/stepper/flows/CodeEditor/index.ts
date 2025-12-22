import { createStepper } from "@/lib/providers/stepper/StepperProvider";

export type CodeEditorStepperData = {
  agentIconUrl?: string;
  agentId?: string;
  agentName: string;
  code?: string;
  description?: string;
  environment?: string;
  rhoLimit: number;
  version?: string;
};

export const {
  StepperProvider: CodeEditorStepperProvider,
  useStepper: useCodeEditorStepper,
} = createStepper<CodeEditorStepperData>({
  initialData: {
    agentName: "",
    rhoLimit: 100000,
  },
  routes: [
    "/create-ai-agent/create",
    "/create-ai-agent",
    "/create-ai-agent/deploy",
  ],
});
