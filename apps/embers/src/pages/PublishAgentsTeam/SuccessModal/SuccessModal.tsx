import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./SuccessModal.module.scss";

export type DeploySuccessData = {
  agentName: string;
  data: { label: string; value?: string }[];
  iconUrl?: string;
};

export function SuccessModal({ agentName, data, iconUrl }: DeploySuccessData) {
  const { close } = useModal();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleViewOnFiresky = useCallback(() => {
    close();
    //http ref?
  }, [close]);

  const handleBackToDashboard = useCallback(() => {
    close();
    void navigate("/dashboard");
  }, [close, navigate]);

  const handleUnpublish = useCallback(() => {
    close();
  }, [close]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <IconPreview size={60} url={iconUrl} />

        <Text bold className={styles.title} color="primary" type="H3">
          {t("publish.success.title", { agentName })}
        </Text>

        <Text className={styles.subtitle} color="secondary" type="normal">
          {t("publish.success.subtitle")}
        </Text>
      </div>

      <div className={styles.details}>
        {data.map((row, index) =>
          row.value ? (
            <Row key={index} label={t(row.label)} value={row.value} />
          ) : null,
        )}
      </div>

      <div className={styles.actions}>
        <Button type="primary" onClick={handleViewOnFiresky}>
          {t("publish.view")}
        </Button>
        <Button type="secondary" onClick={handleBackToDashboard}>
          {t("publish.backToDashboard")}
        </Button>
        <Button type="subtle" onClick={handleUnpublish}>
          {t("publish.unpublish")}
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
