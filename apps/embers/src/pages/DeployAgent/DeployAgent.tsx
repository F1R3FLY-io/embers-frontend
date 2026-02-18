import { useForm } from "@tanstack/react-form";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import z from "zod";

import type { Option } from "@/lib/components/Select";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { SuccessModal } from "@/lib/components/Modal/SuccessModal";
import { WarningModal } from "@/lib/components/Modal/WarningModal";
import { Select } from "@/lib/components/Select";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useCurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useModal } from "@/lib/providers/modal/useModal";
import { useDeployAgentMutation } from "@/lib/queries";

import styles from "./DeployAgent.module.scss";

const envOptions: Option<string>[] = [
  { label: "Development", value: "dev" },
  { label: "Staging", value: "staging" },
  { label: "Production", value: "prod" },
];

const shardByEnv: Record<string, string> = {
  dev: "shard://dev.test.net",
  prod: "shard://prod.test.net",
  staging: "shard://staging.test.net",
};

const estimatedCost = 50000;

const formModel = z.object({
  environment: z.string().optional(),
  rhoLimit: z.string().refine((v) => BigInt(v)),
});

export default function DeployAgent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dock = useDock();
  const { open } = useModal();

  const { agent, reset, update } = useCurrentAgent();

  const deployMutation = useMutationResultWithLoader(useDeployAgentMutation());
  const redirectToEdit = useCallback(
    () => void navigate("/agent/edit"),
    [navigate],
  );

  const onSubmit = useCallbackWithLoader(
    async ({ value }: { value: z.infer<typeof formModel> }) => {
      update({
        environment: value.environment,
        rhoLimit: BigInt(value.rhoLimit),
      });

      const modalData = [
        { label: "deploy.labels.agentId" as const, value: agent.id },
        { label: "deploy.version" as const, value: agent.version },
        { label: "deploy.labels.status" as const, value: "ok" },
        { label: "deploy.rhoLimit" as const, value: value.rhoLimit },
        { label: "deploy.labels.note" as const, value: agent.description },
      ];

      return deployMutation.mutateAsync(
        {
          agentId: agent.id!,
          rhoLimit: BigInt(value.rhoLimit),
          version: agent.version!,
        },
        {
          onError: (e) => {
            dock.appendDeploy(false);
            open(
              <WarningModal
                error={e.message}
                reviewSettings={redirectToEdit}
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
                agentName={agent.name!}
                createAnother={() => {
                  reset();
                  void navigate("/agent/create");
                }}
                data={modalData}
                viewAgent={redirectToEdit}
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
  );

  const form = useForm({
    defaultValues: {
      ...agent,
      rhoLimit: agent.rhoLimit?.toString() ?? "50000",
    },
    onSubmit,
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
          currentStep={2}
          steps={[
            t("deploy.generalInfo"),
            t("deploy.creation"),
            t("deploy.deployment"),
          ]}
        />
      </div>

      <div className={styles["content-container"]}>
        <div>
          <Text bold color="primary" type="H2">
            {agent.name}
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
            <Input disabled placeholder={agent.name} value={agent.name} />
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("deploy.agentDescription")}
            </Text>
            <Input
              disabled
              textarea
              placeholder={agent.description}
              value={agent.description}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text bold color="primary" type="H5">
              {t("deploy.version")}
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" type="small">
                  {t("deploy.version")}
                </Text>
                <Input
                  disabled
                  placeholder={agent.version}
                  value={agent.version}
                />
              </div>
            </div>
          </div>

          <form.Field name="rhoLimit">
            {(field) => (
              <div className={styles["form-section"]}>
                <div className={styles["form-fields"]}>
                  <div>
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
              </div>
            )}
          </form.Field>

          <div className={styles["form-section"]}>
            <div className={styles["estimation-bar"]}>
              <Text color="secondary" type="small">
                {t("deploy.estimatedCost")}
              </Text>
              <div className={styles["estimation-value"]}>
                <Text color="primary" type="small">
                  {estimatedCost.toLocaleString()}
                </Text>
                <Text color="primary" type="small">
                  &nbsp;FIR3CAPS
                </Text>
              </div>
            </div>
          </div>

          <form.Field name="environment">
            {(field) => (
              <div className={styles["form-section"]}>
                <Select
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  label={t("deploy.blockchainShard")}
                  options={envOptions}
                  placeholder={t("agents.selectEnvironment")}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
                {field.state.value && (
                  <div className={styles["description-container"]}>
                    <Text color="secondary" type="small">
                      {shardByEnv[field.state.value]}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <div className={styles["button-container"]}>
                <Button
                  disabled={isSubmitting}
                  type="secondary"
                  onClick={redirectToEdit}
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
        </form>
      </div>
    </div>
  );
}
