import classNames from "classnames";

import { useTheme } from "@/lib/providers/theme/useTheme";

import styles from "./ThemeSwitch.module.scss";

interface ThemeSwitchProps {
  className?: string;
}

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const theme = useTheme();

  return (
    <div className={classNames(styles["theme-switch"], className)}>
      <label className={styles.switch}>
        <input checked={theme.isDark} type="checkbox" onChange={theme.toggle} />
        <span className={styles.slider} />
      </label>
    </div>
  );
}
