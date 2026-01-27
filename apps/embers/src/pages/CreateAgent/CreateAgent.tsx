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
import { useCodeEditorStepper } from "@/lib/providers/stepper/flows/CodeEditor";

import styles from "./CreateAgent.module.scss";

const formModel = z.object({
  environment: z.union([z.string(), z.undefined()]),
  iconUrl: z.union([z.string(), z.undefined()]),
  name: z.string().nonempty(),
});

export default function CreateAgent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, navigateToNextStep, step, updateData } = useCodeEditorStepper();

  const form = useForm({
    defaultValues: {
      environment: data.environment,
      iconUrl: data.agentIconUrl,
      name: data.agentName,
    },
    onSubmit: ({ value }) => {
      updateData("agentName", value.name);
      updateData("environment", value.environment);
      updateData("agentIconUrl", value.iconUrl);
      navigateToNextStep();
    },
    validators: {
      onChange: formModel,
    },
  });

  const envOptions: Option<string>[] = [
    { label: "Development", value: "dev" },
    { label: "Staging", value: "staging" },
    { label: "Production", value: "prod" },
  ];

  const shardByEnv: Record<string, string> = {
    dev: "shard://dev.test.net",
    prod: "shard://prod.test.net",
    staging: "shard://staging.test.net",
  };

  const estimatedCost = 50000;

  const handleCancel = () => void navigate("/dashboard");

  return (
    <div className={styles["create-container"]}>
      <Text bold color="primary" type="H1">
        {t("aiAgent.create")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          steps={[
            {
              canClick: false,
              label: t("deploy.generalInfo"),
            },
            {
              canClick: false,
              label: t("deploy.creation"),
            },
            {
              canClick: false,
              label: t("deploy.deployment"),
            },
          ]}
        />
      </div>

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
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder={t("deploy.agentName")}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="environment">
            {(field) => (
              <div className={styles["form-section"]}>
                <Select
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  label={t("deploy.blockchainShard")}
                  options={envOptions}
                  placeholder={t("agents.selectEnvironment")}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
                {field.state.value && (
                  <div className={styles["description-container"]}>
                    <Text color="secondary" type="small">
                      {shardByEnv[field.state.value]}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </form.Field>

          <div className={styles["form-section"]}>
            <div className={styles["estimation-bar"]}>
              <Text color="secondary" type="small">
                {t("deploy.estimatedCost")}
              </Text>
              <div className={styles["estimation-value"]}>
                <Text color="primary" type="small">
                  {estimatedCost.toLocaleString()}
                </Text>
                <Text color="primary" type="small">
                  &nbsp;FIR3CAPS
                </Text>
              </div>
            </div>
          </div>

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
                  <button
                    className={styles["continue-button"]}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {t("basic.continue")}
                  </button>
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
