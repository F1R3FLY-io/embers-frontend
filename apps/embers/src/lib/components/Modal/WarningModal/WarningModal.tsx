import { useTranslation } from "react-i18next";

import { Button } from "@/lib/components/Button";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";
import WarningIcon from "@/public/icons/warning-modal-icon.svg?react";

import styles from "./WarningModal.module.scss";

export interface DeployFailedModalProps {
  error: string;
  reviewSettings: () => void;
  tryAgain: () => void;
}

export function WarningModal({
  error,
  reviewSettings,
  tryAgain,
}: DeployFailedModalProps) {
  const { close } = useModal();
  const { t } = useTranslation();

  const handleTryAgain = () => {
    close();
    tryAgain();
  };

  const handleReviewSettings = () => {
    close();
    reviewSettings();
  };

  const cancel = () => close();

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <WarningIcon className={styles["warning-icon"]} />

        <Text bold className={styles.title} color="primary" type="H5">
          {t("deploy.failure.title")}
        </Text>

        <Text className={styles.subtitle} color="secondary" type="normal">
          {t("deploy.failure.subtitle")}
        </Text>

        <Text className={styles.subtitle} color="primary" type="normal">
          {error}
        </Text>
      </div>

      <div className={styles.actions}>
        <Button type="primary" onClick={handleTryAgain}>
          {t("deploy.failure.tryAgain")}
        </Button>

        <Button type="secondary" onClick={handleReviewSettings}>
          {t("deploy.failure.reviewSettings")}
        </Button>

        <Button type="subtle" onClick={cancel}>
          {t("basic.cancel")}
        </Button>
      </div>
    </div>
  );
}
