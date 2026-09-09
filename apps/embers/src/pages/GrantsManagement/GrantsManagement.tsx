import type { CreateGrantReq, Grant } from "@f1r3fly-io/embers-client-sdk";

import {
  Address,
  GrantChannel,
  GrantCommandClass,
  MinAuthLevel,
  normalizeApiError,
} from "@f1r3fly-io/embers-client-sdk";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/lib/components/Button";
import { Checkbox } from "@/lib/components/Checkbox";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { Select } from "@/lib/components/Select";
import { Tag } from "@/lib/components/Tag";
import { Text } from "@/lib/components/Text";
import { ToggleSwitch } from "@/lib/components/ToggleSwitch";
import { useFieldValidation } from "@/lib/forms/useFieldValidation";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useAlert, useConfirm } from "@/lib/providers/modal/useConfirm";
import {
  useAgentsTeams,
  useCreateGrantMutation,
  useGrantsQuery,
  useRevokeGrantMutation,
} from "@/lib/queries";

import styles from "./GrantsManagement.module.scss";

/**
 * Where channel grants get signed: the one place a user authorizes a channel
 * service to initiate runs OWNED by them, within caps, with exactly the
 * delegated authority. The principal is pasted from the channel's own
 * discovery surface (the chat bot's `team whoami`, or a mail sender address)
 * and stays opaque here.
 *
 * The one-time subject bearer token is surfaced immediately after creation
 * and never again: the platform stores only its digest, so this dialog is the
 * token's entire lifetime on screen.
 */
