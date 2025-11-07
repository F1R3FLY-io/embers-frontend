import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

export type StepperApi<TData> = {
  data: TData;
  navigateToStep: (n: number) => void;
  reset: () => void;
  setStep: (n: number) => void;
  step: number;
  updateData: <K extends keyof TData>(key: K, value: TData[K]) => void;
  updateMany: (patch: Partial<TData>) => void;
};

type CreateStepperOptions<TData> = {
  initialData: TData;
  routes: string[];
};

export function createStepper<TData>(opts: CreateStepperOptions<TData>) {
  const Ctx = createContext<StepperApi<TData> | null>(null);

  function StepperProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<TData>(opts.initialData);

    const navigateToStep = useCallback(
      (targetStep: number) => {
        if (targetStep >= 0 && targetStep < opts.routes.length) {
          setStep(targetStep);
          void navigate(opts.routes[targetStep]);
        }
      },
      [navigate],
    );

    const updateMany = (patch: Partial<TData>) => {
      setData((prev) => ({ ...prev, ...patch }));
    };

    const updateData = <K extends keyof TData>(key: K, value: TData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    };

    const reset = () => {
      setStep(0);
      setData(opts.initialData);
    };

    const value: StepperApi<TData> = useMemo(
      () => ({
        data,
        navigateToStep,
        reset,
        setStep,
        step,
        updateData,
        updateMany,
      }),
      [data, navigateToStep, step],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useStepper() {
    const ctx = useContext(Ctx);
    if (!ctx) {
      throw new Error(
        "useStepper must be used within this flow's StepperProvider",
      );
    }
    return ctx;
  }

  return { StepperProvider, useStepper };
}
