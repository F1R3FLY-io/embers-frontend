import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { Option } from "@/lib/components/Select";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Input } from "@/lib/components/Input";
import { Select } from "@/lib/components/Select";
import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { Text } from "@/lib/components/Text";
import { useStepper } from "@/lib/providers/stepper/useStepper";
import Stepper from "@/pages/Deploy/components/Stepper";

import styles from "./CreateAgent.module.scss";

export default function CreateAgent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, nextStep, step, updateData } = useStepper();
  const [name, setName] = useState(data.agentName);
  const [environment, setEnvironment] = useState<string>(
    data.environment ?? "",
  );

  const [iconUrl, setIconUrl] = useState(data.agentIconUrl ?? "");
  const [iconLoadError, setIconLoadError] = useState(false);

  const envOptions: Option[] = useMemo(
    () => [
      { label: "Development", value: "dev" },
      { label: "Staging", value: "staging" },
      { label: "Production", value: "prod" },
    ],
    [],
  );

  const shardByEnv: Record<string, string> = {
    dev: "shard://dev.test.net",
    prod: "shard://prod.test.net",
    staging: "shard://staging.test.net",
  };

  const selectedShard = environment ? (shardByEnv[environment] ?? "") : "";

  const estimatedCost = 50000;

  const canContinue = name.trim().length > 0 && environment.length > 0;

  const handleCancel = () => void navigate("/dashboard");

  const submitForm = () => {
    updateData("agentName", name);
    updateData("environment", environment);
    updateData("agentIconUrl", iconUrl.trim());
    nextStep();
    void navigate("/create-ai-agent");
  };

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

          <div className={styles["icon-section"]}>
            <IconPreview url={iconUrl} />

            <div className={styles["icon-input-container"]}>
              <Text color="secondary" type="small">
                {t("deploy.iconUrl")}
              </Text>
              <Input
                inputType="input"
                placeholder="https://example.com/icon.png"
                value={iconUrl}
                onChange={(e) => {
                  setIconLoadError(false);
                  setIconUrl(e.target.value);
                }}
              />
              {iconUrl && iconLoadError ? (
                <Text color="secondary" type="small">
                  {t("deploy.iconLoadFailed")}
                </Text>
              ) : null}
            </div>
          </div>

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
            <Select
              label={t("deploy.blockchainShard")}
              options={envOptions}
              placeholder={t("agents.selectEnvironment")}
              value={environment}
              onChange={setEnvironment}
            />
            {selectedShard && (
              <div className={styles["description-container"]}>
                <Text color="secondary" type="small">
                  {selectedShard}
                </Text>
              </div>
            )}
          </div>

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
