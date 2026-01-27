import { createStepper } from "@/lib/providers/stepper/StepperProvider";

export type CodeEditorStepperData = {
  code?: string;
  description?: string | undefined;
  environment?: string | undefined;
  iconUrl?: string | undefined;
  id?: string;
  name: string;
  notes?: string;
  rhoLimit: bigint;
  version?: string;
};

export const {
  StepperProvider: CodeEditorStepperProvider,
  useStepper: useCodeEditorStepper,
} = createStepper<CodeEditorStepperData>({
  initialData: {
    name: "",
    rhoLimit: 100000n,
  },
  routes: ["/create-agent/create", "/create-agent", "/create-agent/deploy"],
});
