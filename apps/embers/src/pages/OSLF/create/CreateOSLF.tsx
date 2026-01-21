import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useOSLFEditorStepper } from "@/lib/providers/stepper/flows/OSLFEditor";

import styles from "./CreateOSLF.module.scss";

export default function CreateOSLF() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, navigateToNextStep, setStep, step, updateData } =
    useOSLFEditorStepper();
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description);

  const canContinue = name.trim().length > 0;

  const handleCancel = () => void navigate("/dashboard");

  const submitForm = () => {
    updateData("name", name);
    updateData("description", description);
    navigateToNextStep();
  };

  useEffect(() => {
    setStep(0);
  }, [setStep]);

  return (
    <div className={styles["create-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiAgent.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          steps={[
            {
              canClick: false,
              label: t("deploy.generalInfo"),
            },
            {
              canClick: canContinue,
              label: t("deploy.creation"),
            },
            {
              canClick: canContinue,
              label: t("deploy.deployment"),
            },
          ]}
        />
      </div>

      <div className={styles["content-container"]}>
        <div className={styles["title-container"]}>
          <Text bold color="primary" type="H2">
            {t("agents.tellUsAboutYourAgent")}
          </Text>
        </div>

        <div className={styles["details-container"]}>
          <Text bold color="primary" type="H5">
            {t("agents.generalSettings")}
          </Text>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("deploy.agentName")}
            </Text>
            <Input
              inputType="input"
              placeholder={t("deploy.agentName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("basic.description")}
            </Text>
            <Input
              inputType="textarea"
              placeholder={t("basic.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles["button-container"]}>
            <Button type="secondary" onClick={handleCancel}>
              {t("basic.cancel")}
            </Button>
            <div className={styles["button-group"]}>
              <button
                className={styles["continue-button"]}
                disabled={!canContinue}
                onClick={submitForm}
              >
                {t("basic.continue")}
              </button>
            </div>
          </div>

          <LanguageFooter />
        </div>
      </div>
    </div>
  );
}
