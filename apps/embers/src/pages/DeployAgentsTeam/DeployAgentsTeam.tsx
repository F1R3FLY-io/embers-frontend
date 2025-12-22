import { PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { SuccessModal } from "@/lib/components/Modal/SuccessModal";
import { WarningModal } from "@/lib/components/Modal/WarningModal";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useModal } from "@/lib/providers/modal/useModal";
import { useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";
import { useDeployAgentsTeamMutation } from "@/lib/queries";
import DraftIcon from "@/public/icons/draft-icon.svg?react";

import styles from "./DeployAgentsTeam.module.scss";

export default function DeployAgentsTeam() {
  const { t } = useTranslation();
  const { open } = useModal();
  const navigate = useNavigate();

  const { appendDeploy, appendLog } = useDock();

  const {
    data,
    navigateToPrevStep,
    navigateToStep,
    reset,
    setStep,
    step,
    updateData,
  } = useGraphEditorStepper();

  const deployTeamsMutation = useMutationResultWithLoader(
    useDeployAgentsTeamMutation(),
  );

  const [inputPrompt, setInputPrompt] = useState(data.inputPrompt ?? "");

  useEffect(() => {
    setStep(2);
  }, [setStep]);

  const [isDeploying, setIsDeploying] = useState(false);
  const canDeploy = !isDeploying;

  const backClick = useCallback(() => {
    navigateToPrevStep();
  }, [navigateToPrevStep]);

  const handleSaveDraft = () => {
    updateData("inputPrompt", inputPrompt);
  };

  const logError = useCallback(
    (err: Error) => appendLog(err.message, "error"),
    [appendLog],
  );

  const onSuccessfulDeploy = useCallback(
    (key: PrivateKey) => {
      updateData("lastDeployKey", key);
      appendDeploy(true);
    },
    [appendDeploy, updateData],
  );

  const onFailedDeploy = useCallback(
    (err: Error) => {
      appendDeploy(false);
      logError(err);
      open(
        <WarningModal
          error={err.message}
          reviewSettings={() => navigateToStep(1)}
          tryAgain={() => {}}
        />,
        {
          ariaLabel: "Warning",
          maxWidth: 550,
        },
      );
    },
    [appendDeploy, logError, navigateToStep, open],
  );

  const handleDeploy = useCallbackWithLoader(async () => {
    if (!canDeploy) {
      return;
    }

    try {
      if (data.agentId && data.version) {
        const modalData = [
          { label: "deploy.labels.agentId", value: data.agentId },
          { label: "deploy.version", value: data.version },
          { label: "deploy.labels.status", value: "ok" },
          { label: "deploy.labels.note", value: data.description },
        ];

        setIsDeploying(true);
        handleSaveDraft();
        const registryKey = PrivateKey.new();

        await deployTeamsMutation.mutateAsync(
          {
            agentsTeamId: data.agentId,
            registryKey,
            registryVersion: 1n,
            rhoLimit: 1_000_000n,
            version: data.version,
          },
          {
            onError: onFailedDeploy,
            onSuccess: () => {
              onSuccessfulDeploy(registryKey);
              updateData("hasGraphChanges", false);
              open(
                <SuccessModal
                  agentName={data.agentName}
                  createAnother={() => {
                    reset();
                    navigateToStep(0);
                  }}
                  data={modalData}
                  viewAgent={() => navigateToStep(1)}
                  viewAllAgents={() => void navigate("/dashboard")}
                />,
                {
                  ariaLabel: "Success deploy",
                  closeOnBlur: false,
                  closeOnEsc: false,
                  maxWidth: 550,
                },
              );
            },
          },
        );
        setIsDeploying(false);
      }
    } catch (e) {
      onFailedDeploy(e as Error);
    }
  });

  return (
    <div className={styles["deploy-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiTeam.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          steps={[
            { canClick: true, label: t("deploy.generalInfo") },
            {
              canClick: true,
              label: t("deploy.creation"),
            },
            { canClick: false, label: t("deploy.deployment") },
          ]}
          onStepClick={(index) => navigateToStep(index)}
        />
      </div>

      <div className={styles["content-container"]}>
        <div>
          <Text bold color="primary" type="H2">
            {data.agentName}
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
              {t("aiTeam.teamName")}
            </Text>
            <Input
              disabled
              inputType="input"
              placeholder={data.agentName}
              value={data.agentName}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("basic.description")}
            </Text>
            <Input
              disabled
              inputType="textarea"
              placeholder={data.description || t("basic.description")}
              value={data.description}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text bold color="primary" type="H5">
              {t("deploy.welcomeInterface")}
            </Text>

            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" type="small">
                  {t("deploy.inputPrompt")}
                </Text>
                <Input
                  inputType="textarea"
                  placeholder={t("deploy.enterInputPrompt")}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles["button-container"]}>
            <Button type="secondary" onClick={backClick}>
              {t("deploy.back")}
            </Button>

            <div className={styles["button-group"]}>
              <Button
                icon={<DraftIcon />}
                type="secondary"
                onClick={handleSaveDraft}
              >
                {t("basic.saveDraft")}
              </Button>

              <Button
                aria-busy={isDeploying}
                disabled={!canDeploy}
                type="primary"
                onClick={handleDeploy}
              >
                {isDeploying ? t("deploy.deploying") : t("deploy.deploy")}
              </Button>
            </div>
          </div>

          <LanguageFooter />
        </div>
      </div>
    </div>
  );
}
