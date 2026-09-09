import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import z from "zod";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { Tag } from "@/lib/components/Tag";
import { Text } from "@/lib/components/Text";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useAlert } from "@/lib/providers/modal/useConfirm";
import {
  usePublishedChannels,
  usePublishToMailMutation,
  useUnpublishMailMutation,
} from "@/lib/queries";

import styles from "./PublishToMail.module.scss";

/**
 * Binds a mail address to the team on chain. Deliberately lighter than the
 * F1R3SKY publish: mail has no external account, so the prepare mints
 * nothing, the binding carries no key material (mailbox keys belong to the
 * mail bridge), and unpublishing merely deactivates the address, reversibly.
 */
const formModel = z.object({
  localPart: z
    .string()
    .nonempty()
    .max(64)
    .regex(
      /^[A-Za-z0-9](?:[A-Za-z0-9._+-]*[A-Za-z0-9+_-])?$/,
      "letters, digits, '.', '_', '+', '-'; no edge or doubled dots",
    ),
  mailDomain: z
    .string()
    .nonempty()
    .regex(/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/, "a dotted domain name"),
});

export default function PublishToMail() {
  const { t } = useTranslation();
  const alert = useAlert();

  const { agentsTeam } = useCurrentAgentsTeam();
  const channels = usePublishedChannels(agentsTeam.id ?? undefined);
  const publish = usePublishToMailMutation(agentsTeam.id!);
  const unpublish = useUnpublishMailMutation();

  const activeBinding = channels.data?.mail.find((entry) => entry.active);

  const publishUnderLoader = useCallbackWithLoader(
    async (value: z.infer<typeof formModel>) =>
      publish.mutateAsync({
        localPart: value.localPart,
        mailDomain: value.mailDomain,
      }),
  );

  // Dialogs stay OUTSIDE the loader-wrapped region: a dialog awaited under
  // the loader renders behind its overlay and can never be dismissed. The
  // loader covers exactly the mutation; the confirmation follows it.
  const onSubmit = async ({
    value,
  }: {
    value: z.infer<typeof formModel>;
  }) => {
    const result = await publishUnderLoader(value);
    await alert({
      message: t("publishMail.successMessage", {
        address: result.prepareResponse.response.address,
      }),
      title: t("publishMail.successTitle"),
    });
  };

  const unpublishUnderLoader = useCallbackWithLoader(async () =>
    unpublish.mutateAsync(agentsTeam.id!),
  );

  const onUnpublish = async () => {
    await unpublishUnderLoader();
    await alert({
      message: t("publishMail.unpublishedMessage"),
      title: t("publishMail.unpublishedTitle"),
    });
  };

  const form = useForm({
    defaultValues: {
      localPart: "",
      mailDomain: "",
    },
    onSubmit,
    validators: {
      onChange: formModel,
    },
  });

  return (
    <div className={styles.root} data-testid="publish-to-mail">
      <form
        className={styles.panel}
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <Text color="secondary" type="small">
          {t("publishMail.titleSmall")}
        </Text>
        <div className={styles.header}>
          <Text bold color="primary" type="H1">
            {t("publishMail.header")}
          </Text>
          <Text color="secondary">{t("publishMail.subtitle")}</Text>
        </div>

        {activeBinding && (
          <div className={styles.current} data-testid="mail-current-binding">
            <Text color="secondary" type="small">
              {t("publishMail.current")}
            </Text>
            <div className={styles["current-row"]}>
              <Text color="primary">{activeBinding.address}</Text>
              <Tag>{t("publishMail.active")}</Tag>
            </div>
            <div data-testid="mail-unpublish">
              <Button type="secondary" onClick={() => void onUnpublish()}>
                {t("publishMail.unpublish")}
              </Button>
            </div>
          </div>
        )}

        <div className={styles.fields}>
          <form.Field name="localPart">
            {(field) => (
              <div className={styles.field}>
                <Text color="secondary" type="small">
                  {t("publishMail.localPart")}
                </Text>
                <Input
                  data-testid="mail-local-part"
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder={t("publishMail.localPartPlaceholder")}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="mailDomain">
            {(field) => (
              <div className={styles.field}>
                <Text color="secondary" type="small">
                  {t("publishMail.domain")}
                </Text>
                <Input
                  data-testid="mail-domain"
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder={t("publishMail.domainPlaceholder")}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                />
              </div>
            )}
          </form.Field>
          <Text color="secondary" type="small">
            {t("publishMail.addressHelp")}
          </Text>
        </div>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <div className={styles.actions}>
              <Button
                disabled={isSubmitting}
                type="secondary"
                onClick={() => {
                  window.history.back();
                }}
              >
                {t("publishMail.cancel")}
              </Button>
              <Button submit disabled={isSubmitting} type="primary">
                {t("publishMail.button")}
              </Button>
            </div>
          )}
        </form.Subscribe>

        <div className={styles.footer}>
          <LanguageFooter />
        </div>
      </form>
    </div>
  );
}
