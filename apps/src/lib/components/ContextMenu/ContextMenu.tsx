import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";

import { Text } from "@/lib/components/Text";

export type ContextMenuItem = {
  content: string;
  hidden?: boolean;
  onClick: () => void;
  type: "text";
};

type ContextMenuProps = {
  items: ContextMenuItem[];
  onClose: () => void;
  open: boolean;
  position: {
    x: number;
    y: number;
  };
};

export function ContextMenu({ items, onClose, open, position }: ContextMenuProps) {
  return (
    <ControlledMenu
      anchorPoint={position}
      direction="right"
      state={open ? "open" : "closed"}
      onClose={onClose}
    >
      {items.map((item, index) =>
        item.hidden ? null : (
          <MenuItem key={index} onClick={item.onClick}>
            <Text type="normal">{item.content}</Text>
          </MenuItem>
        ),
      )}
    </ControlledMenu>
  );
}
