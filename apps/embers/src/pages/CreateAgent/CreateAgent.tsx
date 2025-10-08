import { t } from "i18next";
import { useMemo, useState } from "react";
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
  const navigate = useNavigate();

  const { nextStep, step, updateData } = useStepper();
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<string>("");

  // Icon URL state
  const [iconUrl, setIconUrl] = useState("");
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

  const handleCancel = () => void navigate(-1);

  const submitForm = () => {
    updateData("agentName", name);
    updateData("environment", environment);
    updateData("agentIconUrl", iconUrl.trim());
    nextStep();
    void navigate("/create-ai-agent");
  };

  return (
    <div className={styles["create-container"]}>
      <Text bold color="primary" fontSize={40} type="H2">
        {t("aiAgent.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          labels={[
            t("deploy.generalInfo"),
            t("deploy.creation"),
            t("deploy.deployment"),
          ]}
          steps={3}
        />
      </div>

      <div className={styles["content-container"]}>
        <div className={styles["title-container"]}>
          <Text bold color="primary" fontSize={32} type="H2">
            {t("agents.tellUsAboutYourAgent")}
          </Text>
        </div>

        <div className={styles["details-container"]}>
          <Text bold color="primary" fontSize={20} type="H3">
            {t("agents.generalSettings")}
          </Text>

          <div className={styles["icon-section"]}>
            <IconPreview url={iconUrl} />

            <div className={styles["icon-input-container"]}>
              <Text color="secondary" fontSize={12}>
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
                <Text color="secondary" fontSize={12}>
                  {t("deploy.iconLoadFailed")}
                </Text>
              ) : null}
            </div>
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" fontSize={12}>
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
                <Text color="secondary" fontSize={12}>
                  {selectedShard}
                </Text>
              </div>
            )}
          </div>

          {/* Estimated cost strip */}
          <div className={styles["form-section"]}>
            <div className={styles["estimation-bar"]}>
              <Text color="secondary" fontSize={12}>
                {t("deploy.estimatedCost")}
              </Text>
              <div className={styles["estimation-value"]}>
                <Text color="primary" fontSize={12}>
                  {estimatedCost.toLocaleString()}
                </Text>
                <Text color="primary" fontSize={12}>
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
              <Text color="secondary" fontSize={14}>
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
