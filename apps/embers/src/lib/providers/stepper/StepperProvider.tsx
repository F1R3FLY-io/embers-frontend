import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

export type StepperApi<TData> = {
  data: TData;
  navigateToNextStep: () => void;
  navigateToPrevStep: () => void;
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

    const routesRef = useRef(opts.routes);
    const initialDataRef = useRef(opts.initialData);
    useEffect(() => {
      routesRef.current = opts.routes;
      initialDataRef.current = opts.initialData;
    }, []);

    const navigateToStep = useCallback((targetStep: number) => {
      const routes = routesRef.current;
      if (targetStep >= 0 && targetStep < routes.length) {
        setStep(targetStep);
        void navigate(routes[targetStep]);
      }
    }, [navigate]);

    const navigateToNextStep = useCallback(() => {
      const next = step + 1;
      navigateToStep(next);
    }, [step, navigateToStep]);

    const navigateToPrevStep = useCallback(() => {
      const prev = Math.max(0, step - 1);
      navigateToStep(prev);
    }, [step, navigateToStep]);

    const updateMany = useCallback((patch: Partial<TData>) => {
      setData((prev) => ({ ...prev, ...patch }));
    }, []);

    const updateData = useCallback(
      <K extends keyof TData>(key: K, value: TData[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
      },
      [],
    );

    const reset = useCallback(() => {
      setStep(0);
      setData(initialDataRef.current);
    }, []);

    const value: StepperApi<TData> = useMemo(
      () => ({
        data,
        navigateToNextStep,
        navigateToPrevStep,
        navigateToStep,
        reset,
        setStep,
        step,
        updateData,
        updateMany,
      }),
      [
        data,
        step,
        reset,
        navigateToStep,
        navigateToNextStep,
        navigateToPrevStep,
        updateData,
        updateMany,
      ],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useStepper() {
    const ctx = useContext(Ctx);
    if (!ctx) {
      throw new Error("useStepper must be used within this flow's StepperProvider");
    }
    return ctx;
  }

  return { StepperProvider, useStepper };
}
