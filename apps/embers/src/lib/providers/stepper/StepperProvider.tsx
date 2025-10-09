import type { ReactNode } from "react";
import type React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { StepperData } from "@/lib/providers/stepper/useStepper";

import { StepperContext } from "@/lib/providers/stepper/useStepper";

const defaultData = {
  agentName: "defaultName",
  rhoLimit: 100000,
};

const stepRoutes = [
  "/create-ai-agent/create",
  "/create-ai-agent",
  "/create-ai-agent/deploy",
];

export const StepperProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<StepperData>(defaultData);
  const navigate = useNavigate();

  const reset = () => {
    setStep(0);
    setData(defaultData);
  };

  const navigateToStep = (targetStep: number) => {
    if (targetStep >= 0 && targetStep < stepRoutes.length) {
      setStep(targetStep);
      void navigate(stepRoutes[targetStep]);
    }
  };

  const updateData = <K extends keyof StepperData>(
    key: K,
    value: StepperData[K],
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((prev) => prev + 1);

  const prevStep = () => setStep((prev) => Math.max(0, prev - 1));

  return (
    <StepperContext.Provider
      value={{
        data,
        navigateToStep,
        nextStep,
        prevStep,
        reset,
        step,
        updateData,
      }}
    >
      {children}
    </StepperContext.Provider>
  );
};
