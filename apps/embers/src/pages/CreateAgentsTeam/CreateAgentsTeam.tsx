import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { Option } from "@/lib/components/Select";

import { Button } from "@/lib/components/Button";
import { IconPreview } from "@/lib/components/IconPreview";
import { Input } from "@/lib/components/Input";
import LanguageFooter from "@/lib/components/LanguageFooter";
import { Select } from "@/lib/components/Select";
import { SelectRow } from "@/lib/components/SelectRow";
import Stepper from "@/lib/components/Stepper";
import { Text } from "@/lib/components/Text";
import { useGraphEditorStepper } from "@/lib/providers/stepper/flows/GraphEditor";

import styles from "./CreateAgentsTeam.module.scss";

export default function CreateAgentsTeam() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, navigateToNextStep, setStep, step, updateData } =
    useGraphEditorStepper();

  const [agentName, setAgentName] = useState(data.agentName);
  const [description, setDescription] = useState(data.description);
  const [iconUrl, setIconUrl] = useState(data.iconUrl);

  const execTypeOptions: Option[] = useMemo(
    () => [
      { label: "Function", value: "function" },
      { label: "Agent", value: "agent" },
      { label: "Pipeline", value: "pipeline" },
    ],
    [],
  );
  const [execType, setExecType] = useState(
    data.execType ?? execTypeOptions[0].value,
  );

  const [inputTextual, setInputTextual] = useState(true);
  const [inputExternal, setInputExternal] = useState(true);
  const [inputMedia, setInputMedia] = useState(false);

  const [outStructured, setOutStructured] = useState(true);
  const [outExpl, setOutExpl] = useState(true);
  const [outVisual, setOutVisual] = useState(false);

  const [language, setLanguage] = useState(data.language ?? "en");

  const flowTypeOptions: Option[] = useMemo(
    () => [
      { label: "Step-by-step (sequential flow)", value: "sequential" },
      { label: "Parallel where possible", value: "parallel" },
    ],
    [],
  );

  const [flowType, setFlowType] = useState(
    data.flowType ?? flowTypeOptions[0].value,
  );

  const canContinue =
    agentName.trim().length > 0 &&
    (inputTextual || inputExternal || inputMedia) &&
    (outStructured || outExpl || outVisual);

  const handleCancel = () => void navigate("/dashboard");

  const handleSaveDraft = () => {
    updateData("agentName", agentName);
    updateData("description", description);
    updateData("iconUrl", iconUrl);
    updateData("execType", execType);
    updateData("inputs", {
      external: inputExternal,
      media: inputMedia,
      textual: inputTextual,
    });
    updateData("outputs", {
      explanation: outExpl,
      structured: outStructured,
      visualization: outVisual,
    });
    updateData("language", language);
    updateData("flowType", flowType);
    // updateData("encryptResult", encryptResult);
  };

  const submitForm = () => {
    handleSaveDraft();
    navigateToNextStep();
  };

  useEffect(() => setStep(0), [setStep]);

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
            { canClick: canContinue, label: t("deploy.creation") },
            { canClick: canContinue, label: t("deploy.deployment") },
          ]}
        />
      </div>

      <div className={styles["content-container"]}>
        <div className={styles["title-container"]}>
          <Text bold color="primary" type="H2">
            {t("aiTeam.tellUsAboutYourTeam")}
          </Text>
        </div>

        <div className={styles["details-container"]}>
          <Text
            bold
            className={styles["section-title"]}
            color="primary"
            type="H5"
          >
            {t("agents.generalSettings")}
          </Text>

          <div className={styles["icon-section"]}>
            <IconPreview url={iconUrl} />
            <div className={styles["icon-input-container"]}>
              <Text color="secondary" type="small">
                {t("deploy.iconUrl")}
              </Text>
              <Input
                inputType="input"
                placeholder="https://example.com/icon.png"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
              />
            </div>
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("aiTeam.teamName")}
            </Text>
            <Input
              inputType="input"
              placeholder={t("aiTeam.teamName")}
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>

          <div className={styles["form-section"]}>
            <Text color="secondary" type="small">
              {t("basic.description")}
            </Text>
            <Input
              inputType="textarea"
              placeholder={t("basic.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

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
              label={t("aiTeam.executionType")}
              options={execTypeOptions}
              value={execType}
              onChange={setExecType}
            />
          </div>

          <div className={styles.group}>
            <Text
              bold
              className={styles["section-title"]}
              color="primary"
              type="H5"
            >
              {t("aiTeam.inputType")}
            </Text>
            <Text className={styles.hint} color="secondary" type="small">
              {t("aiTeam.inputTypeHint")}
            </Text>

            <SelectRow
              explanation={t("aiTeam.textualInputHint")}
              selected={inputTextual}
              title={t("aiTeam.textualInput")}
              onSelectedChange={setInputTextual}
            />
            <SelectRow
              explanation={t("aiTeam.externalDataHint")}
              selected={inputExternal}
              title={t("aiTeam.externalData")}
              onSelectedChange={setInputExternal}
            />
            <SelectRow
              explanation={t("aiTeam.mediaInputHint")}
              selected={inputMedia}
              title={t("aiTeam.mediaInput")}
              onSelectedChange={setInputMedia}
            />
          </div>

          <div className={styles.group}>
            <Text
              bold
              className={styles["section-title"]}
              color="primary"
              type="H5"
            >
              {t("aiTeam.outputType")}
            </Text>
            <Text className={styles.hint} color="secondary" type="small">
              {t("aiTeam.outputTypeHint")}
            </Text>

            <SelectRow
              explanation={t("aiTeam.structuredDataHint")}
              selected={outStructured}
              title={t("aiTeam.structuredData")}
              onSelectedChange={setOutStructured}
            />
            <SelectRow
              explanation={t("aiTeam.humanReadableHint")}
              selected={outExpl}
              title={t("aiTeam.humanReadable")}
              onSelectedChange={setOutExpl}
            />
            <SelectRow
              explanation={t("aiTeam.visualizationHint")}
              selected={outVisual}
              title={t("aiTeam.visualization")}
              onSelectedChange={setOutVisual}
            />
          </div>

          <div className={styles["form-section"]}>
            <Select
              label={t("basic.language")}
              options={[{ label: "English", value: "en" }]}
              value={language}
              onChange={setLanguage}
            />
          </div>

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
              label={t("aiTeam.flowType")}
              options={flowTypeOptions}
              value={flowType}
              onChange={setFlowType}
            />

            {/*<ToggleSwitch*/}
            {/*  checked={encryptResult}*/}
            {/*  label={t("aiTeam.encryptResult")}*/}
            {/*  onChange={setEncryptResult}*/}
            {/*/>*/}
          </div>

          <div className={styles["button-container"]}>
            <Button type="secondary" onClick={handleCancel}>
              {t("basic.cancel")}
            </Button>
            <div className={styles["button-group"]}>
              <Button type="secondary" onClick={handleSaveDraft}>
                {t("basic.saveDraft")}
              </Button>
              <Button
                disabled={!canContinue}
                type="primary"
                onClick={submitForm}
              >
                {t("basic.continue")}
              </Button>
            </div>
          </div>

          <LanguageFooter />
        </div>
      </div>
    </div>
  );
}
