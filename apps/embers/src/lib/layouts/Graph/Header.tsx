import type React from "react";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { MenuItem } from "@/lib/components/ContextMenu";
import type { CurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";

import { Button } from "@/lib/components/Button";
import { ContextMenu } from "@/lib/components/ContextMenu";
import { InterfacesPanel } from "@/lib/components/InterfacesPanel";
import { PromptModal } from "@/lib/components/Modal/PromptModal";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";
import { useDock } from "@/lib/providers/dock/useDock";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useModal } from "@/lib/providers/modal/useModal";
import {
  useCreateAgentsTeamMutation,
  useRunAgentsTeamMutation,
  useSaveAgentsTeamMutation,
  useTeamPublishedState,
} from "@/lib/queries";
import { assertPublishable, toWorkflowDefinition } from "@/lib/workflow";
import ChevronDownIcon from "@/public/icons/chevrondown-icon.svg?react";

import styles from "./Header.module.scss";

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { agentsTeam, update } = useCurrentAgentsTeam();
  const dock = useDock();
  const { open } = useModal();
  const navigate = useNavigate();

  const id = agentsTeam.id!;
  const saveMutation = useSaveAgentsTeamMutation(id);
  const createMutation = useCreateAgentsTeamMutation();
  const runAgentsTeam = useMutationResultWithLoader(useRunAgentsTeamMutation());

  const isDeployed = agentsTeam.lastDeployKey || agentsTeam.uri;

  const logError = useCallback(
    (err: Error) => dock.appendLog(err.message, "error"),
    [dock],
  );
  const canRun = Boolean(isDeployed && !agentsTeam.hasGraphChanges);

  // The primary button can only ever offer one action, so once a deployed team
  // has no pending graph edits it reads "Run" and both deploying and publishing
  // become unreachable from the editor. The caret is where they live.
  //
  // Gated on being deployed because that is the precondition both share: a
  // second deploy is only ever a *re*-deploy here, and the server rejects
  // publishing an undeployed team outright ("agents team not deployed").
  const hasMenu = Boolean(isDeployed);

  // What the chain records about this team's publication, reconciled against the
  // PDS. Until this existed the client could not tell published from unpublished,
  // so the menu had to say "Publish" even when it was a re-publish.
  const { data: published } = useTeamPublishedState(hasMenu ? id : undefined);
  const caretRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<
    { x: number; y: number } | undefined
  >(undefined);

  const openMenu = useCallback(() => {
    const caret = caretRef.current?.getBoundingClientRect();
    if (!caret) {
      return;
    }
    // Hang the menu from the caret's bottom-right corner so it tracks the
    // button rather than the pointer -- this opens from a click, not a
    // right-click, so there is no cursor position to anchor to. Paired with
    // align="end", the menu's right edge lines up with the split button's
    // right edge instead of the Run/caret divider.
    setMenuPosition({ x: caret.right, y: caret.bottom + 4 });
  }, []);

  const closeMenu = useCallback(() => setMenuPosition(undefined), []);

  const saveOrCreate = useCallback(async () => {
    // An empty canvas is an ordinary state, not a missing one: a new team has
    // no `nodes` until the first drop and no `edges` until the first
    // connection. Asserting them non-null turned "drop one node and save into
    // a draft" -- the state every team passes through -- into a TypeError
    // raised inside the projection, before any request was sent, surfaced only
    // as an internal message in the dock with nothing saved.
    const nodes = agentsTeam.nodes ?? [];
    const edges = agentsTeam.edges ?? [];
    const payload = {
      definition: agentsTeam.definition,
      description: agentsTeam.description,
      edges,
      logo: agentsTeam.logo,
      name: agentsTeam.name!,
      nodes,
    };
    if (id) {
      const res = await saveMutation.mutateAsync(payload);
      await res.waitForFinalization;
      return {
        definition: toWorkflowDefinition(nodes, edges, agentsTeam.definition),
        id,
        version: res.prepareResponse.response.version,
      };
    }
    const res = await createMutation.mutateAsync(payload);
    await res.waitForFinalization;
    return {
      definition: toWorkflowDefinition(nodes, edges, agentsTeam.definition),
      id: res.prepareResponse.response.id,
      version: res.prepareResponse.response.version,
    };
  }, [
    agentsTeam.description,
    agentsTeam.definition,
    agentsTeam.edges,
    agentsTeam.logo,
    agentsTeam.name,
    agentsTeam.nodes,
    createMutation,
    id,
    saveMutation,
  ]);

  const handleSave = useCallbackWithLoader(async () => {
    try {
      const { definition, id, version } = await saveOrCreate();
      update({ definition, id, version });
      dock.appendLog(`Agent ${id} with ${version} has been saved!`, "info");
    } catch (e) {
      dock.appendLog(
        `Save failed: ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
      throw e;
    }
  });

  const handleDeploy = useCallbackWithLoader(async () => {
    try {
      assertPublishable(
        toWorkflowDefinition(
          agentsTeam.nodes ?? [],
          agentsTeam.edges ?? [],
          agentsTeam.definition,
        ),
      );
      const { definition, id, version } = await saveOrCreate();
      update({ definition, id, version });
      void navigate("/agents-team/deploy");
    } catch (e) {
      dock.appendLog(
        `Pre-deploy save failed with error: ${e instanceof Error ? e.message : String(e)}`,
        "error",
      );
    }
  });

  // Names the publish action for what it would actually do. Two divergences are
  // worth calling out in the label itself, because neither produces an error and
  // both are otherwise invisible: an account that no longer exists, and a
  // publication left pointing at a deployment that is no longer the newest.
  //
  // `account_exists === null` deliberately reads as a plain re-publish: it means the
  // PDS could not be reached or the publish predates handles being recorded, and
  // announcing a missing account on that basis would cry wolf every time the PDS
  // blinked.
  const publishLabel = (() => {
    if (!published) {
      return t("deploy.publishToFiresky");
    }
    if (published.account_exists === false) {
      return t("deploy.republishAccountMissing");
    }
    if (!published.is_latest_deployment) {
      return t("deploy.publishStale");
    }
    return t("deploy.republishToFiresky");
  })();

  // Ordered as the workflow runs: deploy, then the publication surfaces,
  // then the read-only views.
  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        content: t("deploy.deploy"),
        onClick: () => void handleDeploy(),
        type: "text",
      },
      {
        content: publishLabel,
        onClick: () =>
          void navigate("/agents-team/publish", {
            // "latest" mirrors what the dashboard passes, and matches the
            // server, which resolves the team by its latest version when
            // publishing.
            state: { id, version: "latest" } satisfies CurrentAgentsTeam,
          }),
        type: "text",
      },
      {
        content: t("deploy.publishToMail"),
        onClick: () =>
          void navigate("/agents-team/publish-mail", {
            state: { id, version: "latest" } satisfies CurrentAgentsTeam,
          }),
        type: "text",
      },
      {
        content: t("deploy.manageGrants"),
        onClick: () => void navigate("/grants"),
        type: "text",
      },
      {
        content: t("deploy.interfaces"),
        onClick: () => {
          open(<InterfacesPanel teamId={id} />, {
            ariaLabel: t("interfaces.title"),
            maxWidth: 480,
          });
        },
        type: "text",
      },
    ],
    [handleDeploy, id, navigate, open, publishLabel, t],
  );

  const onRun = () => {
    open(
      <PromptModal
        cancelLabel={t("basic.cancel")}
        confirmLabel={t("basic.run")}
        inputLabel={t("basic.inputPrompt")}
        inputPlaceholder={t("deploy.enterInputPrompt")}
        onConfirm={(prompt) => {
          if (agentsTeam.uri) {
            void runAgentsTeam
              .mutateAsync({
                prompt,
                uri: agentsTeam.uri,
              })
              .then((result) => {
                dock.appendLog(
                  JSON.stringify(
                    result.sendResponse,
                    (_, value) =>
                      typeof value === "string" && value.length > 2000
                        ? `${value.slice(0, 2000)}...`
                        : (value as unknown),
                    4,
                  ),
                  "info",
                );
                const { runId } = result.prepareResponse.response;
                dock.appendLog(t("deploy.runLogged", { runId }), "info", {
                  href: `/runs/${runId}`,
                  label: t("deploy.openRunInspector"),
                });
              })
              .catch(logError);
          }
        }}
      />,
      {
        ariaLabel: "Prompt modal",
        closeOnBlur: true,
        closeOnEsc: true,
        maxWidth: 550,
        showCloseButton: false,
      },
    );
  };
  return (
    <>
      <Button type="subtle" onClick={handleSave}>
        {t("deploy.saveAsDraft")}
      </Button>
      <div className={styles.split}>
        <Button
          className={hasMenu ? styles["split-main"] : undefined}
          type="primary"
          onClick={async () => (canRun ? onRun() : handleDeploy())}
        >
          {canRun ? t("basic.run") : t("deploy.deploy")}
        </Button>
        {hasMenu && (
          <div ref={caretRef}>
            <Button
              ariaLabel={t("deploy.moreActions")}
              className={styles["split-caret"]}
              expanded={menuPosition !== undefined}
              icon={<ChevronDownIcon className={styles["caret-icon"]} />}
              type="primary"
              onClick={openMenu}
            />
          </div>
        )}
      </div>
      <ContextMenu
        align="end"
        direction="bottom"
        items={menuItems}
        open={menuPosition !== undefined}
        position={menuPosition ?? { x: 0, y: 0 }}
        onClose={closeMenu}
      />
    </>
  );
};
