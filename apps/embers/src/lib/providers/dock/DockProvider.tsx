import type React from "react";

import { useEffect, useMemo, useReducer } from "react";

import { DockContext } from "./useDock";

export type LogLevel = "info" | "error";
export type LogEntry = {
  id: string;
  level: LogLevel;
  text: string;
  time: Date;
};
export type DeployEntry = { id: string; success: boolean; time: Date };

type OpenedState = { deploy: boolean; logs: boolean };
type UnreadState = { deploy: boolean; logs: boolean };

type State = {
  deploys: DeployEntry[];
  logs: LogEntry[];
  max: number;
  opened: OpenedState;
  unread: UnreadState;
};

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

type Action =
  | { entry: LogEntry; type: typeof ActionType.ADD_LOG }
  | {
      entry: DeployEntry;
      type: typeof ActionType.ADD_DEPLOY;
    }
  | { type: typeof ActionType.CLEAR_LOGS }
  | { type: typeof ActionType.CLEAR_DEPLOYS }
  | {
      max: number;
      type: typeof ActionType.SET_MAX;
    }
  | {
      isOpen: boolean;
      section: keyof OpenedState;
      type: typeof ActionType.SET_OPENED;
    }
  | {
      type: typeof ActionType.MARK_LOGS_READ;
    }
  | { type: typeof ActionType.MARK_DEPLOYS_READ };

function clamp<T>(arr: T[], max: number) {
  return arr.length > max ? arr.slice(arr.length - max) : arr;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.ADD_LOG:
      return {
        ...state,
        logs: clamp([action.entry, ...state.logs], state.max),
        unread: { ...state.unread, logs: true }, // new log ⇒ unread
      };
    case ActionType.ADD_DEPLOY:
      return {
        ...state,
        deploys: clamp([action.entry, ...state.deploys], state.max),
        unread: { ...state.unread, deploy: true },
      };
    case ActionType.CLEAR_LOGS:
      return { ...state, logs: [], unread: { ...state.unread, logs: false } };
    case ActionType.CLEAR_DEPLOYS:
      return {
        ...state,
        deploys: [],
        unread: { ...state.unread, deploy: false },
      };
    case ActionType.SET_MAX:
      return {
        ...state,
        deploys: clamp(state.deploys, action.max),
        logs: clamp(state.logs, action.max),
        max: action.max,
      };
    case ActionType.SET_OPENED:
      return {
        ...state,
        opened: { ...state.opened, [action.section]: action.isOpen },
      };
    case ActionType.MARK_LOGS_READ:
      return { ...state, unread: { ...state.unread, logs: false } };
    case ActionType.MARK_DEPLOYS_READ:
      return { ...state, unread: { ...state.unread, deploy: false } };
    default:
      return state;
  }
}

const OPENED_LS_KEY = "dockOpened";

function loadOpenedFromStorage(): OpenedState {
  try {
    const raw = localStorage.getItem(OPENED_LS_KEY);
    if (!raw) {
      return { deploy: false, logs: false };
    }
    const parsed = JSON.parse(raw) as Partial<OpenedState>;
    return {
      deploy: Boolean(parsed.deploy),
      logs: Boolean(parsed.logs),
    };
  } catch {
    return { deploy: false, logs: false };
  }
}

export type DockAPI = {
  appendDeploy: (success: boolean) => void;
  appendLog: (text: string, level?: LogLevel) => void;

  clearDeploys: () => void;
  clearLogs: () => void;
  deploys: DeployEntry[];
  logs: LogEntry[];
  markDeploysRead: () => void;
  markLogsRead: () => void;

  opened: OpenedState;
  setMaxEntries: (n: number) => void;
  setOpened: (section: keyof OpenedState, isOpen: boolean) => void;

  toggleOpened: (section: keyof OpenedState) => void;
  unread: UnreadState;
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
    opened: loadOpenedFromStorage(),
    unread: { deploy: false, logs: false },
  });

  useEffect(() => {
    try {
      localStorage.setItem(OPENED_LS_KEY, JSON.stringify(state.opened));
    } catch {
      // ignore storage errors
    }
  }, [state.opened]);

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
      markDeploysRead: () => dispatch({ type: ActionType.MARK_DEPLOYS_READ }),
      markLogsRead: () => dispatch({ type: ActionType.MARK_LOGS_READ }),

      opened: state.opened,
      setMaxEntries: (n) => dispatch({ max: n, type: ActionType.SET_MAX }),
      setOpened: (section, isOpen) =>
        dispatch({ isOpen, section, type: ActionType.SET_OPENED }),

      toggleOpened: (section) =>
        dispatch({
          isOpen: !state.opened[section],
          section,
          type: ActionType.SET_OPENED,
        }),
      unread: state.unread,
    }),
    [state],
  );

  return <DockContext.Provider value={api}>{children}</DockContext.Provider>;
}
