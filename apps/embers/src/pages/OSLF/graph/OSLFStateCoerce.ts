export type OslfFieldValue = string;

export type OslfFields = Record<string, OslfFieldValue>;

export type OslfInput = {
  block: OslfBlock;
};

export type OslfInputs = Record<string, OslfInput | undefined>;

export type OslfBlock = {
  fields?: OslfFields;
  id: string;
  inputs?: OslfInputs;
  type: string;
  x?: number;
  y?: number;
};

export type OslfBlocksState = {
  blocks: OslfBlock[];
  languageVersion: number;
};

export type OslfWorkspaceState = {
  blocks: OslfBlocksState;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function coerceOslfWorkspaceState(
  value: object | null,
): OslfWorkspaceState | null {
  if (!value) {
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }

  const blocks = value.blocks;
  if (!isRecord(blocks)) {
    return null;
  }

  const languageVersion = blocks.languageVersion;
  const blockList = blocks.blocks;

  if (typeof languageVersion !== "number") {
    return null;
  }
  if (!Array.isArray(blockList)) {
    return null;
  }

  return value as unknown as OslfWorkspaceState;
}
