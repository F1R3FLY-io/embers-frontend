import { useEffect, useState } from "react";

import styles from "./ThemeSwitch.module.scss";

interface ThemeSwitchProps {
  className?: string;
}

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.remove("light-theme");
    } else {
      document.documentElement.classList.add("light-theme");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

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
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    updateTheme(newDarkMode);
  };

  return (
    <div className={`${styles["theme-switch"]} ${className ?? ""}`}>
      <label className={styles.switch}>
        <input checked={isDarkMode} type="checkbox" onChange={toggleTheme} />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
}
