import { useTheme } from "@/lib/providers/theme/useTheme";
import CrescentMoonIcon from "@/public/icons/crescent-moon-icon.svg?react";
import SunIcon from "@/public/icons/sun-icon.svg?react";

import styles from "./ThemeSwitch.module.scss";

export function ThemeSwitch() {
  const theme = useTheme();

  return (
    <label className={styles.switch}>
      <input checked={theme.isDark} type="checkbox" onChange={theme.toggle} />
      <span className={styles.slider}>
        {theme.isDark ? (
          <CrescentMoonIcon key="moon" className={styles.icon} />
        ) : (
          <SunIcon key="sun" className={styles.icon} />
        )}
      </span>
    </label>
  );
}
