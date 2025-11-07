import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { Text } from "@/lib/components/Text";
import { useDock } from "@/lib/providers/dock/useDock";
import { useModal } from "@/lib/providers/modal/useModal";
import { useCodeEditorStepper } from "@/lib/providers/stepper/flows/CodeEditor";
import { useDeployAgentMutation } from "@/lib/queries";
import { SuccessModal } from "@/pages/Deploy/components/SuccessModal";
import { WarningModal } from "@/pages/Deploy/components/WarningModal";
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
  const { t } = useTranslation();
  const { data, reset, setStep, step, updateData } = useCodeEditorStepper();
  const { agentId, version } = data;
  const dock = useDock();
  const { open } = useModal();

  useEffect(() => {
    setStep(2);
  }, [setStep]);

  const navigate = useNavigate();

  const [rhoLimitInput, setRhoLimitInput] = useState("1000000");

  const deployMutation = useDeployAgentMutation();
  const isDeploying = deployMutation.isPending;

  const rhoLimit = parseBigIntOrNull(rhoLimitInput);
  const rhoLimitError = rhoLimitInput.trim() !== "" && rhoLimit === null;

  const canDeploy =
    !!agentId && !!rhoLimit && !rhoLimitError && !isDeploying && !!version;

  const agentName = data.agentName;

  const handleDeploy = () => {
    if (!canDeploy) {
      return;
    }

    deployMutation.mutate(
      { agentId, rhoLimit, version },
      {
        onError: (e) => {
          dock.appendDeploy(false);
          open(<WarningModal error={e.message} />, {
            ariaLabel: "Warning",
            maxWidth: 550,
          });
        },
        onSuccess: () => {
          dock.appendDeploy(true);
          open(
            <SuccessModal
              data={data}
              note="note"
              resetFn={() => reset()}
              status="status"
            />,
            {
              ariaLabel: "Success deploy",
              maxWidth: 550,
            },
          );
        },
      },
    );
  };

  const backClick = useCallback(() => {
    void navigate("/create-ai-agent");
  }, [navigate]);

  return (
    <div className={styles["deploy-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiAgent.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          steps={[
            {
              canClick: true,
              label: t("deploy.generalInfo"),
            },
            {
              canClick: true,
              label: t("deploy.creation"),
            },
            {
              canClick: false,
              label: t("deploy.deployment"),
            },
          ]}
        />
      </div>

      <div className={styles["content-container"]}>
        <div>
          <Text bold color="primary" type="H2">
            {agentName}
          </Text>
          <div className={styles["description-container"]}>
            <Text color="secondary" type="large">
              {t("deploy.reviewDetails")}
            </Text>
          </div>
        </div>

        <div className={styles["details-container"]}>
          <Text bold color="primary" type="H5">
            {t("deploy.agentDetails")}
          </Text>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
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
            <Text bold color="primary" type="H5">
              {t("deploy.versionAndNotes")}
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" type="small">
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
                <Text color="secondary" type="small">
                  {t("deploy.notes")}
                </Text>
                <Input
                  inputType="textarea"
                  placeholder={t("deploy.enterDeploymentNotes")}
                  onChange={(e) => {
                    updateData("description", e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles["form-section"]}>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" type="small">
                  {t("deploy.rhoLimit")}
                </Text>
                <Input
                  inputType="input"
                  placeholder={rhoLimitInput}
                  type="number"
                  value={rhoLimitInput}
                  onChange={(e) => {
                    updateData("rhoLimit", Number(e.target.value));
                    setRhoLimitInput(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles["button-container"]}>
            <Button type="secondary" onClick={() => backClick()}>
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
              <Text color="secondary" type="normal">
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
