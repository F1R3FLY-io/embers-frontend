import { ApiError, responseError } from "@f1r3fly-io/embers-client-sdk";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import z from "zod";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { Select } from "@/lib/components/Select";
import { Text } from "@/lib/components/Text";
import { FormError } from "@/lib/forms/FormError";
import { fieldError, useForm } from "@/lib/forms/useForm";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useAlert } from "@/lib/providers/modal/useConfirm";
import { useModal } from "@/lib/providers/modal/useModal";
import {
  usePublishAgentsTeamToFireskyMutation,
  useUnpublishAgentsTeamMutation,
} from "@/lib/queries";
import { SuccessModal } from "@/pages/PublishAgentsTeam/SuccessModal";
import {
  DEMO_USERNAME_MAX_LENGTH,
  teamHandleSlug,
} from "@/pages/PublishAgentsTeam/teamHandleSlug";
import publishImage from "@/public/publish.png";

import styles from "./PublishAgentsTeam.module.scss";

const formModel = z
  .object({
    accountMode: z.enum(["create", "existing"]),
    email: z.string(),
    handle: z.string().nonempty(),
    inviteCode: z.string(),
    password: z.string().nonempty(),
    pdsUrl: z
      .url({ message: "Enter the PDS HTTP or HTTPS address." })
      .refine(
        (value) => /^https?:\/\//.test(value),
        "Use an HTTP or HTTPS address.",
      ),
  })
  .superRefine((value, context) => {
    if (
      value.accountMode === "create" &&
      window.FIRESKY_DEMO_PDS_URL?.replace(/\/$/, "") ===
        value.pdsUrl.replace(/\/$/, "")
    ) {
      const username = value.handle.trim().replace(/^@/, "").split(".")[0];
      if (username.length < 3 || username.length > DEMO_USERNAME_MAX_LENGTH) {
        context.addIssue({
          code: "custom",
          message: "Use 3–18 characters before the demo handle suffix.",
          path: ["handle"],
        });
      }
    }
    if (
      value.accountMode === "create" &&
      !z.email().safeParse(value.email).success
    ) {
      context.addIssue({
        code: "custom",
        message: "Enter a valid contact email for the team account.",
        path: ["email"],
      });
    }
  });

