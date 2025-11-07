import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { CodeEditorStepperData } from "@/lib/providers/stepper/flows/CodeEditor";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./SuccessModal.module.scss";

export type DeploySuccessData = {
  data: CodeEditorStepperData;
  note?: string;
  resetFn: () => void;
  status: string;
};

export function SuccessModal({
  data,
  note,
  resetFn,
  status,
}: DeploySuccessData) {
  const navigate = useNavigate();
  const { close } = useModal();
  const { t } = useTranslation();
  const { agentIconUrl, agentId, agentName, environment, rhoLimit, version } =
    data;

  const onViewAgent = useCallback(() => {
    close();
    void navigate("/create-ai-agent");
  }, [close, navigate]);

  const onViewAllAgents = useCallback(() => {
    close();
    void navigate("/dashboard");
  }, [close, navigate]);

  const onCreateAnother = useCallback(() => {
    close();
    resetFn();
    void navigate("/create-ai-agent/create");
  }, [close, navigate, resetFn]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <IconPreview size={60} url={agentIconUrl} />

        <Text bold className={styles.title} color="primary" type="H3">
          {t("deploy.success.title", { agentName })}
        </Text>

        <Text className={styles.subtitle} color="secondary" type="normal">
          {t("deploy.success.subtitle")}
        </Text>
      </div>

      <div className={styles.details}>
        <Row label={t("deploy.labels.agentId")} value={agentId ?? ""} />
        <Row label={t("deploy.labels.environment")} value={environment ?? ""} />
        <Row label={t("deploy.labels.status")} value={status} />
        <Row label={t("deploy.rhoLimit")} value={`${rhoLimit}`} />
        <Row
          label={t("deploy.version")}
          value={version ?? t("deploy.version")}
        />
        {note ? (
          <Row multiline label={t("deploy.labels.note")} value={note} />
        ) : null}
      </div>

      <div className={styles.actions}>
        <Button type="primary" onClick={onViewAgent}>
          {t("agents.viewAgent")}
        </Button>
        <Button type="secondary" onClick={onViewAllAgents}>
          {t("agents.viewAll")}
        </Button>
        <Button type="subtle" onClick={onCreateAnother}>
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
