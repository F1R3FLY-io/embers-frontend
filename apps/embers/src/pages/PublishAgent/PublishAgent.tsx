import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { GraphEditorStepperData } from "@/lib/providers/stepper/flows/GraphEditor";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { WarningModal } from "@/lib/components/Modal/WarningModal";
import { Text } from "@/lib/components/Text";
import { useModal } from "@/lib/providers/modal/useModal";
import { usePublishAgentsTeamToFireskyMutation } from "@/lib/queries";
import publishImage from "@/lib/resources/publish.png";
import { SuccessModal } from "@/pages/PublishAgent/SuccessModal";

import styles from "./PublishAgent.module.scss";

export default function PublishAgent() {
  const { t } = useTranslation();
  const { close, open } = useModal();
  const location = useLocation();
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");
  const [pdsAddress, setPdsAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [version, setVersion] = useState("");
  const [handle, setHandle] = useState("");
  const [agentId, setAgentId] = useState("");

  const mutation = usePublishAgentsTeamToFireskyMutation(agentId);

  const canPublish =
    pdsAddress.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0;

  useEffect(() => {
    const preload = location.state as GraphEditorStepperData;
    setAgentName(preload.agentName);
    setIconUrl(preload.iconUrl ?? "");
    setAgentId(preload.agentId ?? "");
    setVersion(preload.version ?? "");
    void navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

  const handlePublish = () => {
    if (!canPublish) {
      return;
    }

    const modalData = [
      { label: "deploy.labels.agentId", value: agentId },
      { label: "deploy.version", value: version },
      { label: "deploy.labels.note", value: "idk what to put here" },
    ];

    mutation.mutate(
      { email, handle, password, pdsUrl: pdsAddress },
      {
        onError: (e) => {
          open(
            <WarningModal
              error={e.message}
              reviewSettings={() => close()}
              tryAgain={() => {}}
            />,
            {
              ariaLabel: "Warning",
              maxWidth: 550,
            },
          );
        },
        onSuccess: () => {
          open(
            <SuccessModal
              agentName={agentName}
              data={modalData}
              iconUrl={iconUrl}
            />,
            {
              ariaLabel: "Success deploy",
              maxWidth: 550,
            },
          );
        },
      },
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles["image-panel"]}>
        <div className={styles["image-frame"]}>
          <img alt="" className={styles.image} src={publishImage} />
        </div>
      </div>

      <div className={styles["right-panel"]}>
        <Text color="secondary" type="small">
          {t("publish.titleSmall")}
        </Text>

        <div className={styles.header}>
          <Text bold color="primary" type="H1">
            {t("publish.header")}
          </Text>
          <Text color="secondary">{t("publish.subtitle")}</Text>
        </div>

        <div className={styles["profile-header"]}>
          <div className={styles["profile-icon"]}>
            <IconPreview url={iconUrl} />
          </div>
        </div>

        <div className={styles["form-fields"]}>
          <div className={styles["form-field"]}>
            <Text color="secondary" type="small">
              {t("publish.agentName")}
            </Text>
            <Input
              inputType="input"
              placeholder="Agent name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
          <div className={styles["form-field"]}>
            <Text color="secondary" type="small">
              {t("publish.username")}
            </Text>
            <Input
              inputType="input"
              placeholder="Username"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <div className={styles["form-field"]}>
            <Text color="secondary" type="small">
              {t("publish.pdsAddress")}
            </Text>
            <Input
              inputType="input"
              placeholder="https://"
              value={pdsAddress}
              onChange={(e) => setPdsAddress(e.target.value)}
            />
          </div>

          <div className={styles["form-field"]}>
            <Text color="secondary" type="small">
              Email
            </Text>
            <Input
              inputType="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles["form-field"]}>
            <Text color="secondary" type="small">
              Password
            </Text>
            <Input
              inputType="input"
              placeholder="Enter password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className={styles["button-row"]}>
          <Button type="secondary" onClick={() => window.history.back()}>
            {t("publish.cancel")}
          </Button>

          <button
            className={styles["primary-button"]}
            disabled={!canPublish}
            onClick={handlePublish}
          >
            {t("publish.button")}
          </button>
        </div>

        <div className={styles.footer}>
          <LanguageFooter />
        </div>
      </div>
    </div>
  );
}
