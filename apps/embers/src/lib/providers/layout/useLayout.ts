import { createContext, useContext } from "react";

interface LayoutContextValue {
  headerTitle: string;
  isSidebarCollapsed: boolean;
  setHeaderTitle: (title: string) => void;
  setIsSidebarCollapsed: (value: boolean) => void;
}

export const LayoutContext = createContext<LayoutContextValue | undefined>(
  undefined,
);

export const useLayout = () => {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return ctx;
};
