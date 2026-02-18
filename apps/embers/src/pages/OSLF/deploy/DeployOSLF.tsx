import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { SuccessModal } from "@/lib/components/Modal/SuccessModal";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";
import { useOSLFEditorStepper } from "@/lib/providers/stepper/flows/OSLFEditor";

import styles from "./DeployOSLF.module.scss";

export default function DeployOSLF() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open } = useModal();

  const { data, navigateToPrevStep, navigateToStep, reset, step, updateData } =
    useOSLFEditorStepper();

  const canDeploy = useMemo(
    () => Boolean(data.id && data.version),
    [data.id, data.version],
  );

  const handleDeploy = useCallback(() => {
    if (!canDeploy) {
      return;
    }
    const modalData = [
      { label: "deploy.labels.agentId" as const, value: data.id },
      {
        label: "deploy.version" as const,
        value: data.version,
      },
      { label: "deploy.labels.status" as const, value: "ok" },
      { label: "deploy.labels.note" as const, value: data.description },
    ];

    updateData("hasChanges", false);
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
  }, [canDeploy, data, navigate, navigateToStep, open, reset, updateData]);

  return (
    <div className={styles["deploy-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiAgent.create")}
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
          handleDeploy();
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
              {t("deploy.agentName")}
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

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("basic.inputPrompt")}
            </Text>
            <Input
              disabled
              textarea
              placeholder={t("basic.inputPrompt")}
              value={data.query || ""}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("deploy.version")}
            </Text>
            <Input
              disabled
              placeholder={data.version || ""}
              value={data.version || ""}
            />
          </div>

          <div className={styles["button-container"]}>
            <Button type="secondary" onClick={navigateToPrevStep}>
              {t("deploy.back")}
            </Button>
            <Button submit disabled={!canDeploy} type="primary">
              {t("deploy.deploy")}
            </Button>
          </div>

          <LanguageFooter />
        </div>
      </form>
    </div>
  );
}
