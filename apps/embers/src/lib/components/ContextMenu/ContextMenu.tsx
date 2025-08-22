import type { ReactNode } from "react";

import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";

type ContextMenuProps = {
  items: {
    element: ReactNode;
    onClick: () => void;
  }[];
  onClose: () => void;
  open: boolean;
  position: {
    x: number;
    y: number;
  };
};

export function ContextMenu({
  items,
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
      {items.map((item, index) => (
        <MenuItem key={index} onClick={item.onClick}>
          {item.element}
        </MenuItem>
      ))}
    </ControlledMenu>
  );
}
