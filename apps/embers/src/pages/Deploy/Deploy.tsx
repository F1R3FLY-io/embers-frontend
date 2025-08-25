import Stepper from "./components/Stepper";
import { Text } from "@/lib/components/Text";

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
  blockchainShard = "shard://ai-health.open.mettacycle.net"
}: DeployProps) {
  return (
    <div className={styles["deploy-container"]}>
      <Text fontSize={40} type="H2" bold>Create AI Agent</Text>
      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={3}
          labels={["Create", "Configure", "Deploy"]}
          steps={3}
        />
      </div>
      <div className={styles["content-container"]}>
        <div>
          <Text fontSize={32} type="H2" bold>
            Deploy {agentName} Agent
          </Text>
          <div className={styles["description-container"]}>
            <Text fontSize={16} type="H4" color="secondary">
              Review the details and confirm where and how your agent will run.
            </Text>
          </div>
        </div>
        <div className={styles["details-container"]}>
          <Text fontSize={20} type="H3" bold>
            Agent Details
          </Text>
          <div className={styles["detail-row"]}>
            <div className={styles["label-container"]}>
              <Text fontSize={12} color="secondary">
                Agent address
              </Text>
            </div>
            <Text fontSize={12} color="primary">
              {agentAddress}
            </Text>
          </div>
          <div className={styles["detail-row"]}>
            <div className={styles["label-container"]}>
              <Text fontSize={12} color="secondary">
                Blockchain shard
              </Text>
            </div>
            <Text fontSize={12} color="primary">
              {blockchainShard}
            </Text>
          </div>
          <div className={styles.divider} />
          <div className={styles["form-section"]}>
            <Text fontSize={12} color="secondary">
              Agent name
            </Text>
            <input
              className={styles["form-input"]}
              placeholder={agentName}
              type="text"
            />
          </div>
          <div className={styles["form-section"]}>
            <Text fontSize={12} color="secondary">
              Agent description
            </Text>
            <textarea
              className={styles["form-textarea"]}
              placeholder={agentDescription}
            />
          </div>
          <div className={styles["form-section"]}>
            <Text fontSize={20} type="H3" bold>
              Welcome Interface
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text fontSize={12} color="secondary">
                  Welcome message
                </Text>
                <textarea
                  className={styles["form-textarea"]}
                  placeholder="Enter welcome message"
                />
              </div>
              <div>
                <Text fontSize={12} color="secondary">
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
            <Text fontSize={20} type="H3" bold>
              Version & Notes
            </Text>
            <div className={styles["form-fields"]}>
              <div>
                <Text fontSize={12} color="secondary">
                  Version
                </Text>
                <input
                  className={styles["form-input"]}
                  placeholder={agentVersion}
                  type="text"
                />
              </div>
              <div>
                <Text fontSize={12} color="secondary">
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
            <button className={styles["back-button"]}>
              Back
            </button>
            <div className={styles["button-group"]}>
              <button className={styles["draft-button"]}>
                {/* TODO(aidan): replace svg with public icon once icons PR is merged */}
                <svg fill="none" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V5C19 3.9 18.1 3 17 3ZM17 19H7V5H17V19Z" fill="currentColor"/>
                  <path d="M9 7H15V9H9V7ZM9 11H15V13H9V11ZM9 15H13V17H9V15Z" fill="currentColor"/>
                </svg>
                Save as Draft
              </button>
              <button className={styles["deploy-button"]}>
                Deploy
              </button>
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
              <img 
                alt="dropdown" 
                className={styles["language-icon"]}
                height="20" 
                src="/src/public/icons/chevron-down.svg" 
                width="20"
              />
            </div>
            <div className={styles["support-container"]}>
              <Text fontSize={14} color="secondary">
                Having trouble?
              </Text>
              <a href="#" className={styles["support-link"]}>
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
