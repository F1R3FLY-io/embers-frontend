import { Text } from "@/lib/components/Text";
import ChevronDownIcon from "@/public/icons/chevron-down-icon.svg?react";
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
        Create AI Agent
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
            Deploy {agentName} Agent
          </Text>
          <div className={styles["description-container"]}>
            <Text color="secondary" fontSize={16} type="H4">
              Review the details and confirm where and how your agent will run.
            </Text>
          </div>
        </div>
        <div className={styles["details-container"]}>
          <Text bold color="primary" fontSize={20} type="H3">
            Agent Details
          </Text>
          <div className={styles["detail-row"]}>
            <div className={styles["label-container"]}>
              <Text color="secondary" fontSize={12}>
                Agent address
              </Text>
            </div>
            <Text color="primary" fontSize={12}>
              {agentAddress}
            </Text>
          </div>
          <div className={styles["detail-row"]}>
            <div className={styles["label-container"]}>
              <Text color="secondary" fontSize={12}>
                Blockchain shard
              </Text>
            </div>
            <Text color="primary" fontSize={12}>
              {blockchainShard}
            </Text>
          </div>
          <div className={styles.divider} />
          <div className={styles["form-section"]}>
            <Text color="secondary" fontSize={12}>
              Agent name
            </Text>
            <input
              className={styles["form-input"]}
              placeholder={agentName}
              type="text"
            />
          </div>
          <div className={styles["form-section"]}>
            <Text color="secondary" fontSize={12}>
              Agent description
            </Text>
            <textarea
              className={styles["form-textarea"]}
              placeholder={agentDescription}
            />
          </div>
          <div className={styles["form-section"]}>
            <Text bold color="primary" fontSize={20} type="H3">
              Welcome Interface
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" fontSize={12}>
                  Welcome message
                </Text>
                <textarea
                  className={styles["form-textarea"]}
                  placeholder="Enter welcome message"
                />
              </div>
              <div>
                <Text color="secondary" fontSize={12}>
                  Input prompt
                </Text>
                <textarea
                  className={styles["form-textarea"]}
                  placeholder="Enter input prompt"
                />
              </div>
            </div>
          </div>
          <div className={styles["form-section"]}>
            <Text bold color="primary" fontSize={20} type="H3">
              Version & Notes
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text color="secondary" fontSize={12}>
                  Version
                </Text>
                <input
                  className={styles["form-input"]}
                  placeholder={agentVersion}
                  type="text"
                />
              </div>
              <div>
                <Text color="secondary" fontSize={12}>
                  Notes
                </Text>
                <textarea
                  className={styles["form-textarea"]}
                  placeholder="Enter deployment notes or comments"
                />
              </div>
            </div>
          </div>
          <div className={styles["button-container"]}>
            <button className={styles["back-button"]}>Back</button>
            <div className={styles["button-group"]}>
              <button className={styles["draft-button"]}>
                <DraftIcon />
                Save as Draft
              </button>
              <button className={styles["deploy-button"]}>Deploy</button>
            </div>
          </div>
          <div className={styles["footer-container"]}>
            <div className={styles["language-container"]}>
              <select className={styles["language-select"]}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
              <ChevronDownIcon className={styles["language-icon"]} />
            </div>
            <div className={styles["support-container"]}>
              <Text color="secondary" fontSize={14}>
                Having trouble?
              </Text>
              <a className={styles["support-link"]} href="#">
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
