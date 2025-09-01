import type React from "react";

import type { AccordionProps } from "@/lib/components/Accordion/Accordion";

import { Accordion } from "@/lib/components/Accordion";
import { NodeItem } from "@/lib/components/GraphEditor/nodes/SidebarNode";

import styles from "./Graph.module.scss";


const NodeAccordion = (props: AccordionProps) => {
  const closeIcon = <i className="fa fa-chevron-right" />;
  const openIcon = <i className="fa fa-chevron-down" />;
  return <Accordion {...props} className={styles.accordion} closedIcon={closeIcon} iconPosition="end" openedIcon={openIcon}/>
}

export const Sidebar: React.FC = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.body}>
        <NodeAccordion title="Sources">
          <NodeItem name="Manual Input" />
        </NodeAccordion>

        <NodeAccordion defaultOpen title="AI Agents">
          <NodeItem name="Health Data Analyzer" />
          <NodeItem name="Nutritional Planner Agent" />
        </NodeAccordion>

        <NodeAccordion title="Services">
          <NodeItem name="Placeholder Service" />
        </NodeAccordion>

        <NodeAccordion title="Secure">
          <NodeItem name="Placeholder Secure" />
        </NodeAccordion>

        <NodeAccordion title="Routing Logic">
          <NodeItem name="Placeholder Routing" />
        </NodeAccordion>

        <NodeAccordion title="Data package">
          <NodeItem name="Placeholder Data" />
        </NodeAccordion>

        <NodeAccordion title="Contracts">
          <NodeItem name="Placeholder Contract" />
        </NodeAccordion>

        <NodeAccordion title="Sinks">
          <NodeItem name="Placeholder Sink" />
        </NodeAccordion>
      </div>
      {/* Add Custom Component button */}
      <div className={styles["footer"]}>
        + Add Custom Component
      </div>
    </div>
  );
};