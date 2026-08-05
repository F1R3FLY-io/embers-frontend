import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";

import { Text } from "@/lib/components/Text";

import styles from "./ContextMenu.module.scss";

export type MenuItem = {
  content: string;
  hidden?: boolean;
  onClick: () => void;
  type: "text";
};

type ContextMenuProps = {
  /** Which edge of the menu meets the anchor point. The default suits a
   * pointer-anchored menu (opens rightward of the cursor); a menu hung from a
   * button corner wants "end" so its right edge tracks the button's. */
  align?: "start" | "center" | "end";
  direction?: "right" | "bottom" | "left" | "top";
  items: MenuItem[];
  onClose: () => void;
  open: boolean;
  position: {
    x: number;
    y: number;
  };
};

export function ContextMenu({
  align = "start",
  direction = "right",
  items,
  onClose,
  open,
  position,
}: ContextMenuProps) {
  return (
    <ControlledMenu
      align={align}
      anchorPoint={position}
      className={styles.themed}
      direction={direction}
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
