import { createContext, useContext } from "react";

export type StepperData = {
  agentIconUrl?: string;
  agentId?: string;
  agentName: string;
  code?: string;
  description?: string;
  environment?: string;
  rhoLimit: number;
  version?: string;
};

export type StepperState = {
  data: StepperData;
  navigateToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  setStep: (step: number) => void;
  step: number;
  updateData: <K extends keyof StepperData>(
    key: K,
    value: StepperData[K],
  ) => void;
};

export const StepperContext = createContext<StepperState | undefined>(
  undefined,
);

export const useStepper = () => {
  const context = useContext(StepperContext);

  if (!context) {
    throw new Error("useStepper must be used within a StepperProvider");
  }

  return context;
};
