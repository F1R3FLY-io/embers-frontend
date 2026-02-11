import type { OslfHeader } from "@f1r3fly-io/embers-client-sdk";

import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Text } from "@/lib/components/Text";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useDeleteOslfMutation } from "@/lib/queries";
import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";
import DraftIcon from "@/public/icons/draft-icon.svg?react";
import EditIcon from "@/public/icons/editbig-icon.svg?react";
import TrashIcon from "@/public/icons/trash-icon.svg?react";

import styles from "./GraphicalQuery.module.scss";

interface AgentsGridProps {
  isSuccess: boolean;
  queries: OslfHeader[];
}

export function GraphicalQueryGrid({ isSuccess, queries }: AgentsGridProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createOSLF = useCallback(() => {
    void navigate("/oslf/create");
  }, [navigate]);

  const deleteOSLF = useMutationResultWithLoader(useDeleteOslfMutation());
  const confirm = useConfirm();

  const navigateToAgent = useCallback(
    (oslf: OslfHeader) => {
      void navigate("/oslf", {
        state: {
          description: oslf.description,
          id: oslf.id,
          name: oslf.name,
          version: oslf.version,
        },
      });
    },
    [navigate],
  );

  const handleDelete = async (id: string, name: string) =>
    confirm({ message: `Are you sure you want to delete ${name}?` })
      .then((ok) => ok && deleteOSLF.mutate(id))
      .catch(() => {});

  const formatUpdated = (value?: Date) => (value ? value.toLocaleString() : "");

  return (
    <>
      <div
        className={classNames(styles["grid-box"], styles["create-box"])}
        style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
        onClick={createOSLF}
      >
        <AgentIcon className={styles["create-robot-icon"]} />
        <Text color="secondary" type="large">
          {t("agents.createNewAgent")}
        </Text>
      </div>

      {isSuccess &&
        queries.map((query, index) => {
          const isDraft = false; //we should add isDeployed here as well

          return (
            <div
              key={query.id}
              className={classNames(styles["grid-box"], styles["agent-box"], {
                [styles["agent-draft"]]: isDraft,
              })}
              style={
                {
                  "--tile-delay": `${0.2 + index * 0.1}s`,
                } as React.CSSProperties
              }
              onClick={() => navigateToAgent(query)}
            >
              <div className={styles["agent-main"]}>
                <IconPreview
                  className={styles["agent-icon"]}
                  size={40}
                  url={undefined} //for now
                />

                <div className={styles["agent-meta"]}>
                  <Text color="secondary" type="small">
                    {t("agents.updated")} {formatUpdated(query.createdAt)}
                  </Text>

                  {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
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
                {query.name}
              </Text>

              <div
                className={styles["agent-actions"]}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles["agent-action-buttons"]}>
                  <Button
                    icon={<EditIcon />}
                    type="secondary"
                    onClick={() => navigateToAgent(query)}
                  />
                  <Button type="primary" onClick={() => navigateToAgent(query)}>
                    {t("agents.details")}
                  </Button>
                </div>

                <TrashIcon
                  className={styles["delete-icon"]}
                  role="button"
                  title={t("agents.delete")}
                  onClick={() => void handleDelete(query.id, query.name)}
                />
              </div>
            </div>
          );
        })}
    </>
  );
}
