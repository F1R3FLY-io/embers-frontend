import { createContext, useContext } from "react";

type LoaderContextValue = {
  hide: () => void;
  show: () => void;
};

export const LoaderContext = createContext<LoaderContextValue | null>(null);

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) {
    throw new Error("useLoader must be used within LoaderProvider");
  }
  return ctx;
}
