import { useCallback, useEffect, useState } from "react";

import { ThemeContext } from "./useTheme";

function updateTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.remove("light-theme");
  } else {
    document.documentElement.classList.add("light-theme");
  }
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    let isDarkMode: boolean;

    if (savedTheme === "dark") {
      isDarkMode = true;
    } else if (savedTheme === "light") {
      isDarkMode = false;
    } else {
      isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    setIsDark(isDarkMode);
    updateTheme(isDarkMode);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((isDark) => {
      const newIsDark = !isDark;
      updateTheme(newIsDark);
      localStorage.setItem("theme", newIsDark ? "dark" : "light");
      return newIsDark;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
