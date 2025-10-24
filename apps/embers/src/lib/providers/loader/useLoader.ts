import { createContext, useContext } from "react";

interface LoaderContextValue {
  hideLoader: () => void;
  showLoader: () => void;
}

export const LoaderContext = createContext<LoaderContextValue | undefined>(
  undefined,
);

export const useLoader = () => {
  const ctx = useContext(LoaderContext);
  if (!ctx) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return ctx;
};
