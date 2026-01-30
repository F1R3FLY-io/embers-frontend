import { createStepper } from "@/lib/providers/stepper/StepperProvider";

export type OSLFEditorStepperData = {
  description?: string;
  hasChanges?: boolean;
  id?: string;
  name: string;
  query: string;
  version?: string;
};

export const {
  StepperProvider: OSLFEditorStepperProvider,
  useStepper: useOSLFEditorStepper,
} = createStepper<OSLFEditorStepperData>({
  initialData: {
    description: "",
    name: "",
    query: "",
  },
  routes: ["/oslf/create", "/oslf", "/oslf/deploy"],
});
