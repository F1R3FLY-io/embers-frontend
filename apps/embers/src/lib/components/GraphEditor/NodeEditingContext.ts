import { createContext } from "react";

// Keep editor actions out of serialized node data, and hide editing controls
// when node templates are rendered outside an editable canvas.
export const NodeEditingContext = createContext<((id: string) => void) | null>(
  null,
);
