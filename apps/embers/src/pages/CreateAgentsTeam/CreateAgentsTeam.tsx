import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import z from "zod";

import type { Option } from "@/lib/components/Select";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { Select } from "@/lib/components/Select";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";

import styles from "./CreateAgentsTeam.module.scss";

const flowTypeOptions: Option<string>[] = [
  { label: "Parallel where possible", value: "parallel" },
];

const execTypeOptions: Option<string>[] = [
  { label: "Function", value: "function" },
  { label: "Agent", value: "agent" },
  { label: "Pipeline", value: "pipeline" },
];

const formModel = z.object({
  description: z.union([z.string(), z.undefined()]),
  execType: z.string(),
  flowType: z.string(),
  iconUrl: z.union([z.string(), z.undefined()]),
  language: z.string(),
  name: z.string().nonempty(),
});

export default function CreateAgentsTeam() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, navigateToNextStep, step, updateMany } =
    useGraphEditorStepper();

  const form = useForm({
    defaultValues: {
      description: data.description,
      execType: data.execType ?? execTypeOptions[0].value,
      flowType: data.flowType ?? flowTypeOptions[0].value,
      iconUrl: data.iconUrl,
      language: data.language ?? "en",
      name: data.name,
    },
    onSubmit: ({ value }) => {
      updateMany(value);
      navigateToNextStep();
    },
    validators: {
      onChange: formModel,
    },
  });

  const handleSaveDraft = () => {};
  const handleCancel = () => void navigate("/dashboard");

  return (
    <div className={styles["create-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiTeam.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          steps={[
            { canClick: false, label: t("deploy.generalInfo") },
            { canClick: false, label: t("deploy.creation") },
            { canClick: false, label: t("deploy.deployment") },
          ]}
        />
      </div>

      <div className={styles["content-container"]}>
        <div className={styles["title-container"]}>
          <Text bold color="primary" type="H2">
            {t("aiTeam.tellUsAboutYourTeam")}
          </Text>
        </div>

        <form
          className={styles["details-container"]}
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <Text
            bold
            className={styles["section-title"]}
            color="primary"
            type="H5"
          >
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
                  {t("aiTeam.teamName")}
                </Text>
                <Input
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
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
              <div className={styles.group}>
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
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
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
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
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
              <div className={styles.group}>
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
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
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
                <Button
                  disabled={isSubmitting}
                  type="secondary"
                  onClick={handleCancel}
                >
                  {t("basic.cancel")}
                </Button>
                <div className={styles["button-group"]}>
                  <Button
                    disabled={isSubmitting}
                    type="secondary"
                    onClick={handleSaveDraft}
                  >
                    {t("basic.saveDraft")}
                  </Button>
                  <Button submit disabled={isSubmitting} type="primary">
                    {t("basic.continue")}
                  </Button>
                </div>
              </div>
            )}
          </form.Subscribe>

          <LanguageFooter />
        </form>
      </div>
    </div>
  );
}
