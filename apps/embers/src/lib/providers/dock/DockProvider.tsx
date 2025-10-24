// DockProvider.tsx
import type React from "react";

import { useMemo, useReducer } from "react";

import { DockContext } from "./useDock";

export type LogLevel = "info" | "error";
export type LogEntry = {
  id: string;
  level: LogLevel;
  text: string;
  time: Date;
};
export type DeployEntry = { id: string; success: boolean; time: Date };

type State = {
  deploys: DeployEntry[];
  logs: LogEntry[];
  max: number;
};

export const ActionType = {
  ADD_DEPLOY: "ADD_DEPLOY",
  ADD_LOG: "ADD_LOG",
  CLEAR_DEPLOYS: "CLEAR_DEPLOYS",
  CLEAR_LOGS: "CLEAR_LOGS",
  SET_MAX: "SET_MAX",
} as const;

type Action =
  | { entry: LogEntry; type: typeof ActionType.ADD_LOG }
  | { entry: DeployEntry; type: typeof ActionType.ADD_DEPLOY }
  | { type: typeof ActionType.CLEAR_LOGS }
  | { type: typeof ActionType.CLEAR_DEPLOYS }
  | { max: number; type: typeof ActionType.SET_MAX };

function clamp<T>(arr: T[], max: number) {
  return arr.length > max ? arr.slice(arr.length - max) : arr;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.ADD_LOG:
      return {
        ...state,
        logs: clamp([...state.logs, action.entry], state.max),
      };
    case ActionType.ADD_DEPLOY:
      return {
        ...state,
        deploys: clamp([...state.deploys, action.entry], state.max),
      };
    case ActionType.CLEAR_LOGS:
      return { ...state, logs: [] };
    case ActionType.CLEAR_DEPLOYS:
      return { ...state, deploys: [] };
    case ActionType.SET_MAX:
      return {
        ...state,
        deploys: clamp(state.deploys, action.max),
        logs: clamp(state.logs, action.max),
        max: action.max,
      };
    default:
      return state;
  }
}

export type DockAPI = {
  appendDeploy: (success: boolean) => void;
  appendLog: (text: string, level?: LogLevel) => void;

  clearDeploys: () => void;
  clearLogs: () => void;
  deploys: DeployEntry[];
  logs: LogEntry[];
  setMaxEntries: (n: number) => void;
};

export function DockProvider({
  children,
  maxEntries = 1000,
}: {
  children: React.ReactNode;
  maxEntries?: number;
}) {
  const [state, dispatch] = useReducer(reducer, {
    deploys: [],
    logs: [],
    max: maxEntries,
  });

  const api = useMemo<DockAPI>(
    () => ({
      appendDeploy: (success) =>
        dispatch({
          entry: { id: crypto.randomUUID(), success, time: new Date() },
          type: ActionType.ADD_DEPLOY,
        }),
      appendLog: (text, level = "info") =>
        dispatch({
          entry: { id: crypto.randomUUID(), level, text, time: new Date() },
          type: ActionType.ADD_LOG,
        }),
      clearDeploys: () => dispatch({ type: ActionType.CLEAR_DEPLOYS }),
      clearLogs: () => dispatch({ type: ActionType.CLEAR_LOGS }),
      deploys: state.deploys,
      logs: state.logs,
      setMaxEntries: (n) => dispatch({ max: n, type: ActionType.SET_MAX }),
    }),
    [state],
  );

  return <DockContext.Provider value={api}>{children}</DockContext.Provider>;
}
