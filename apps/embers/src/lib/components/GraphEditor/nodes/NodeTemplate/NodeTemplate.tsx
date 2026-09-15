import type { HandleType, NodeProps, Position } from "@xyflow/react";
import type { FC, ReactNode } from "react";

import { Handle } from "@xyflow/react";
import classNames from "classnames";
import { useContext } from "react";

import { Text } from "@/lib/components/Text";
import { useAgents } from "@/lib/queries";
import SettingsIcon from "@/public/icons/settings-icon.svg?react";

import { NodeEditingContext } from "../../NodeEditingContext";
import { agentNodeStatus } from "../agentNodeStatus";
import styles from "./NodeTemplate.module.scss";

export type NodeTemplateProps = {
  className?: string;
  displayName: string;
  handlers?: {
    position: Position;
    type: HandleType;
  }[];
  icon: ReactNode;
  labelKey?: string;
  title: string;
};

/**
 * What each agent-node marking means, in the words shown to the author.
 *
 * Both conditions used to render as an ordinary node. `missing` in particular was
 * invisible until deploy failed in another process, because the graph carries the
 * agent's *name* -- so the node keeps drawing perfectly while its referent is gone.
 */
const STATUS_BADGE = {
  missing: "missing",
  stale: "outdated",
} as const;

const STATUS_TITLE = {
  missing:
    "This agent no longer exists. The team cannot be deployed until this node is replaced.",
  stale:
    "This agent has been edited since the team was built. The team still compiles the version pinned in this node.",
} as const;

export function NodeTemplate({
  className,
  displayName,
  handlers,
  icon,
  labelKey,
  title,
}: NodeTemplateProps) {
  const Node: FC<NodeProps> = ({ data, id, selected }) => {
    const editNode = useContext(NodeEditingContext);
    // One query shared by every node and by the sidebar: react-query dedupes on the
    // key, so marking each node costs a subscription rather than a read.
    const { data: agents } = useAgents();

    // Only the two problem states are drawn. `current` and `undefined` -- a
    // non-agent node, or agents not loaded yet -- must look exactly as before, so
    // that a marking always means something is wrong rather than merely unknown.
    const status = agentNodeStatus(data, agents?.agents);
    const marking = status === "current" ? undefined : status;

    const containerClassName = classNames(styles.container, className, {
      [styles.selected]: selected,
      [styles["agent-missing"]]: marking === "missing",
      [styles["agent-stale"]]: marking === "stale",
    });

    // Node kinds that name themselves per instance (agents) opt in via
    // `labelKey`; every built-in kind leaves it unset and keeps its title.
    const labelValue = labelKey === undefined ? undefined : data[labelKey];
    const label =
      typeof labelValue === "string" && labelValue !== "" ? labelValue : title;

    return (
      <div
        className={containerClassName}
        title={marking === undefined ? undefined : STATUS_TITLE[marking]}
      >
        <div className={styles.content}>
          {icon}
          <Text bold color="primary" type="normal">
            {label}
          </Text>
          {marking === undefined ? null : (
            <span className={styles["agent-badge"]}>
              {STATUS_BADGE[marking]}
            </span>
          )}
          {editNode && (
            <button
              aria-label={`Configure ${label}`}
              className={classNames(
                styles["settings-button"],
                "nodrag",
                "nopan",
              )}
              title={`Configure ${label}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                editNode(id);
              }}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <SettingsIcon
                aria-hidden="true"
                className={styles["settings-icon"]}
              />
            </button>
          )}
        </div>
        {handlers?.map(({ position, type }, index) => (
          <Handle
            key={index}
            className={styles.handle}
            position={position}
            type={type}
          />
        ))}
      </div>
    );
  };
  Node.displayName = displayName;

  return Node;
}
