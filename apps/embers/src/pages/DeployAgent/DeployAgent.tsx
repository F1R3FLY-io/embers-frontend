import { useForm } from "@tanstack/react-form";
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
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useModal } from "@/lib/providers/modal/useModal";
import { useCodeEditorStepper } from "@/lib/providers/stepper/flows/CodeEditor";
import { useDeployAgentMutation } from "@/lib/queries";
import DraftIcon from "@/public/icons/draft-icon.svg?react";

import styles from "./DeployAgent.module.scss";

const formModel = z.object({
  rhoLimit: z.string().transform(BigInt),
});

export default function DeployAgent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, navigateToPrevStep, navigateToStep, reset, step, updateData } =
    useCodeEditorStepper();

  const deployMutation = useMutationResultWithLoader(useDeployAgentMutation());
  const dock = useDock();
  const { open } = useModal();

  const form = useForm({
    defaultValues: {
      rhoLimit: data.rhoLimit.toString(),
    },
    onSubmit: async ({ value }) => {
      updateData("rhoLimit", BigInt(value.rhoLimit));

      const modalData = [
        { label: "deploy.labels.agentId", value: data.agentId },
        { label: "deploy.version", value: data.version },
        { label: "deploy.labels.status", value: "ok" },
        { label: "deploy.rhoLimit", value: String(data.rhoLimit) },
        { label: "deploy.labels.note", value: data.description },
      ];

      return deployMutation.mutateAsync(
        {
          agentId: data.agentId!,
          rhoLimit: BigInt(value.rhoLimit),
          version: data.version!,
        },
        {
          onError: (e) => {
            dock.appendDeploy(false);
            open(
              <WarningModal
                error={e.message}
                reviewSettings={() => navigateToStep(0)}
                tryAgain={() => {}}
              />,
              {
                ariaLabel: "Warning",
                maxWidth: 550,
              },
            );
          },
          onSuccess: () => {
            dock.appendDeploy(true);
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
                maxWidth: 550,
              },
            );
          },
        },
      );
    },
    validators: {
      onChange: formModel,
    },
  });

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
            {data.agentName}
          </Text>
          <div className={styles["description-container"]}>
            <Text color="secondary" type="large">
              {t("deploy.reviewDetails")}
            </Text>
          </div>
        </div>

        <form
          className={styles["details-container"]}
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <Text bold color="primary" type="H5">
            {t("deploy.agentDetails")}
          </Text>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("deploy.agentName")}
            </Text>
            <Input
              disabled
              placeholder={data.agentName}
              value={data.agentName}
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
                  placeholder={data.version}
                  value={data.version}
                />
              </div>
              <div>
                <Text color="secondary" type="small">
                  {t("deploy.notes")}
                </Text>
                <Input
                  textarea
                  placeholder={t("deploy.enterDeploymentNotes")}
                  onChange={(e) => {
                    updateData("description", e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <form.Field name="rhoLimit">
            {(field) => (
              <div className={styles["form-section"]}>
                <div className={styles["form-fields"]}>
                  <Text color="secondary" type="small">
                    {t("deploy.rhoLimit")}
                  </Text>
                  <Input
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                    placeholder={field.state.value}
                    type="number"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
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
                  <button className={styles["draft-button"]}>
                    <DraftIcon />
                    {t("basic.saveDraft")}
                  </button>

                  <button
                    aria-busy={isSubmitting}
                    className={styles["deploy-button"]}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? t("deploy.deploying") : t("deploy.deploy")}
                  </button>
                </div>
              </div>
            )}
          </form.Subscribe>

          <LanguageFooter />
        </form>
      </div>
    </div>
  );
}
