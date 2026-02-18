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
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useModal } from "@/lib/providers/modal/useModal";
import { useDeployAgentsTeamMutation } from "@/lib/queries";

import styles from "./DeployAgentsTeam.module.scss";

const formModel = z.object({
  inputPrompt: z.union([z.string(), z.undefined()]),
});

export default function DeployAgentsTeam() {
  const { t } = useTranslation();
  const { open } = useModal();
  const navigate = useNavigate();

  const { appendDeploy, appendLog } = useDock();
  const { agentsTeam, reset, update } = useCurrentAgentsTeam();

  const deployTeamsMutation = useMutationResultWithLoader(
    useDeployAgentsTeamMutation(),
  );

  const logError = useCallback(
    (err: Error) => appendLog(err.message, "error"),
    [appendLog],
  );

  const onSuccessfulDeploy = useCallback(
    (key: PrivateKey) => {
      update({ lastDeployKey: key });
      appendDeploy(true);
    },
    [appendDeploy, update],
  );

  const toEdit = useCallback(
    () => void navigate("/agents-team/edit"),
    [navigate],
  );

  const onFailedDeploy = useCallback(
    (err: Error) => {
      appendDeploy(false);
      logError(err);
      open(
        <WarningModal
          error={err.message}
          reviewSettings={toEdit}
          tryAgain={() => {}}
        />,
        {
          ariaLabel: "Warning",
          maxWidth: 550,
        },
      );
    },
    [appendDeploy, toEdit, logError, open],
  );

  const form = useForm({
    defaultValues: {
      inputPrompt: agentsTeam.inputPrompt,
    },
    onSubmit: useCallbackWithLoader(async () => {
      try {
        const modalData = [
          { label: "deploy.labels.agentId" as const, value: agentsTeam.id },
          { label: "deploy.version" as const, value: agentsTeam.version },
          { label: "deploy.labels.status" as const, value: "ok" },
          {
            label: "deploy.labels.note" as const,
            value: agentsTeam.description,
          },
        ];

        const registryKey = PrivateKey.new();

        await deployTeamsMutation.mutateAsync(
          {
            agentsTeamId: agentsTeam.id!,
            registryKey,
            registryVersion: 1n,
            rhoLimit: 1_000_000n,
            version: agentsTeam.version!,
          },
          {
            onError: onFailedDeploy,
            onSuccess: () => {
              onSuccessfulDeploy(registryKey);
              update({ hasGraphChanges: false });
              open(
                <SuccessModal
                  agentName={agentsTeam.name!}
                  createAnother={() => {
                    reset();
                    void navigate("/agents-team/create");
                  }}
                  data={modalData}
                  viewAgent={toEdit}
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

  return (
    <div className={styles["deploy-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiTeam.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={2}
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
            {agentsTeam.name}
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
              placeholder={agentsTeam.name}
              value={agentsTeam.name}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("basic.description")}
            </Text>
            <Input
              disabled
              textarea
              placeholder={agentsTeam.description || t("basic.description")}
              value={agentsTeam.description}
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
                  onClick={toEdit}
                >
                  {t("deploy.back")}
                </Button>
                <Button submit disabled={isSubmitting} type="primary">
                  {isSubmitting ? t("deploy.deploying") : t("deploy.deploy")}
                </Button>
              </div>
            )}
          </form.Subscribe>

          <LanguageFooter />
        </div>
      </form>
    </div>
  );
}
