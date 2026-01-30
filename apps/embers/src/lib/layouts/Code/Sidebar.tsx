import type React from "react";

import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { Sidebar as MainSide } from "@/lib/components/Sidebar";
import { Text } from "@/lib/components/Text";

import styles from "./Code.module.scss";

interface SidebarProps {
  onSelect?: (id: string) => void;
  selectedId?: string;
  versions: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  onSelect,
  selectedId,
  versions,
}) => {
  const { t } = useTranslation();
  const handleSelect = (id: string) => {
    onSelect?.(id);
  };
  const selectedVersion = selectedId ?? versions[0];

  return (
    <MainSide key={selectedId} title={t("agents.versions")}>
      <div
        aria-activedescendant={
          selectedVersion ? `version-${selectedVersion}` : undefined
        }
        aria-label="Versions"
        className={styles.list}
        role="listbox"
      >
        {versions.map((v) => {
          return (
            <span
              key={`version-${v}`}
              className={classNames(styles.item, {
                [styles.active]: v === selectedVersion,
              })}
              onClick={() => handleSelect(v)}
            >
              <Text>{v}</Text>
            </span>
          );
        })}
      </div>
    </MainSide>
  );
};
