import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { FromModel } from "@/lib/components/AgentsTeamGeneralInfoFrom";

import { AgentsTeamGeneralInfoFrom } from "@/lib/components/AgentsTeamGeneralInfoFrom";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";

import styles from "./CreateAgentsTeam.module.scss";

export default function CreateAgentsTeam() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { agentsTeam, update } = useCurrentAgentsTeam();

  const onSubmit = useCallback(
    (state: FromModel) => {
      update(state);
      void navigate("/agents-team/edit");
    },
    [update, navigate],
  );
  const onCancel = useCallback(() => void navigate("/dashboard"), [navigate]);

  return (
    <div className={styles["create-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiTeam.create")}
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
            {t("aiTeam.tellUsAboutYourTeam")}
          </Text>
        </div>

        <AgentsTeamGeneralInfoFrom
          initialData={{
            description: agentsTeam.description,
            execType: agentsTeam.execType ?? "function",
            flowType: agentsTeam.flowType ?? "parallel",
            iconUrl: agentsTeam.iconUrl,
            language: agentsTeam.language ?? "en",
            name: agentsTeam.name ?? "",
          }}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