export default function GrantsManagement() {
  const { t } = useTranslation();
  const alert = useAlert();
  const confirm = useConfirm();

  const teams = useAgentsTeams();
  const grants = useGrantsQuery();
  const createGrant = useCreateGrantMutation();
  const revokeGrant = useRevokeGrantMutation();

  const deployedTeams = useMemo(
    () =>
      (teams.data?.agentsTeams ?? []).filter((team) => team.uri !== undefined),
    [teams.data],
  );

  const [teamUri, setTeamUri] = useState<string | undefined>(undefined);
  const [channel, setChannel] = useState<GrantChannel>(GrantChannel.Chat);
  const [principal, setPrincipal] = useState("");
  const [grantee, setGrantee] = useState("");
  const [maxRunsPerDay, setMaxRunsPerDay] = useState("");
  const [reveal, setReveal] = useState(true);
  const [commands, setCommands] = useState<GrantCommandClass[]>([
    GrantCommandClass.Approve,
    GrantCommandClass.Reject,
    GrantCommandClass.Cancel,
  ]);
  const [requireToken, setRequireToken] = useState(false);
  const [minAuth, setMinAuth] = useState<MinAuthLevel>(MinAuthLevel.None);

  const capNumber = maxRunsPerDay.trim() === "" ? null : Number(maxRunsPerDay);
  const capInvalid =
    capNumber !== null &&
    (!Number.isInteger(capNumber) || capNumber <= 0 || capNumber > 100_000);
  const granteeAddress = (() => {
    if (grantee.trim() === "") {
      return undefined;
    }
    try {
      return Address.tryFrom(grantee.trim());
    } catch {
      return undefined;
    }
  })();
  const selectedTeam = deployedTeams.find(
    (team) => String(team.uri) === teamUri,
  );
  const submittable =
    selectedTeam !== undefined &&
    principal.trim() !== "" &&
    granteeAddress !== undefined &&
    !capInvalid;

  const validation = useFieldValidation({
    grantee: () =>
      granteeAddress === undefined
        ? "Enter a valid wallet address."
        : undefined,
    maxRunsPerDay: () =>
      capInvalid
        ? "Enter a whole number between 1 and 100000, or leave empty."
        : undefined,
    principal: () =>
      !principal.trim() ? "Enter the channel principal." : undefined,
    teamUri: () =>
      selectedTeam === undefined ? "Select a deployed team." : undefined,
  });
  const [submissionError, setSubmissionError] = useState("");
  const createUnderLoader = useCallbackWithLoader(
    async (request: CreateGrantReq) => createGrant.mutateAsync(request),
  );

  // Dialogs stay OUTSIDE the loader-wrapped region: a dialog awaited under
  // the loader renders behind its overlay and can never be dismissed. The
  // loader covers exactly the mutation; the token alert follows it.
  const onCreate = async () => {
    if (!validation.validate()) {
      return;
    }
    if (selectedTeam?.uri === undefined || granteeAddress === undefined) {
      return;
    }
    const request: CreateGrantReq = {
      agentsTeam: selectedTeam.uri,
      authority: { commands, reveal },
      caps: {
        maxRunsPerDay: capNumber === null ? undefined : BigInt(capNumber),
      },
      channel,
      channelPrincipal: principal.trim(),
      grantee: granteeAddress,
      minAuth,
      requireToken,
    };
    setSubmissionError("");
    let result;
    try {
      result = await createUnderLoader(request);
    } catch (error) {
      setSubmissionError((await normalizeApiError(error)).message);
      return;
    }
    const token = result.prepareResponse.response.requireToken;
    if (token !== undefined) {
      // The token's only appearance, by design: nothing stores it and no
      // later screen can recover it.
      await alert({
        message: t("grants.tokenOnce", { token }),
        title: t("grants.tokenTitle"),
      });
    } else {
      await alert({
        message: t("grants.created"),
        title: t("grants.createdTitle"),
      });
    }
    setPrincipal("");
  };

  const revokeUnderLoader = useCallbackWithLoader(async (grantId: string) =>
    revokeGrant.mutateAsync(grantId),
  );

  const onRevoke = async (grant: Grant) => {
    const proceed = await confirm({
      message: t("grants.revokeConfirm", {
        principal: grant.channelPrincipal,
      }),
      title: t("grants.revokeTitle"),
    });
    if (proceed) {
      setSubmissionError("");
      try {
        await revokeUnderLoader(grant.grantId);
      } catch (error) {
        setSubmissionError((await normalizeApiError(error)).message);
      }
    }
  };

  const channelOptions = [
    { label: t("grants.channelChat"), value: GrantChannel.Chat },
    { label: t("grants.channelMail"), value: GrantChannel.Mail },
  ];
  const minAuthOptions = [
    { label: t("grants.minAuthNone"), value: MinAuthLevel.None },
    { label: "SPF", value: MinAuthLevel.Spf },
    { label: "DKIM", value: MinAuthLevel.Dkim },
    { label: "DMARC", value: MinAuthLevel.Dmarc },
  ];
  const commandOptions: { label: string; value: GrantCommandClass }[] = [
    { label: t("grants.commandApprove"), value: GrantCommandClass.Approve },
    { label: t("grants.commandReject"), value: GrantCommandClass.Reject },
    { label: t("grants.commandCancel"), value: GrantCommandClass.Cancel },
    { label: t("grants.commandSignal"), value: GrantCommandClass.Signal },
    { label: t("grants.commandEvent"), value: GrantCommandClass.Event },
    { label: t("grants.commandRetry"), value: GrantCommandClass.Retry },
  ];

  return (
    <div className={styles.root} data-testid="grants-management">
      <div className={styles.panel}>
        <Text color="secondary" type="small">
          {t("grants.titleSmall")}
        </Text>
        <div className={styles.header}>
          <Text bold color="primary" type="H1">
            {t("grants.header")}
          </Text>
          <Text color="secondary">{t("grants.subtitle")}</Text>
        </div>

        <div className={styles.form} data-testid="grant-create-form">
          <div className={styles.field}>
            <Select
              label={t("grants.team")}
              options={deployedTeams.map((team) => ({
                label: team.name,
                value: String(team.uri),
              }))}
              placeholder={t("grants.teamPlaceholder")}
              {...validation.props("teamUri")}
              value={teamUri}
              onChange={setTeamUri}
            />
          </div>

          <div className={styles.field}>
            <Select
              label={t("grants.channel")}
              options={channelOptions}
              value={channel}
              onChange={setChannel}
            />
          </div>

          <div className={styles.field}>
            <Text color="secondary" type="small">
              {t("grants.principal")}
            </Text>
            <Input
              data-testid="grant-principal"
              placeholder={
                channel === GrantChannel.Chat
                  ? t("grants.principalChatPlaceholder")
                  : t("grants.principalMailPlaceholder")
              }
              {...validation.props("principal")}
              value={principal}
              onChange={(e) => {
                setPrincipal(e.target.value);
              }}
            />
            <Text color="secondary" type="small">
              {channel === GrantChannel.Chat
                ? t("grants.principalChatHelp")
                : t("grants.principalMailHelp")}
            </Text>
          </div>

          <div className={styles.field}>
            <Text color="secondary" type="small">
              {t("grants.grantee")}
            </Text>
            <Input
              data-testid="grant-grantee"
              placeholder={t("grants.granteePlaceholder")}
              {...validation.props("grantee")}
              value={grantee}
              onChange={(e) => {
                setGrantee(e.target.value);
              }}
            />
            <Text color="secondary" type="small">
              {t("grants.granteeHelp")}
            </Text>
          </div>

          <div className={styles.field}>
            <Text color="secondary" type="small">
              {t("grants.cap")}
            </Text>
            <Input
              data-testid="grant-cap"
              error={capInvalid}
              placeholder={t("grants.capPlaceholder")}
              {...validation.props("maxRunsPerDay")}
              value={maxRunsPerDay}
              onChange={(e) => {
                setMaxRunsPerDay(e.target.value);
              }}
            />
          </div>

          <div className={styles.field} data-testid="grant-authority">
            <Text color="secondary" type="small">
              {t("grants.authority")}
            </Text>
            <Checkbox
              checked={reveal}
              label={t("grants.reveal")}
              onChange={setReveal}
            />
            {commandOptions.map((option) => (
              <Checkbox
                key={option.value}
                checked={commands.includes(option.value)}
                label={option.label}
                onChange={(checked) => {
                  setCommands((current) =>
                    checked
                      ? [...current, option.value]
                      : current.filter((value) => value !== option.value),
                  );
                }}
              />
            ))}
          </div>

          {channel === GrantChannel.Mail && (
            <div className={styles.field} data-testid="grant-mail-options">
              <ToggleSwitch
                checked={requireToken}
                label={t("grants.requireToken")}
                onChange={setRequireToken}
              />
              <Select
                label={t("grants.minAuth")}
                options={minAuthOptions}
                value={minAuth}
                onChange={setMinAuth}
              />
            </div>
          )}

          {submissionError && <p role="alert">{submissionError}</p>}
          <div className={styles.actions} data-testid="grant-create">
            <Button
              disabled={!submittable}
              type="primary"
              onClick={() => void onCreate()}
            >
              {t("grants.create")}
            </Button>
          </div>
        </div>

        <div className={styles.list} data-testid="grant-list">
          <Text bold color="primary" type="H2">
            {t("grants.existing")}
          </Text>
          {grants.data?.length === 0 && (
            <div data-testid="grant-list-empty">
              <Text color="secondary">{t("grants.none")}</Text>
            </div>
          )}
          {(grants.data ?? []).map((grant) => (
            <div
              key={grant.grantId}
              className={styles.row}
              data-testid={`grant-row-${grant.grantId}`}
            >
              <div className={styles["row-body"]}>
                <Text color="primary">{grant.channelPrincipal}</Text>
                <Text color="secondary" type="small">
                  {grant.channel} · {String(grant.agentsTeam)}
                </Text>
                <Text color="secondary" type="small">
                  {grant.caps.maxRunsPerDay === undefined
                    ? t("grants.uncapped")
                    : t("grants.cappedAt", {
                        cap: String(grant.caps.maxRunsPerDay),
                      })}
                </Text>
              </div>
              {grant.revoked ? (
                <span data-testid={`grant-revoked-${grant.grantId}`}>
                  <Tag>{t("grants.revoked")}</Tag>
                </span>
              ) : (
                <span data-testid={`grant-revoke-${grant.grantId}`}>
                  <Button type="secondary" onClick={() => void onRevoke(grant)}>
                    {t("grants.revoke")}
                  </Button>
                </span>
              )}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <LanguageFooter />
        </div>
      </div>
    </div>
  );
}
