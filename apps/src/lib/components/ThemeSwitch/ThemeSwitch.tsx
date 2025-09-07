import { useTheme } from "@/lib/providers/theme/useTheme";

import styles from "./ThemeSwitch.module.scss";

export function ThemeSwitch() {
  const theme = useTheme();

  return (
    <label className={styles.switch}>
      <input checked={theme.isDark} type="checkbox" onChange={theme.toggle} />
      <span className={styles.slider} />
    </label>
  );
}
