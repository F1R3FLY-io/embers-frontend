import type React from "react";

import classNames from "classnames";
import { useTranslation } from "react-i18next";

import type { AccordionProps } from "@/lib/components/Accordion/Accordion";
import type { NodeKind } from "@/lib/components/GraphEditor/nodes/nodes.registry";

import { Accordion } from "@/lib/components/Accordion";
import { NODE_REGISTRY } from "@/lib/components/GraphEditor/nodes/nodes.registry";
import { NodeItem } from "@/lib/components/GraphEditor/nodes/SidebarNode";
import { Text } from "@/lib/components/Text";

import styles from "./Graph.module.scss";

const NodeAccordion = (props: AccordionProps) => {
  const closeIcon = <i className="fa fa-chevron-right" />;
  const openIcon = <i className="fa fa-chevron-down" />;
  return (
    <Accordion
      {...props}
      closedIcon={closeIcon}
      iconPosition="end"
      openedIcon={openIcon}
      overflow="hidden"
    />
  );
};

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.sidebar}>
      <div className={styles.body}>
        <NodeAccordion defaultOpen title="All Nodes">
          {Object.entries(NODE_REGISTRY).map(([key, def]) => (
            <NodeItem
              key={key}
              iconSrc={def.iconSrc}
              name={def.displayName}
              type={key as NodeKind}
            />
          ))}
        </NodeAccordion>
      </div>

      <div className={styles["sidebar-footer"]}>
        <Text bold color="hover" type="normal">
          <i className={classNames("fa fa-plus", styles["plus-icon"])} />
          {t("graphEditor.addCustomComponent")}
        </Text>
      </div>
    </div>
  );
};
