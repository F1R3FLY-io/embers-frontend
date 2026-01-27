import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import z from "zod";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { WarningModal } from "@/lib/components/Modal/WarningModal";
import { Text } from "@/lib/components/Text";
import { useCallbackWithLoader } from "@/lib/providers/loader/useCallbackWithLoader";
import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useModal } from "@/lib/providers/modal/useModal";
import { usePublishAgentsTeamToFireskyMutation } from "@/lib/queries";
import { SuccessModal } from "@/pages/PublishAgentsTeam/SuccessModal";
import publishImage from "@/public/publish.png";

import styles from "./PublishAgentsTeam.module.scss";

const formModel = z.object({
  email: z.email(),
  handle: z.string().nonempty(),
  password: z.string().nonempty(),
  pdsUrl: z.url(),
});

export default function PublishAgentsTeam() {
  const { t } = useTranslation();
  const { close, open } = useModal();
  const location = useLocation();

  const preload = location.state as {
    agentId: string;
    agentName: string;
    iconUrl: string;
    version: string;
  };

  const publish = useMutationResultWithLoader(
    usePublishAgentsTeamToFireskyMutation(preload.agentId),
  );

  const onSubmit = useCallbackWithLoader(
    async ({ value }: { value: z.infer<typeof formModel> }) => {
      const modalData = [
        { label: "deploy.labels.agentId", value: preload.agentId },
        {
          label: "deploy.version",
          value: preload.version,
        },
        { label: "deploy.labels.note", value: "idk what to put here" },
      ];

      return publish.mutateAsync(value, {
        onError: (e) => {
          open(
            <WarningModal
              error={e.message}
              reviewSettings={close}
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
              agentName={preload.agentName}
              data={modalData}
              iconUrl={preload.iconUrl}
            />,
            {
              ariaLabel: "Success deploy",
              maxWidth: 550,
            },
          );
        },
      });
    },
  );

  const form = useForm({
    defaultValues: {
      email: "",
      handle: "",
      password: "",
      pdsUrl: "",
    },
    onSubmit,
    validators: {
      onChange: formModel,
    },
  });

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
            <IconPreview url={preload.iconUrl} />
          </div>
        </div>

        <div className={styles["form-fields"]}>
          <div className={styles["form-field"]}>
            <Text color="secondary" type="small">
              {t("publish.agentName")}
            </Text>
            <Input placeholder="Agent name" value={preload.agentName} />
          </div>

          <form.Field name="handle">
            {(field) => (
              <div className={styles["form-field"]}>
                <Text color="secondary" type="small">
                  {t("publish.username")}
                </Text>
                <Input
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder="Username"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="pdsUrl">
            {(field) => (
              <div className={styles["form-field"]}>
                <Text color="secondary" type="small">
                  {t("publish.pdsAddress")}
                </Text>
                <Input
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder="https://"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className={styles["form-field"]}>
                <Text color="secondary" type="small">
                  Email
                </Text>
                <Input
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder="you@example.com"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className={styles["form-field"]}>
                <Text color="secondary" type="small">
                  Password
                </Text>
                <Input
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder="Enter password"
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <div className={styles["button-row"]}>
              <Button
                disabled={isSubmitting}
                type="secondary"
                onClick={() => window.history.back()}
              >
                {t("publish.cancel")}
              </Button>

              <button
                className={styles["primary-button"]}
                disabled={isSubmitting}
                type="submit"
              >
                {t("publish.button")}
              </button>
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
