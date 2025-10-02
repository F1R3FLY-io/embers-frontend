import { t } from "i18next";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { Text } from "@/lib/components/Text";
import { useStepper } from "@/lib/providers/stepper/useStepper";
import { useDeployAgentMutation } from "@/lib/queries";
import DraftIcon from "@/public/icons/draft-icon.svg?react";

import Stepper from "./components/Stepper";
import styles from "./Deploy.module.scss";

function parseBigIntOrNull(v: string): bigint | null {
  try {
    if (!v.trim()) {
      return null;
    }
    return BigInt(v.trim());
  } catch {
    return null;
  }
}

export default function Deploy() {
  const { data, prevStep, step, updateData } = useStepper();
  const {agentId, version} = data;

  const navigate = useNavigate();

  const [rhoLimitInput, setRhoLimitInput] = useState("1000000");

  const deployMutation = useDeployAgentMutation();
  const isDeploying = deployMutation.isPending;

  const rhoLimit = parseBigIntOrNull(rhoLimitInput);
  const rhoLimitError = rhoLimitInput.trim() !== "" && rhoLimit === null;

  const canDeploy = !!agentId && !!rhoLimit && !rhoLimitError && !isDeploying && !!version;

  const agentName = data.agentName;

  const handleDeploy = () => {
    if (!canDeploy) {
      return;
    }

    deployMutation.mutate(
      { agentId, rhoLimit, version },
      {
        onError: (e) => {
          // eslint-disable-next-line no-console
          console.error("Deployment failed:", e);
        },
        onSuccess: () => {
          // todo add modal here
          void navigate("/dashboard");
        },
      },
    );
  };

  const backClick = useCallback(() => {
    prevStep();
    void navigate("/create-ai-agent");
  }, [navigate, prevStep]);

  return (
    <div className={styles["deploy-container"]}>
      <Text bold color="primary" fontSize={40} type="H2">
        {t("aiAgent.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          labels={[
            t("deploy.generalInfo"),
            t("deploy.creation"),
            t("deploy.deployment"),
          ]}
          steps={3}
        />
      </div>

      <div className={styles["content-container"]}>
        <div>
          <Text bold color="primary" fontSize={32} type="H2">
            { agentName }
          </Text>
          <div className={styles["description-container"]}>
            <Text color="secondary" fontSize={16} type="H4">
              {t("deploy.reviewDetails")}
            </Text>
          </div>
        </div>

        <div className={styles["details-container"]}>
          <Text bold color="primary" fontSize={20} type="H3">
            {t("deploy.agentDetails")}
          </Text>

          <div className={styles["form-section"]}>
            <Text color="secondary" fontSize={12}>
              {t("deploy.agentName")}
            </Text>
            <Input
              disabled
              inputType="input"
              placeholder={agentName}
              value={agentName}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text bold color="primary" fontSize={20} type="H3">
              {t("deploy.versionAndNotes")}
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" fontSize={12}>
                  {t("deploy.version")}
                </Text>
                <Input
                  disabled
                  inputType="input"
                  placeholder={version}
                  value={version}
                />
              </div>
              <div>
                <Text color="secondary" fontSize={12}>
                  {t("deploy.notes")}
                </Text>
                <Input
                  inputType="textarea"
                  placeholder={t("deploy.enterDeploymentNotes")}
                />
              </div>
            </div>
          </div>

          <div className={styles["form-section"]}>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" fontSize={12}>
                  {t("deploy.rhoLimit")}
                </Text>
                <Input
                  inputType="input"
                  placeholder={rhoLimitInput}
                  type="number"
                  value={rhoLimitInput}
                  onChange={(e) => {
                    updateData('rhoLimit', Number(e.target.value));
                    setRhoLimitInput(e.target.value);
                  }
                }
                />
              </div>
            </div>
          </div>

          <div className={styles["button-container"]}>
            <Button className={styles["back-button"]} type="secondary" onClick={() => backClick()}>
              {t("deploy.back")}
            </Button>

            <div className={styles["button-group"]}>
              <button className={styles["draft-button"]}>
                <DraftIcon />
                {t("basic.saveDraft")}
              </button>

              <button
                aria-busy={isDeploying}
                className={styles["deploy-button"]}
                disabled={!canDeploy}
                onClick={handleDeploy}
              >
                {isDeploying ? t("deploy.deploying") : t("deploy.deploy")}
              </button>
            </div>
          </div>

          <div className={styles["footer-container"]}>
            <LanguageSelect />
            <div className={styles["support-container"]}>
              <Text color="secondary" fontSize={14}>
                {t("deploy.havingTrouble")}
              </Text>
              <a className={styles["support-link"]} href="#">
                {t("deploy.contactSupport")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
