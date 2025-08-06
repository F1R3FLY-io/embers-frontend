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
    let shouldBeDark = true;
    const savedTheme = localStorage.getItem("theme");

    switch (savedTheme) {
      case "dark": {
        shouldBeDark = true;
        break;
      }
      case "light": {
        shouldBeDark = false;
        break;
      }
      case null:
      default: {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          shouldBeDark = true;
        } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
          shouldBeDark = false;
        }
        break;
      }
    }

    setIsDark(shouldBeDark);
    updateTheme(shouldBeDark);
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
