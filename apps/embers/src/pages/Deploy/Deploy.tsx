import { t } from "i18next";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { Text } from "@/lib/components/Text";
import { useDeployAgentMutation } from "@/lib/queries"; // your hook from the snippet
import DraftIcon from "@/public/icons/draft-icon.svg?react";

import Stepper from "./components/Stepper";
import styles from "./Deploy.module.scss";

type DeployProps = {
  agentAddress?: string;
  agentDescription?: string;
  agentName?: string;
  agentVersion?: string;
  blockchainShard?: string;
};

function parseBigIntOrNull(v: string): bigint | null {
  try {
    if (!v.trim()) {
      return null;
    }
    return BigInt(v.trim());
  } catch {
    return null;
  }
}

export default function Deploy({
  agentAddress,
  blockchainShard,
}: DeployProps) {
  const { agentId = "", version = "" } = useParams<{ agentId: string; version: string }>();
  const search = new URLSearchParams(useLocation().search);
  const agentName = search.get("agentName") ?? "";
  const navigate = useNavigate();

  const [rhoLimitInput, setRhoLimitInput] = useState("1000000");

  const deployMutation = useDeployAgentMutation();
  const isDeploying = deployMutation.isPending;

  const rhoLimit = parseBigIntOrNull(rhoLimitInput);
  const rhoLimitError = rhoLimitInput.trim() !== "" && rhoLimit === null;

  const canDeploy =
    !!agentId && !!rhoLimit && !rhoLimitError && !isDeploying;

  const handleDeploy = () => {
    if (!canDeploy) {
      return;
    }

    deployMutation.mutate(
      { agentId, rhoLimit, version },
      {
        onError: (e) => {
          // eslint-disable-next-line no-console
          console.error("Deployment failed:", e);
        },
        onSuccess: () => {
          // todo add modal here
          void navigate("/dashboard");
        },
      },
    );
  };

  return (
    <div className={styles["deploy-container"]}>
      <Text bold color="primary" fontSize={40} type="H2">
        {t("aiAgent.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={3}
          labels={["Create", "Configure", "Deploy"]}
          steps={3}
        />
      </div>

      <div className={styles["content-container"]}>
        <div>
          <Text bold color="primary" fontSize={32} type="H2">
            {t("deploy.deployAgent", { agentName })}
          </Text>
          <div className={styles["description-container"]}>
            <Text color="secondary" fontSize={16} type="H4">
              {t("deploy.reviewDetails")}
            </Text>
          </div>
        </div>

        <div className={styles["details-container"]}>
          <Text bold color="primary" fontSize={20} type="H3">
            {t("deploy.agentDetails")}
          </Text>

          <div className={styles["detail-row"]}>
            <div className={styles["label-container"]}>
              <Text color="secondary" fontSize={12}>
                {t("deploy.agentAddress")}
              </Text>
            </div>
            <Text color="primary" fontSize={12}>
              {agentAddress}
            </Text>
          </div>

          <div className={styles["detail-row"]}>
            <div className={styles["label-container"]}>
              <Text color="secondary" fontSize={12}>
                {t("deploy.blockchainShard")}
              </Text>
            </div>
            <Text color="primary" fontSize={12}>
              {blockchainShard}
            </Text>
          </div>

          <div className={styles.divider} />

          <div className={styles["form-section"]}>
            <Text color="secondary" fontSize={12}>
              {t("deploy.agentName")}
            </Text>
            <input
              disabled
              className={styles["form-input"]}
              placeholder={agentName}
              type="text"
              value={agentName}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text bold color="primary" fontSize={20} type="H3">
              {t("deploy.versionAndNotes")}
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" fontSize={12}>
                  {t("deploy.version")}
                </Text>
                <input
                  disabled
                  className={styles["form-input"]}
                  placeholder={version}
                  type="text"
                  value={version}
                />
              </div>
            </div>
          </div>

          {/* Rho Limit input (required for deploy) */}
          <div className={styles["form-section"]}>
            <Text color="secondary" fontSize={12}>
              rhoLimit (bigint)
            </Text>
            <input
              className={styles["form-input"]}
              placeholder="e.g. 1000000"
              type="text"
              value={rhoLimitInput}
              onChange={(e) => setRhoLimitInput(e.target.value)}
            />
            {rhoLimitError && (
              <Text color="secondary" fontSize={12} type="H4">
                Invalid bigint value
              </Text>
            )}
          </div>

          <div className={styles["button-container"]}>
            <button className={styles["back-button"]}>
              {t("deploy.back")}
            </button>

            <div className={styles["button-group"]}>
              <button className={styles["draft-button"]}>
                <DraftIcon />
                {t("basic.saveDraft")}
              </button>

              <button
                aria-busy={isDeploying}
                className={styles["deploy-button"]}
                disabled={!canDeploy}
                onClick={handleDeploy}
              >
                {isDeploying ? t("deploy.deploying") : t("deploy.deploy")}
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
