import { useTranslation } from "react-i18next";

import { LanguageSelect } from "@/lib/components/Select/LanguageSelect";
import { Text } from "@/lib/components/Text";

import styles from "./LanguageFooter.module.scss";



export default function LanguageFooter() {
  const { t } = useTranslation();
  return (
    <div className={styles["footer-container"]}>
      <LanguageSelect />
      <div className={styles["support-container"]}>
        <Text color="secondary" type="normal">
          {t("deploy.havingTrouble")}
        </Text>
        <a className={styles["support-link"]} href="#">
          {t("deploy.contactSupport")}
        </a>
      </div>
    </div>
  );
}
