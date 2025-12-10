import type React from "react";

import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { AccordionProps } from "@/lib/components/Accordion/Accordion";
import type { NodeKind } from "@/lib/components/GraphEditor/nodes/nodes.registry";

import { Accordion } from "@/lib/components/Accordion";
import { NODE_REGISTRY } from "@/lib/components/GraphEditor/nodes/nodes.registry";
import { NodeItem } from "@/lib/components/GraphEditor/nodes/SidebarNode";
import { Select } from "@/lib/components/Select";
import { Text } from "@/lib/components/Text";
import { useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";
import { useAgentsTeamVersions } from "@/lib/queries";
import { SearchControl } from "@/pages/Dashboard/components/SearchControl";

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
  const { data, updateData } = useGraphEditorStepper();
  const { data: versions } = useAgentsTeamVersions(data.agentId);

  const [selectedVersion, setSelectedVersion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (data.version) {
      setSelectedVersion(data.version);
    }
  }, [data.version]);

  const versionOptions = useMemo(
    () =>
      versions
        ? versions.agentsTeams.map((v) => ({
            label: v.version,
            value: v.version,
          }))
        : [],
    [versions],
  );

  const filteredNodes = Object.entries(NODE_REGISTRY).filter(([, def]) =>
    def.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <div className={styles.sidebar}>
      <div className={styles.body}>
        <div className={styles["sidebar-controls"]}>
          {versions && (
            <Select
              options={versionOptions}
              value={selectedVersion}
              onChange={(ver) => {
                setSelectedVersion(ver);
                updateData("version", ver);
              }}
            />
          )}

          <SearchControl
            placeholder="Type to search"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <NodeAccordion defaultOpen title="All Nodes">
          {filteredNodes.map(([key, def]) => (
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
