import { createContext, useContext } from "react";

import type { DockAPI } from "@/lib/providers/dock/DockProvider";

export const DockContext = createContext<DockAPI | null>(null);

export function useDock() {
  const ctx = useContext(DockContext);
  if (!ctx) {
    throw new Error("useDock must be used within DockProvider");
  }
  return ctx;
}
