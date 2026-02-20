import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import z from "zod";

import type { Option } from "@/lib/components/Select";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { Select } from "@/lib/components/Select";
import { Text } from "@/lib/components/Text";

import styles from "./AgentsTeamGeneralInfoFrom.module.scss";

const flowTypeOptions: Option<string>[] = [
  { label: "Parallel where possible", value: "parallel" },
];

const execTypeOptions: Option<string>[] = [
  { label: "Function", value: "function" },
  { label: "Agent", value: "agent" },
  { label: "Pipeline", value: "pipeline" },
];

const formModel = z.object({
  description: z.string().optional(),
  execType: z.string(),
  flowType: z.string(),
  language: z.string(),
  logo: z.string().optional(),
  name: z.string().nonempty(),
});

export type FromModel = z.infer<typeof formModel>;

export type AgentGeneralInfoFromProps = {
  initialData?: FromModel;
  onCancel: () => void;
  onSubmit: (value: FromModel) => void;
};

export function AgentsTeamGeneralInfoFrom({
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

      <form.Field name="logo">
        {(field) => (
          <div className={styles["icon-section"]}>
            <IconPreview url={field.state.value} />
            <div className={styles["icon-input-container"]}>
              <Text color="secondary" type="small">
                {t("deploy.iconUrl")}
              </Text>
              <Input
                error={field.state.meta.isTouched && !field.state.meta.isValid}
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
              {t("aiTeam.teamName")}
            </Text>
            <Input
              error={field.state.meta.isTouched && !field.state.meta.isValid}
              placeholder={t("aiTeam.teamName")}
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
              {t("basic.description")}
            </Text>
            <Input
              textarea
              placeholder={t("basic.description")}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="execType">
        {(field) => (
          <div className={classNames(styles["form-section"], styles.group)}>
            <Text
              bold
              className={styles["section-title"]}
              color="primary"
              type="H5"
            >
              {t("aiTeam.executionContext")}
            </Text>
            <Text className={styles.hint} color="secondary" type="small">
              {t("aiTeam.executionContextHint")}
            </Text>

            <Select
              error={field.state.meta.isTouched && !field.state.meta.isValid}
              label={t("aiTeam.executionType")}
              options={execTypeOptions}
              value={field.state.value}
              onChange={field.handleChange}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="language">
        {(field) => (
          <div className={styles["form-section"]}>
            <Select
              error={field.state.meta.isTouched && !field.state.meta.isValid}
              label={t("basic.language")}
              options={[{ label: "English", value: "en" }]}
              value={field.state.value}
              onChange={field.handleChange}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="flowType">
        {(field) => (
          <div className={classNames(styles["form-section"], styles.group)}>
            <Text
              bold
              className={styles["section-title"]}
              color="primary"
              type="H5"
            >
              {t("aiTeam.computeSettings")}
            </Text>
            <Text className={styles.hint} color="secondary" type="small">
              {t("aiTeam.computeSettingsHint")}
            </Text>

            <Select
              error={field.state.meta.isTouched && !field.state.meta.isValid}
              label={t("aiTeam.flowType")}
              options={flowTypeOptions}
              value={field.state.value}
              onChange={field.handleChange}
            />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <div className={styles["button-container"]}>
            <Button disabled={isSubmitting} type="secondary" onClick={onCancel}>
              {t("basic.cancel")}
            </Button>
            <Button submit disabled={isSubmitting} type="primary">
              {t("basic.continue")}
            </Button>
          </div>
        )}
      </form.Subscribe>

      <LanguageFooter />
    </form>
  );
}
