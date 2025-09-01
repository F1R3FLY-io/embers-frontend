import type React from "react";

import { useEffect, useState } from "react";

import i18n from "@/i18n";
import { Select } from "@/lib/components/Select";

import styles from "./LanguageSelect.module.scss";

type Option = {
  label: string;
  value: string;
};

const options: Option[] = [
  { label: "English", value: "en" },
  { label: "German", value: "de" },
];

export const LanguageSelect: React.FC = () => {
  const [value, setValue] = useState(i18n.language);

  useEffect(() => {
    void i18n.changeLanguage(value);
  }, [value]);

  return (
    <Select
      className={styles.container}
      options={options}
      value={value}
      onChange={setValue}
    />
  );
};
