import type React from "react";

import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { AccordionProps } from "@/lib/components/Accordion/Accordion";
import type { NodeKind } from "@/lib/components/GraphEditor/nodes/nodes.registry";

import { Accordion } from "@/lib/components/Accordion";
import { NODE_REGISTRY } from "@/lib/components/GraphEditor/nodes/nodes.registry";
import { NodeItem } from "@/lib/components/GraphEditor/nodes/SidebarNode";
import { SearchControl } from "@/lib/components/SearchControl";
import { Select } from "@/lib/components/Select";
import { Text } from "@/lib/components/Text";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";
import { useAgents, useAgentsTeamVersions } from "@/lib/queries";
import defaultNodeIcon from "@/public/icons/placeholder-node.png";

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
  const { agentsTeam, update } = useCurrentAgentsTeam();
  const { data: versions } = useAgentsTeamVersions(agentsTeam.id);

  const [selectedVersion, setSelectedVersion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (agentsTeam.version) {
      setSelectedVersion(agentsTeam.version);
    }
  }, [agentsTeam.version]);

  const versionOptions = useMemo(
    () =>
      versions?.agentsTeams.map((v) => ({
        label: v.version,
        value: v.version,
      })) ?? [],
    [versions],
  );

  const { data: agentsData } = useAgents();

  // Every saved agent, deployed or not: the team splices an agent's code in, so
  // its own deploy is irrelevant here, and filtering on it would hide the agent
  // the user just wrote.
  const filteredAgents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (agentsData?.agents ?? [])
      .filter((agent) => agent.name.toLowerCase().includes(query))
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
      );
  }, [agentsData?.agents, searchQuery]);

  const filteredNodes = Object.entries(NODE_REGISTRY).filter(
    ([key, def]) =>
      // The generic agent kind is offered per agent below, never bare.
      key !== "agent" &&
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
              onChange={(version) => update({ version })}
            />
          )}

          <SearchControl
            placeholder="Type to search"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <NodeAccordion defaultOpen title="Your Agents">
          {filteredAgents.length === 0 ? (
            <Text color="secondary" type="small">
              {searchQuery.trim() === ""
                ? "No agents yet"
                : "No agents match your search"}
            </Text>
          ) : (
            filteredAgents.map((agent) => (
              <NodeItem
                key={agent.id}
                data={{
                  agentId: agent.id,
                  agentName: agent.name,
                  // Pin the concrete version: a team graph is append-only on
                  // chain and must keep compiling to the same thing.
                  agentVersion: agent.version,
                }}
                iconSrc={agent.logo ?? defaultNodeIcon}
                name={agent.name}
                type="agent"
              />
            ))
          )}
        </NodeAccordion>

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
