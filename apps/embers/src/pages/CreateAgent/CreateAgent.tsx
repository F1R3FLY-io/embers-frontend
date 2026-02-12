import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { FromModel } from "@/lib/components/AgentGeneralInfoFrom";

import { AgentGeneralInfoFrom } from "@/lib/components/AgentGeneralInfoFrom";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useCurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";

import styles from "./CreateAgent.module.scss";

export default function CreateAgent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { update } = useCurrentAgent();

  const onSubmit = useCallback(
    (state: FromModel) => {
      update(state);
      void navigate("/agent/edit");
    },
    [update, navigate],
  );
  const onCancel = useCallback(() => void navigate("/dashboard"), [navigate]);

  return (
    <div className={styles["create-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiAgent.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={0}
          steps={[
            t("deploy.generalInfo"),
            t("deploy.creation"),
            t("deploy.deployment"),
          ]}
        />
      </div>

      <div className={styles["content-container"]}>
        <div className={styles["title-container"]}>
          <Text bold color="primary" type="H2">
            {t("agents.tellUsAboutYourAgent")}
          </Text>
        </div>
        <AgentGeneralInfoFrom onCancel={onCancel} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
