import { createStepper } from "@/lib/providers/stepper/StepperProvider";

export type OSLFEditorStepperData = {
  description?: string;
  id?: string;
  name: string;
};

export const {
  StepperProvider: OSLFEditorStepperProvider,
  useStepper: useOSLFEditorStepper,
} = createStepper<OSLFEditorStepperData>({
  initialData: {
    description: "",
    name: "",
  },
  routes: ["/oslf/create", "/oslf", "/oslf/deploy"],
});
