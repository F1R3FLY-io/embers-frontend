import { PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import { useCallback, useRef } from "react";
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
import { FormError } from "@/lib/forms/FormError";
import { fieldError, useForm } from "@/lib/forms/useForm";
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
  const deploymentAttempt = useRef<{ key: PrivateKey; version: string } | null>(
    null,
  );
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
      update({ lastDeployKey: key, uri: key.getPublicKey().getUri() });
      appendDeploy(true);
    },
    [appendDeploy, update],
  );

  const toEdit = useCallback(
    () => void navigate("/agents-team/edit"),
    [navigate],
  );

  const onFailedDeploy = useCallback(
    (err: Error, retry: () => void) => {
      appendDeploy(false);
      logError(err);
      open(
        <WarningModal
          error={err.message}
          reviewSettings={toEdit}
          tryAgain={retry}
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
    onSubmit: useCallbackWithLoader(
      async ({
        formApi,
      }: {
        formApi: { handleSubmit: () => Promise<void> };
      }) => {
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

          if (
            !deploymentAttempt.current ||
            deploymentAttempt.current.version !== agentsTeam.version
          ) {
            deploymentAttempt.current = {
              key: PrivateKey.new(),
              version: agentsTeam.version!,
            };
          }
          const registryKey = deploymentAttempt.current.key;

          const result = await deployTeamsMutation.mutateAsync({
            agentsTeamId: agentsTeam.id!,
            registryKey,
            registryVersion: 1n,
            version: agentsTeam.version!,
          });

          await result.waitForFinalization;

          onSuccessfulDeploy(registryKey);
          deploymentAttempt.current = null;
          for (const container of result.prepareResponse.response.containers) {
            appendLog(
              `Deploy container ${container.id} finalized on current stack: ${container.uri.toString()}`,
              "info",
            );
          }
          update({ hasGraphChanges: false });
          open(
            <SuccessModal
              agentName={agentsTeam.name!}
              createAnother={() => {
                reset();
                void navigate("/agents-team/create");
              }}
              data={[
                ...modalData,
                ...result.prepareResponse.response.containers.map(
                  (container) => ({
                    label: "deploy.labels.container" as const,
                    value: `${container.id}: ${container.uri.toString()}`,
                  }),
                ),
              ]}
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
        } catch (e) {
          onFailedDeploy(e as Error, () => {
            void formApi.handleSubmit();
          });
          throw e;
        }
      },
    ),
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

          {Object.keys(agentsTeam.definition?.deploymentContainers ?? {})
            .length > 0 && (
            <section
              aria-label={t("deploy.containersTitle")}
              className={styles["form-section"]}
            >
              <Text bold color="primary" type="H5">
                {t("deploy.containersTitle")}
              </Text>
              {Object.values(agentsTeam.definition!.deploymentContainers!).map(
                (container) => (
                  <div key={container.id}>
                    <Text bold color="primary" type="normal">
                      {container.label}
                    </Text>
                    <Text color="secondary" type="small">
                      {t("deploy.containerTarget")}
                    </Text>
                    <Text color="secondary" type="small">
                      {t("deploy.containerMembers", {
                        members: [
                          ...container.nodeIds.map(
                            (id) =>
                              agentsTeam.definition?.nodes[id]?.label ?? id,
                          ),
                          ...Object.values(
                            agentsTeam.definition!.deploymentContainers!,
                          )
                            .filter((child) => child.parentId === container.id)
                            .map((child) => child.label),
                        ].join(", "),
                      })}
                    </Text>
                  </div>
                ),
              )}
            </section>
          )}

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
                      errorMessage={fieldError(field.state.meta)}
                      name={field.name}
                      placeholder={t("deploy.enterInputPrompt")}
                      value={field.state.value}
                      onBlur={field.handleBlur}
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
        <form.Subscribe selector={(state) => state.errorMap.onServer}>
          {(error) => <FormError error={error} />}
        </form.Subscribe>
      </form>
    </div>
  );
}
