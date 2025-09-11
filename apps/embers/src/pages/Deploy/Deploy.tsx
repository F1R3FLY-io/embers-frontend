import { t } from "i18next";

import { Input } from "@/lib/components/Input";
import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { Text } from "@/lib/components/Text";
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

export default function Deploy({
  agentAddress = "#7839937799911",
  agentDescription = "Enter agent description",
  agentName = "BioMatch",
  agentVersion = "1.0.0",
  blockchainShard = "shard://ai-health.open.mettacycle.net",
}: DeployProps) {
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
            <Input placeholder={agentName} type="text" />
          </div>
          <div className={styles["form-section"]}>
            <Text color="secondary" fontSize={12}>
              {t("deploy.agentDescription")}
            </Text>
            <Input as="textarea" placeholder={agentDescription} />
          </div>
          <div className={styles["form-section"]}>
            <Text bold color="primary" fontSize={20} type="H3">
              {t("deploy.welcomeInterface")}
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" fontSize={12}>
                  {t("deploy.welcomeMessage")}
                </Text>
                <Input
                  as="textarea"
                  placeholder={t("deploy.enterWelcomeMessage")}
                />
              </div>
              <div>
                <Text color="secondary" fontSize={12}>
                  {t("basic.inputPrompt")}
                </Text>
                <Input
                  as="textarea"
                  placeholder={t("deploy.enterInputPrompt")}
                />
              </div>
            </div>
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
                <Input placeholder={agentVersion} type="text" />
              </div>
              <div>
                <Text color="secondary" fontSize={12}>
                  {t("deploy.notes")}
                </Text>
                <Input
                  as="textarea"
                  placeholder={t("deploy.enterDeploymentNotes")}
                />
              </div>
            </div>
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
              <button className={styles["deploy-button"]}>
                {t("deploy.deploy")}
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
