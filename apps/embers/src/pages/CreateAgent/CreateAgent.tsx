// src/pages/CreateAgent/CreateAgent.tsx
import { t } from "i18next";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Option } from "@/lib/components/Select";

import { Input } from "@/lib/components/Input";
import { Select } from "@/lib/components/Select";
import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { Text } from "@/lib/components/Text";
import Stepper from "@/pages/Deploy/components/Stepper";

import styles from "./CreateAgent.module.scss";

export default function CreateAgent() {
  const navigate = useNavigate();

  // form state
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<string>("");

  const envOptions: Option[] = useMemo(
    () => [
      { label: "Development", value: "dev" },
      { label: "Staging", value: "staging" },
      { label: "Production", value: "prod" },
    ],
    [],
  );

  const shardByEnv: Record<string, string> = {
    dev: "shard://dev.open.mettacycle.net",
    prod: "shard://ai-health.open.mettacycle.net",
    staging: "shard://staging.open.mettacycle.net",
  };

  const selectedShard = environment ? (shardByEnv[environment] ?? "") : "";

  const estimatedCost = 50000;

  const canContinue = name.trim().length > 0 && environment.length > 0;

  const handleCancel = () => void navigate(-1);
  const handleContinue = () => {
    if (!canContinue) {
      return;
    }
    void navigate(`/create-ai-agent?agentName=${encodeURIComponent(name)}`);
  };

  return (
    <div className={styles["create-container"]}>
      <Text bold color="primary" fontSize={40} type="H2">
        {t("aiAgent.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={1}
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
            <button className={styles["back-button"]} onClick={handleCancel}>
              {t("basic.cancel")}
            </button>
            <div className={styles["button-group"]}>
              <button
                className={styles["continue-button"]}
                disabled={!canContinue}
                onClick={handleContinue}
              >
                {t("basic.continue")}
              </button>
            </div>
          </div>

          {/* Bottom footer (language + support) */}
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
