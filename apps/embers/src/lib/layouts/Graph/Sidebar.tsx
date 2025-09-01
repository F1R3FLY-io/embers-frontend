import type React from "react";

import type { AccordionProps } from "@/lib/components/Accordion/Accordion";

import { Accordion } from "@/lib/components/Accordion";
import { nodeTypes } from "@/lib/components/GraphEditor/nodes";
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
  return (
    <div className={styles.sidebar}>
      <div className={styles.body}>
        <NodeAccordion defaultOpen title="All Nodes">
          {Object.keys(nodeTypes).map((key) => (
            <NodeItem key={key} name={key} type={key} />
          ))}
        </NodeAccordion>

        <NodeAccordion title="AI Agents">
          <NodeItem name="Health Data Analyzer" />
          <NodeItem name="Nutritional Planner Agent" />
        </NodeAccordion>

        <NodeAccordion title="Services">
          <NodeItem name="Placeholder Service" />
        </NodeAccordion>
      </div>
      {/* Add Custom Component button */}
      <div className={styles["sidebar-footer"]}>
        <Text bold color="hover" type="normal">
          <i className={`fa fa-plus ${styles["plus-icon"]}`} /> Add Custom
          Component
        </Text>
      </div>
    </div>
  );
};
