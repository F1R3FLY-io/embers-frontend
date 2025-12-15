import { createContext, useContext } from "react";

import type { DockAPI } from "@/lib/providers/dock/DockProvider";

export const ActionType = {
  ADD_DEPLOY: "ADD_DEPLOY",
  ADD_LOG: "ADD_LOG",
  CLEAR_DEPLOYS: "CLEAR_DEPLOYS",
  CLEAR_LOGS: "CLEAR_LOGS",
  MARK_DEPLOYS_READ: "MARK_DEPLOYS_READ",
  MARK_LOGS_READ: "MARK_LOGS_READ",
  SET_MAX: "SET_MAX",
  SET_OPENED: "SET_OPENED",
} as const;

export const DockContext = createContext<DockAPI | null>(null);

export function useDock() {
  const ctx = useContext(DockContext);
  if (!ctx) {
    throw new Error("useDock must be used within DockProvider");
  }
  return ctx;
}