export default function PublishAgentsTeam() {
  const { t } = useTranslation();
  const { open } = useModal();
  const [discovery, setDiscovery] = useState<{
    domains: string[];
    invite: boolean;
    url: string;
  } | null>(null);
  const [discoveryError, setDiscoveryError] = useState("");
  const [pdsUrl, setPdsUrl] = useState(window.FIRESKY_PDS_URL ?? "");
  const [suffix, setSuffix] = useState("");
  const [handleEditError, setHandleEditError] = useState("");
  const emailEdited = useRef(false);
  const handleEdited = useRef(false);
  const [published, setPublished] = useState(false);
  const generated = useRef({ email: "", password: "" });

  const { agentsTeam } = useCurrentAgentsTeam();

  const unpublish = useUnpublishAgentsTeamMutation();
  const alert = useAlert();
  const publish = useMutationResultWithLoader(
    usePublishAgentsTeamToFireskyMutation(agentsTeam.id!),
  );

  const onSubmit = useCallbackWithLoader(
    async ({ value }: { value: z.infer<typeof formModel> }) => {
      const modalData = [
        { label: "deploy.labels.agentId" as const, value: agentsTeam.id },
        {
          label: "deploy.version" as const,
          value: agentsTeam.version,
        },
      ];

      const domains =
        discovery?.url === value.pdsUrl.replace(/\/$/, "")
          ? discovery.domains
          : null;
      if (!domains) {
        throw new ApiError(
          discoveryError ||
            "Wait for the PDS information, or check its address.",
          422,
          { pdsUrl: [discoveryError || "Could not verify this PDS."] },
        );
      }
      const fullHandle = value.handle.trim().replace(/^@/, "").toLowerCase();
      const handle = fullHandle.includes(".")
        ? fullHandle
        : `${fullHandle}${suffix || domains[0] || ""}`;

      if (!handle.includes(".")) {
        throw new ApiError("Include a domain suffix in the handle.", 422, {
          handle: ["Include a domain suffix in the handle."],
        });
      }
      if (
        value.accountMode === "create" &&
        discovery?.invite &&
        !value.inviteCode
      ) {
        throw new ApiError(
          "Enter the invitation code required by this PDS.",
          422,
          { inviteCode: ["This PDS requires an invitation code."] },
        );
      }
      return publish.mutateAsync(
        {
          ...value,
          email: value.accountMode === "existing" ? "" : value.email,
          handle,
        },
        {
          onSuccess: () => {
            setPublished(true);
            open(
              <SuccessModal
                agentName={agentsTeam.name!}
                data={modalData}
                handle={handle}
                iconUrl={agentsTeam.logo}
                onUnpublish={() => {
                  // Removes the record that makes f1r3sky treat the handle as a
                  // team. Until now this button closed the modal and did nothing,
                  // so the team kept answering mentions the user believed it had
                  // stopped answering -- and the modal said it had succeeded.
                  //
                  // Only the success is announced here: the mutation reports its own
                  // failures, and saying so twice would be worse than not at all,
                  // because the second dialog reads as a second failure.
                  void unpublish.mutateAsync(agentsTeam.id!).then(
                    async () =>
                      alert({
                        message: `${handle} will no longer respond to mentions. Its account is kept, so you can publish to it again.`,
                        title: "Unpublished",
                      }),
                    () => undefined,
                  );
                }}
              />,
              {
                ariaLabel: "Success deploy",
                maxWidth: 550,
              },
            );
          },
        },
      );
    },
  );

  const form = useForm({
    defaultValues: {
      accountMode: "create" as "create" | "existing",
      email: "",
      handle: teamHandleSlug(agentsTeam.name),
      inviteCode: "",
      password: "",
      pdsUrl: window.FIRESKY_PDS_URL ?? "",
    },
    onSubmit,
    validators: {
      onChange: formModel,
    },
  });

  useEffect(() => {
    if (!handleEdited.current && agentsTeam.name) {
      const handle = teamHandleSlug(agentsTeam.name);
      form.setFieldValue("handle", `${handle}${suffix}`);
    }
  }, [agentsTeam.name, form, suffix]);

  const currentHandle = useSyncExternalStore(
    (listener) => form.store.subscribe(listener),
    () => form.getFieldValue("handle"),
  );
  const accountMode = useSyncExternalStore(
    (listener) => form.store.subscribe(listener),
    () => form.getFieldValue("accountMode"),
  );
  const limitDemoUsername =
    accountMode === "create" &&
    window.FIRESKY_DEMO_PDS_URL?.replace(/\/$/, "") ===
      pdsUrl.replace(/\/$/, "");
  useEffect(() => {
    if (
      emailEdited.current ||
      window.FIRESKY_DEMO_PDS_URL?.replace(/\/$/, "") !==
        pdsUrl.replace(/\/$/, "")
    )
      return;
    const localPart = currentHandle
      .trim()
      .replace(/^@/, "")
      .split(".")[0]
      .toLowerCase();
    const email = localPart ? `${localPart}@example.com` : "";
    if (form.getFieldValue("email") !== email) {
      generated.current.email = email;
      form.setFieldValue("email", email);
    }
  }, [currentHandle, form, pdsUrl]);

  useEffect(() => {
    const controller = new AbortController();
    setDiscovery(null);
    setDiscoveryError("");
    const timer = setTimeout(() => {
      if (!/^https?:\/\//.test(pdsUrl)) {
        return;
      }
      const url = pdsUrl.replace(/\/$/, "");
      void fetch(
        `${window.API_URL}/api/ai-agents-teams/publication/pds?pds_url=${encodeURIComponent(url)}`,
        { signal: controller.signal },
      )
        .then(async (response) => {
          if (!response.ok) {
            throw await responseError(response);
          }
          const body = (await response.json()) as {
            availableUserDomains: string[];
            inviteCodeRequired: boolean;
          };
          if (!Array.isArray(body.availableUserDomains)) {
            throw new Error("The server did not advertise handle suffixes.");
          }
          const domains = body.availableUserDomains
            .filter((domain) => typeof domain === "string")
            .map((domain) => `.${domain.replace(/^\./, "")}`);
          if (controller.signal.aborted) {
            return;
          }
          setDiscovery({ domains, invite: body.inviteCodeRequired, url });
          setSuffix(domains[0] ?? "");
          const handle = form.getFieldValue("handle");
          if (handle && !handle.includes(".")) {
            form.setFieldValue("handle", `${handle}${domains[0] ?? ""}`);
          }
          const demo = window.FIRESKY_DEMO_PDS_URL?.replace(/\/$/, "") === url;
          if (demo) {
            const email = `${form.getFieldValue("handle").split(".")[0]}@example.com`;
            if (!emailEdited.current) {
              form.setFieldValue("email", email);
              generated.current.email = email;
            }
            if (!form.getFieldValue("password")) {
              form.setFieldValue("password", "password123");
              generated.current.password = "password123";
            }
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setDiscoveryError(
              error instanceof Error
                ? error.message
                : "Could not reach this PDS.",
            );
          }
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pdsUrl, form]);

  return (
    <div className={styles.root}>
      <div className={styles["image-panel"]}>
        <div className={styles["image-frame"]}>
          <img alt="" className={styles.image} src={publishImage} />
        </div>
      </div>

      <form
        className={styles["right-panel"]}
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
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
            <IconPreview url={agentsTeam.logo} />
          </div>
        </div>

        <div className={styles["form-fields"]}>
          <form.Field name="accountMode">
            {(field) => (
              <Select
                label="Team social account"
                name={field.name}
                value={field.state.value}
                options={[
                  { label: "Create account", value: "create" },
                  { label: "Use existing account", value: "existing" },
                ]}
                errorMessage={fieldError(field.state.meta)}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <p>
            These credentials belong to the team’s F1r3sky account. Embers uses
            an app password to publish replies afterward.
          </p>
          {window.FIRESKY_DEMO_PDS_URL?.replace(/\/$/, "") ===
            pdsUrl.replace(/\/$/, "") && (
            <p>Local demo credentials are prefilled and editable.</p>
          )}

          <div className={styles["form-field"]}>
            <Text color="secondary" type="small">
              {t("publish.agentName")}
            </Text>
            <Input readOnly placeholder="Agent name" value={agentsTeam.name} />
          </div>

          <form.Field name="handle">
            {(field) => (
              <div className={styles["form-field"]}>
                <Text color="secondary" type="small">
                  {t("publish.username")}
                </Text>
                <Input
                  errorMessage={
                    (limitDemoUsername && handleEditError) ||
                    fieldError(field.state.meta)
                  }
                  maxLength={
                    limitDemoUsername
                      ? DEMO_USERNAME_MAX_LENGTH + suffix.length
                      : undefined
                  }
                  name={field.name}
                  placeholder="Username"
                  value={field.state.value}
                  onBlur={() => {
                    const handle = field.state.value
                      .trim()
                      .replace(/^@/, "")
                      .toLowerCase();
                    field.handleChange(
                      handle && !handle.includes(".")
                        ? `${handle}${suffix}`
                        : handle,
                    );
                    field.handleBlur();
                  }}
                  onChange={(e) => {
                    if (
                      limitDemoUsername &&
                      e.target.value.trim().replace(/^@/, "").split(".")[0]
                        .length > DEMO_USERNAME_MAX_LENGTH
                    ) {
                      setHandleEditError(
                        "Use at most 18 characters before the demo handle suffix.",
                      );
                      return;
                    }
                    setHandleEditError("");
                    handleEdited.current = true;
                    field.handleChange(e.target.value);
                  }}
                  onPaste={(event) => {
                    if (!limitDemoUsername) {
                      return;
                    }
                    const input = event.currentTarget;
                    const candidate =
                      input.value.slice(0, input.selectionStart ?? 0) +
                      event.clipboardData.getData("text") +
                      input.value.slice(
                        input.selectionEnd ?? input.value.length,
                      );
                    if (
                      candidate.trim().replace(/^@/, "").split(".")[0].length >
                      DEMO_USERNAME_MAX_LENGTH
                    ) {
                      event.preventDefault();
                      setHandleEditError(
                        "Use at most 18 characters before the demo handle suffix.",
                      );
                    }
                  }}
                />
                {limitDemoUsername && (
                  <Text color="secondary" type="small">
                    Use 3–18 characters before {suffix || "the domain suffix"}.
                  </Text>
                )}
              </div>
            )}
          </form.Field>

          {discovery && discovery.domains.length > 0 && (
            <Select
              label="Handle suffix"
              value={suffix}
              options={discovery.domains.map((domain) => ({
                label: domain,
                value: domain,
              }))}
              onChange={(next) => {
                const handle = form.getFieldValue("handle");
                if (!handle.includes(".")) {
                  form.setFieldValue("handle", `${handle}${next}`);
                } else if (suffix && handle.endsWith(suffix)) {
                  form.setFieldValue(
                    "handle",
                    `${handle.slice(0, -suffix.length)}${next}`,
                  );
                }
                setSuffix(next);
              }}
            />
          )}
          <form.Field name="pdsUrl">
            {(field) => (
              <div className={styles["form-field"]}>
                <Text color="secondary" type="small">
                  {t("publish.pdsAddress")}
                </Text>
                <Input
                  errorMessage={fieldError(field.state.meta) || discoveryError}
                  name={field.name}
                  placeholder="https://"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    setPdsUrl(e.target.value);
                    if (
                      e.target.value.replace(/\/$/, "") !==
                      window.FIRESKY_DEMO_PDS_URL?.replace(/\/$/, "")
                    ) {
                      if (!emailEdited.current) {
                        form.setFieldValue("email", "");
                      }
                      if (
                        form.getFieldValue("password") ===
                        generated.current.password
                      ) {
                        form.setFieldValue("password", "");
                      }
                    }
                  }}
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.accountMode}>
            {(mode) =>
              mode === "create" ? (
                <form.Field name="email">
                  {(field) => (
                    <div className={styles["form-field"]}>
                      <Text color="secondary" type="small">
                        Email
                      </Text>
                      <Input
                        errorMessage={fieldError(field.state.meta)}
                        name={field.name}
                        placeholder="you@example.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          emailEdited.current = true;
                          field.handleChange(e.target.value);
                        }}
                      />
                    </div>
                  )}
                </form.Field>
              ) : null
            }
          </form.Subscribe>
          <form.Field name="password">
            {(field) => (
              <div className={styles["form-field"]}>
                <Text color="secondary" type="small">
                  Password
                </Text>
                <Input
                  autoComplete="off"
                  errorMessage={fieldError(field.state.meta)}
                  name={field.name}
                  placeholder="Enter password"
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.values.accountMode}>
            {(mode) =>
              mode === "create" && discovery?.invite ? (
                <form.Field name="inviteCode">
                  {(field) => (
                    <Input
                      aria-label="Invitation code"
                      errorMessage={fieldError(field.state.meta)}
                      name={field.name}
                      placeholder="Invitation code"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  )}
                </form.Field>
              ) : null
            }
          </form.Subscribe>
        </div>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <div className={styles["button-row"]}>
              <Button
                disabled={isSubmitting}
                type="secondary"
                onClick={() => window.history.back()}
              >
                {published ? t("basic.close") : t("publish.cancel")}
              </Button>

              <Button
                submit
                disabled={
                  isSubmitting || (limitDemoUsername && !!handleEditError)
                }
                type="primary"
              >
                {t("publish.button")}
              </Button>
            </div>
          )}
        </form.Subscribe>

        <div className={styles.footer}>
          <LanguageFooter />
        </div>
        <form.Subscribe selector={(state) => state.errorMap.onServer}>
          {(error) => <FormError error={error} />}
        </form.Subscribe>
      </form>
    </div>
  );
}
