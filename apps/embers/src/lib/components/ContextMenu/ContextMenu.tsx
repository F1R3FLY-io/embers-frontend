import type { ReactNode } from "react";

import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";

type ContextMenuProps = {
  children: ReactNode | ReactNode[];
  onClose: () => void;
  open: boolean;
  position: {
    x: number;
    y: number;
  };
};

export function ContextMenu({
  children,
  onClose,
  open,
  position,
}: ContextMenuProps) {
  return (
    <ControlledMenu
      anchorPoint={position}
      direction="right"
      state={open ? "open" : "closed"}
      onClose={onClose}
    >
      {Array.isArray(children) ? (
        children.map((item, index) => <MenuItem key={index}>{item}</MenuItem>)
      ) : (
        <MenuItem>{children}</MenuItem>
      )}
    </ControlledMenu>
  );
}
