import type { AgentsTeamHeader } from "@f1r3fly-io/embers-client-sdk";

import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Text } from "@/lib/components/Text";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useDeleteAgentMutation } from "@/lib/queries";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import DraftIcon from "@/public/icons/draft-icon.svg?react";
import EditIcon from "@/public/icons/editbig-icon.svg?react";
import TrashIcon from "@/public/icons/trash-icon.svg?react";

import styles from "./AgentTeamsGrid.module.scss";

interface AgentTeamsGridProps {
  agents: Array<AgentsTeamHeader>;
  isSuccess: boolean;
}

export function AgentTeamsGrid({ agents, isSuccess }: AgentTeamsGridProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createAiAgent = useCallback(() => {
    void navigate("/create-ai-team/create");
  }, [navigate]);

  const deleteAgent = useDeleteAgentMutation();
  const confirm = useConfirm();

  const navigateToAgent = useCallback(
    (agent: AgentsTeamHeader) => {
      void navigate("/create-ai-team", {
        state: {
          agentIconUrl: agent.logo,
          agentId: agent.id,
          agentName: agent.name,
          description: agent.description,
          lastDeploy: agent.lastDeploy,
          version: agent.version,
        },
      });
    },
    [navigate],
  );

  const handleDelete = async (id: string, name: string) =>
    confirm({ message: `Are you sure you want to delete ${name} agent?` })
      .then((ok) => ok && deleteAgent.mutate(id))
      .catch(() => {});

  const formatUpdated = (value?: Date) => (value ? value.toLocaleString() : "");

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
          const isDraft = !agent.lastDeploy;

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
              <div className={styles["agent-main"]}>
                <IconPreview
                  className={styles["agent-icon"]}
                  size={40}
                  url={agent.logo}
                />

                <div className={styles["agent-meta"]}>
                  <Text color="secondary" type="small">
                    {t("agents.updated")} {formatUpdated(agent.createdAt)}
                  </Text>

                  {isDraft && (
                    <div className={styles["draft-container"]}>
                      <DraftIcon className={styles["draft-icon"]} />
                      <Text color="hover" type="normal">
                        Draft
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              <Text color="primary" type="H4">
                {agent.name}
              </Text>

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
