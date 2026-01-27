import { createStepper } from "@/lib/providers/stepper/StepperProvider";

export type CodeEditorStepperData = {
  agentIconUrl?: string;
  agentId?: string;
  agentName: string;
  code?: string;
  description?: string;
  environment?: string;
  rhoLimit: bigint;
  version?: string;
};

export const {
  StepperProvider: CodeEditorStepperProvider,
  useStepper: useCodeEditorStepper,
} = createStepper<CodeEditorStepperData>({
  initialData: {
    agentName: "",
    rhoLimit: 100000n,
  },
  routes: ["/create-agent/create", "/create-agent", "/create-agent/deploy"],
});
