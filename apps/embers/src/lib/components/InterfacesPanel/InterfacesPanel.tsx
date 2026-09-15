import { useTranslation } from "react-i18next";

import type { Reachability } from "@/lib/interfaces";

import { Spinner } from "@/lib/components/Spinner";
import { Tag } from "@/lib/components/Tag";
import { Text } from "@/lib/components/Text";
import { chatReachability, mailReachability, reachabilityOf } from "@/lib/interfaces";
import { usePublishedChannels } from "@/lib/queries";

import styles from "./InterfacesPanel.module.scss";

/**
 * Where the team is reachable, per channel, rendered with the three-valued
 * discipline: "unknown" is a real state and never collapses into "missing".
 * Mail reachability is unknown by design (embers does not probe SMTP); the
 * chat row derives from grant presence because the gateway dials out and has
 * no status surface to ask.
 */
export function InterfacesPanel({ teamId }: { teamId: string }) {
  const { t } = useTranslation();
  const channels = usePublishedChannels(teamId);

  if (channels.isPending) {
    return (
      <div className={styles.root} data-testid="interfaces-panel-loading">
        <Spinner isOpen />
      </div>
    );
  }

  if (channels.isError) {
    return (
      <div className={styles.root} data-testid="interfaces-panel-error">
        <Text color="secondary">{t("interfaces.loadFailed")}</Text>
      </div>
    );
  }

  const data = channels.data;
  const firesky = data.firesky;
  const fireskyState: Reachability = firesky
    ? firesky.active === true
      ? reachabilityOf(firesky.accountExists)
      : firesky.active === false
        ? "unreachable"
        : "unknown"
    : "unknown";

  return (
    <div className={styles.root} data-testid="interfaces-panel">
      <Text bold color="primary" type="H2">
        {t("interfaces.title")}
      </Text>

      <div className={styles.row} data-testid="interfaces-firesky">
        <div className={styles["row-body"]}>
          <Text color="primary">F1R3SKY</Text>
          <Text color="secondary" type="small">
            {firesky?.handle ?? t("interfaces.notPublished")}
          </Text>
        </div>
        <StateTag state={firesky ? fireskyState : "unknown"} />
      </div>

      {data.mail.map((entry) => (
        <div
          key={entry.address}
          className={styles.row}
          data-testid={`interfaces-mail-${entry.address}`}
        >
          <div className={styles["row-body"]}>
            <Text color="primary">{t("interfaces.mail")}</Text>
            <Text color="secondary" type="small">
              {entry.address}
            </Text>
          </div>
          <StateTag state={mailReachability(entry)} />
        </div>
      ))}
      {data.mail.length === 0 && (
        <div className={styles.row} data-testid="interfaces-mail-none">
          <div className={styles["row-body"]}>
            <Text color="primary">{t("interfaces.mail")}</Text>
            <Text color="secondary" type="small">
              {t("interfaces.notPublished")}
            </Text>
          </div>
          <StateTag state="unknown" />
        </div>
      )}

      <div className={styles.row} data-testid="interfaces-chat">
        <div className={styles["row-body"]}>
          <Text color="primary">{t("interfaces.chat")}</Text>
          <Text color="secondary" type="small">
            {Number(data.chat.activeGrantCount) > 0
              ? t("interfaces.chatGrants", {
                  count: Number(data.chat.activeGrantCount),
                })
              : t("interfaces.noGrants")}
          </Text>
        </div>
        <StateTag state={chatReachability(data.chat)} />
      </div>
    </div>
  );
}

/**
 * The one place a reachability value becomes a label, so no call site can
 * quietly render "unknown" as an absence.
 */
function StateTag({ state }: { state: Reachability }) {
  const { t } = useTranslation();
  const label =
    state === "reachable"
      ? t("interfaces.reachable")
      : state === "unreachable"
        ? t("interfaces.unreachable")
        : t("interfaces.unknown");

  return (
    <span data-testid={`interfaces-state-${state}`}>
      <Tag variant={state === "reachable" ? "solid" : "outline"}>{label}</Tag>
    </span>
  );
}
