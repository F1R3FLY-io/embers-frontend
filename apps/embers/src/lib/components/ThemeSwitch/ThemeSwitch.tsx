import { useEffect, useState } from "react";

import styles from "./ThemeSwitch.module.scss";
import classNames from "classnames";

const updateTheme = (dark: boolean) => {
  if (dark) {
    document.documentElement.classList.remove("light-theme");
  } else {
    document.documentElement.classList.add("light-theme");
  }
  localStorage.setItem("theme", dark ? "dark" : "light");
};

interface ThemeSwitchProps {
  className?: string;
}

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme") ?? "dark";
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark = savedTheme === "dark" ? true : prefersDark;

    setIsDarkMode(shouldBeDark);
    updateTheme(shouldBeDark);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((isDarkMode) => {
      const newIsDarkMode = !isDarkMode;
      updateTheme(newIsDarkMode);
      return newIsDarkMode;
    });
  };

  return (
    <div className={classNames(styles["theme-switch"], className)}>
      <label className={styles.switch}>
        <input checked={isDarkMode} type="checkbox" onChange={toggleTheme} />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
}
