import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import z from "zod";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useOSLFEditorStepper } from "@/lib/providers/stepper/flows/OSLFEditor";

import styles from "./CreateOSLF.module.scss";

const formModel = z.object({
  description: z.string(),
  name: z.string().trim().min(1),
});

export default function CreateOSLF() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, navigateToNextStep, setStep, step, updateData } =
    useOSLFEditorStepper();

  const form = useForm({
    defaultValues: {
      description: data.description,
      name: data.name,
    },
    onSubmit: ({ value }) => {
      updateData("name", value.name);
      updateData("description", value.description);
      navigateToNextStep();
    },
    validators: {
      onChange: formModel,
    },
  });

  const handleCancel = () => void navigate("/dashboard");

  useEffect(() => {
    setStep(0);
  }, [setStep]);

  return (
    <div className={styles["create-container"]}>
      <Text bold color="primary" type="H1">
        {t("oslf.createGraphQuery")}
      </Text>

      <div className={styles["stepper-container"]}>
        <Stepper
          currentStep={step}
          steps={[
            t("oslf.generalSettings"),
            t("oslf.creation"),
            t("oslf.validate"),
            t("oslf.search"),
          ]}
        />
      </div>

      <div className={styles["content-container"]}>
        <form
          className={styles["details-container"]}
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <Text bold color="primary" type="H5">
            {t("oslf.generalSettings")}
          </Text>

          <form.Field name="name">
            {(field) => (
              <div className={styles["form-section"]}>
                <Text color="secondary" type="small">
                  {t("oslf.queryName")}
                </Text>
                <Input
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  placeholder={t("oslf.queryName")}
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
                  {t("oslf.purpose")}
                </Text>
                <Input
                  textarea
                  placeholder={t("oslf.purpose")}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
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
                    className={styles["continue-button"]}
                    disabled={!isSubmitting}
                    type="primary"
                  >
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
