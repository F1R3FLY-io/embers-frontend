import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Text } from "@/lib/components/Text";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useStepper } from "@/lib/providers/stepper/useStepper";
import { useDeleteAgentMutation } from "@/lib/queries";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import EditIcon from "@/public/icons/editbig-icon.svg?react";
import TrashIcon from "@/public/icons/trash-icon.svg?react";

import styles from "./AgentsGrid.module.scss";

export interface Agent {
  createdAt?: Date;
  id: string;
  logo?: string | null;
  name: string;
  shard?: string;
  version: string;
}

interface AgentsGridProps {
  agents: Array<Agent>;
  isSuccess: boolean;
}

export function AgentsGrid({ agents, isSuccess }: AgentsGridProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { nextStep, reset, updateData } = useStepper();

  const createAiAgent = useCallback(() => {
    reset();
    void navigate("/create-ai-agent/create");
  }, [navigate, reset]);
  const deleteAgent = useDeleteAgentMutation();
  const confirm = useConfirm();

  const navigateToAgent = useCallback(
    (agent: Agent) => {
      updateData("agentId", agent.id);
      updateData("agentName", agent.name);
      updateData("version", agent.version);
      updateData("agentIconUrl", agent.logo ?? "");
      nextStep();
      void navigate(`/create-ai-agent`);
    },
    [navigate, nextStep, updateData],
  );

  const handleDelete = async (id: string, name: string) =>
    confirm({ message: `Are you sure you want to delete ${name} agent?` })
      .then((ok) => ok && deleteAgent.mutate(id))
      .catch(() => {});

  const formatUpdated = (value?: Date) => {
    return value ? value.toLocaleString() : "";
  };

  return (
    <>
      <div
        className={classNames(styles["grid-box"], styles["create-box"])}
        style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
        onClick={createAiAgent}
      >
        <AgentIcon className={styles["create-robot-icon"]} />
        <Text color="secondary" type="large">
          {t("agents.createNewAgent")}
        </Text>
      </div>

      {isSuccess &&
        agents.map((agent, index) => {
          const isDraft = !agent.shard;
          return (
            <div
              key={agent.id}
              className={classNames(styles["grid-box"], styles["agent-box"], {
                [styles["agent-draft"]]: isDraft,
              })}
              style={
                {
                  "--tile-delay": `${0.2 + index * 0.1}s`,
                } as React.CSSProperties
              }
              onClick={() => navigateToAgent(agent)}
            >
              <div className={styles["agent-top"]}>
                <Text color="secondary" type="small">
                  {t("agents.updated")} {formatUpdated(agent.createdAt)}
                </Text>
              </div>

              <div className={styles["agent-main"]}>
                <IconPreview
                  className={styles["agent-icon"]}
                  size={40}
                  url={agent.logo}
                />
                <Text color="primary" type="H4">
                  {agent.name}
                </Text>
              </div>

              <div
                className={styles["agent-actions"]}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles["agent-action-buttons"]}>
                  <Button
                    icon={<EditIcon />}
                    type="secondary"
                    onClick={() => navigateToAgent(agent)}
                  >
                    {t("agents.edit")}
                  </Button>
                  <Button type="primary" onClick={() => navigateToAgent(agent)}>
                    {t("agents.details")}
                  </Button>
                </div>

                <TrashIcon
                  className={styles["delete-icon"]}
                  role="button"
                  title={t("agents.delete")}
                  onClick={() => void handleDelete(agent.id, agent.name)}
                />
              </div>
            </div>
          );
        })}
    </>
  );
}
