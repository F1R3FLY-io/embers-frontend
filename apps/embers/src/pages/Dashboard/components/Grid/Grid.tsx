import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Text } from "@/lib/components/Text";
import DraftIcon from "@/public/icons/draft-icon.svg?react";
import EditIcon from "@/public/icons/editbig-icon.svg?react";
import TrashIcon from "@/public/icons/trash-icon.svg?react";

import styles from "./Grid.module.scss";

export interface Entity {
  createdAt: Date;
  id: string;
  logo?: string;
  name: string;
  type: "normal" | "draft";
}

interface GridProps {
  data: Entity[];
  icon: React.ComponentType<React.SVGProps<never>>;
  onCreate: () => void;
  onDelete: (id: string, name: string) => void;
  onNavigate: (id: string) => void;
  onPublish?: (id: string) => void;
  title: string;
}

export function Grid({
  data,
  icon,
  onCreate,
  onDelete,
  onNavigate,
  onPublish,
  title,
}: GridProps) {
  const { t } = useTranslation();

  const Icon = icon;

  return (
    <>
      <div
        className={classNames(styles["grid-box"], styles["create-box"])}
        style={{ "--tile-delay": "0.1s" } as React.CSSProperties}
        onClick={onCreate}
      >
        <Icon className={styles["create-robot-icon"]} />
        <Text color="secondary" type="large">
          {title}
        </Text>
      </div>

      {data.map((entry, index) => (
        <div
          key={entry.id}
          className={classNames(styles["grid-box"], styles["agent-box"], {
            [styles["agent-draft"]]: entry.type === "draft",
          })}
          style={
            {
              "--tile-delay": `${0.2 + index * 0.1}s`,
            } as React.CSSProperties
          }
          onClick={() => onNavigate(entry.id)}
        >
          <div className={styles["agent-main"]}>
            <IconPreview
              className={styles["agent-icon"]}
              size={40}
              url={entry.logo}
            />

            <div className={styles["agent-meta"]}>
              <Text color="secondary" type="small">
                {t("agents.updated")} {entry.createdAt.toLocaleString()}
              </Text>

              {entry.type === "draft" && (
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
            {entry.name}
          </Text>

          <div
            className={styles["agent-actions"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["agent-action-buttons"]}>
              <Button
                icon={<EditIcon />}
                type="secondary"
                onClick={() => onNavigate(entry.id)}
              />
              <Button type="primary" onClick={() => onNavigate(entry.id)}>
                {t("agents.details")}
              </Button>

              {onPublish && (
                <Button type="subtle" onClick={() => onPublish(entry.id)}>
                  {t("agents.publish")}
                </Button>
              )}
            </div>

            <TrashIcon
              className={styles["delete-icon"]}
              role="button"
              title={t("agents.delete")}
              onClick={() => onDelete(entry.id, entry.name)}
            />
          </div>
        </div>
      ))}
    </>
  );
}
