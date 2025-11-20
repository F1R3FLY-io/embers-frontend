import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./SuccessModal.module.scss";

export type DeploySuccessData = {
  agentName: string;
  createAnother: () => void;
  data: Record<string, string | undefined>;
  iconUrl?: string;
  viewAgent: () => void;
  viewAllAgents: () => void;
};

export function SuccessModal({
  agentName,
  createAnother,
  data,
  iconUrl,
  viewAgent,
  viewAllAgents,
}: DeploySuccessData) {
  const { close } = useModal();
  const { t } = useTranslation();

  const handleViewAgent = useCallback(() => {
    close();
    viewAgent();
  }, [close, viewAgent]);

  const handleViewAllAgents = useCallback(() => {
    close();
    viewAllAgents();
  }, [close, viewAllAgents]);

  const handleCreateAnother = useCallback(() => {
    close();
    createAnother();
  }, [close, createAnother]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <IconPreview size={60} url={iconUrl} />

        <Text bold className={styles.title} color="primary" type="H3">
          {t("deploy.success.title", { agentName })}
        </Text>

        <Text className={styles.subtitle} color="secondary" type="normal">
          {t("deploy.success.subtitle")}
        </Text>
      </div>

      <div className={styles.details}>
        {Object.entries(data).map(([label, value], index) =>
          value ? <Row key={index} label={t(label)} value={value} /> : null,
        )}
      </div>

      <div className={styles.actions}>
        <Button type="primary" onClick={handleViewAgent}>
          {t("agents.viewAgent")}
        </Button>
        <Button type="secondary" onClick={handleViewAllAgents}>
          {t("agents.viewAll")}
        </Button>
        <Button type="subtle" onClick={handleCreateAnother}>
          {t("agents.createAnother")}
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  multiline,
  value,
}: {
  label: string;
  multiline?: boolean;
  value: string;
}) {
  return (
    <div className={styles.row}>
      <Text bold color="secondary" type="small">
        {label}
      </Text>
      <Text
        className={classNames(
          styles["row-value"],
          multiline && styles.multiline,
        )}
        color="primary"
        type="small"
      >
        {value}
      </Text>
    </div>
  );
}
