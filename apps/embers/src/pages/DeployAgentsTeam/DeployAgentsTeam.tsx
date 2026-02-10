import { PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import { useForm } from "@tanstack/react-form";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import z from "zod";

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

const formModel = z.object({
  inputPrompt: z.union([z.string(), z.undefined()]),
});

export default function DeployAgentsTeam() {
  const { t } = useTranslation();
  const { open } = useModal();
  const navigate = useNavigate();

  const { appendDeploy, appendLog } = useDock();

  const { data, navigateToPrevStep, navigateToStep, reset, step, updateData } =
    useGraphEditorStepper();

  const deployTeamsMutation = useMutationResultWithLoader(
    useDeployAgentsTeamMutation(),
  );

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

  const form = useForm({
    defaultValues: {
      inputPrompt: data.inputPrompt,
    },
    onSubmit: useCallbackWithLoader(async () => {
      try {
        const modalData = [
          { label: "deploy.labels.agentId", value: data.id },
          { label: "deploy.version", value: data.version },
          { label: "deploy.labels.status", value: "ok" },
          { label: "deploy.labels.note", value: data.description },
        ];

        const registryKey = PrivateKey.new();

        await deployTeamsMutation.mutateAsync(
          {
            agentsTeamId: data.id!,
            registryKey,
            registryVersion: 1n,
            rhoLimit: 1_000_000n,
            version: data.version!,
          },
          {
            onError: onFailedDeploy,
            onSuccess: () => {
              onSuccessfulDeploy(registryKey);
              updateData("hasGraphChanges", false);
              open(
                <SuccessModal
                  agentName={data.name}
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
      } catch (e) {
        onFailedDeploy(e as Error);
      }
    }),
    validators: {
      onChange: formModel,
    },
  });

  const handleSaveDraft = () => {};

  return (
    <div className={styles["deploy-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiTeam.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          steps={[
            t("deploy.generalInfo"),
            t("deploy.creation"),
            t("deploy.deployment"),
          ]}
        />
      </div>

      <form
        className={styles["content-container"]}
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div>
          <Text bold color="primary" type="H2">
            {data.name}
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
            <Input disabled placeholder={data.name} value={data.name} />
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("basic.description")}
            </Text>
            <Input
              disabled
              textarea
              placeholder={data.description || t("basic.description")}
              value={data.description}
            />
          </div>

          <form.Field name="inputPrompt">
            {(field) => (
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
                      textarea
                      error={
                        field.state.meta.isTouched && !field.state.meta.isValid
                      }
                      placeholder={t("deploy.enterInputPrompt")}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <div className={styles["button-container"]}>
                <Button
                  disabled={isSubmitting}
                  type="secondary"
                  onClick={navigateToPrevStep}
                >
                  {t("deploy.back")}
                </Button>

                <div className={styles["button-group"]}>
                  <Button
                    disabled={isSubmitting}
                    icon={<DraftIcon />}
                    type="secondary"
                    onClick={handleSaveDraft}
                  >
                    {t("basic.saveDraft")}
                  </Button>

                  <Button submit disabled={isSubmitting} type="primary">
                    {isSubmitting ? t("deploy.deploying") : t("deploy.deploy")}
                  </Button>
                </div>
              </div>
            )}
          </form.Subscribe>

          <LanguageFooter />
        </div>
      </form>
    </div>
  );
}
