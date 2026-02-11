import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import z from "zod";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { Text } from "@/lib/components/Text";

import styles from "./AgentGeneralInfoFrom.module.scss";

const formModel = z.object({
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  name: z.string().nonempty(),
});

export type FromModel = z.infer<typeof formModel>;

export type AgentGeneralInfoFromProps = {
  initialData?: FromModel;
  onCancel: () => void;
  onSubmit: (value: FromModel) => void;
};

export function AgentGeneralInfoFrom({
  initialData,
  onCancel,
  onSubmit,
}: AgentGeneralInfoFromProps) {
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: initialData,
    onSubmit: ({ value }) => onSubmit(value),
    validators: {
      onChange: formModel,
    },
  });

  return (
    <div className={styles["content-container"]}>
      <div className={styles["title-container"]}>
        <Text bold color="primary" type="H2">
          {t("agents.tellUsAboutYourAgent")}
        </Text>
      </div>

      <form
        className={styles["details-container"]}
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <Text bold color="primary" type="H5">
          {t("agents.generalSettings")}
        </Text>

        <form.Field name="iconUrl">
          {(field) => (
            <div className={styles["icon-section"]}>
              <IconPreview url={field.state.value} />
              <div className={styles["icon-input-container"]}>
                <Text color="secondary" type="small">
                  {t("deploy.iconUrl")}
                </Text>
                <Input
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder="https://example.com/icon.png"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            </div>
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <div className={styles["form-section"]}>
              <Text color="secondary" type="small">
                {t("deploy.agentName")}
              </Text>
              <Input
                error={field.state.meta.isTouched && !field.state.meta.isValid}
                placeholder={t("deploy.agentName")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div className={styles["form-section"]}>
              <Text color="secondary" type="small">
                {t("deploy.agentDescription")}
              </Text>
              <Input
                textarea
                error={field.state.meta.isTouched && !field.state.meta.isValid}
                placeholder={t("deploy.agentDescription")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.isSubmitting, state.isValid]}>
          {([isSubmitting, isValid]) => (
            <div className={styles["button-container"]}>
              <Button
                disabled={isSubmitting}
                type="secondary"
                onClick={onCancel}
              >
                {t("basic.cancel")}
              </Button>
              <Button submit disabled={!isValid || isSubmitting} type="primary">
                {t("basic.continue")}
              </Button>
            </div>
          )}
        </form.Subscribe>

        <LanguageFooter />
      </form>
    </div>
  );
}
