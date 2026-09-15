import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { TranslationKey } from "@/i18n";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";

import styles from "./SuccessModal.module.scss";

export type DeploySuccessData = {
  agentName: string;
  data: { label: TranslationKey; value?: string }[];
  /** The handle the team was published under, used to build its profile link. */
  handle?: string;
  iconUrl?: string;
  /** Stops the team answering mentions. Omit to hide the action. */
  onUnpublish?: () => void;
};

export function SuccessModal({
  agentName,
  data,
  handle,
  iconUrl,
  onUnpublish,
}: DeploySuccessData) {
  const { close } = useModal();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Only offered when there is somewhere to go. Both this and Unpublish used to
  // close the modal and do nothing else, which reads as success: the user believes
  // the team was unpublished while it carries on answering mentions.
  const profileUrl =
    window.FIRESKY_URL && handle
      ? `${window.FIRESKY_URL}/profile/${handle}`
      : undefined;

  const handleViewOnFiresky = useCallback(() => {
    if (!profileUrl) {
      return;
    }
    close();
    window.open(profileUrl, "_blank", "noopener,noreferrer");
  }, [close, profileUrl]);

  const handleBackToDashboard = useCallback(() => {
    close();
    void navigate("/dashboard");
  }, [close, navigate]);

  const handleUnpublish = useCallback(() => {
    close();
    onUnpublish?.();
  }, [close, onUnpublish]);

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
        {profileUrl === undefined ? null : (
          <Button type="primary" onClick={handleViewOnFiresky}>
            {t("publish.view")}
          </Button>
        )}
        <Button type="secondary" onClick={handleBackToDashboard}>
          {t("publish.backToDashboard")}
        </Button>
        {onUnpublish === undefined ? null : (
          <Button type="subtle" onClick={handleUnpublish}>
            {t("publish.unpublish")}
          </Button>
        )}
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
