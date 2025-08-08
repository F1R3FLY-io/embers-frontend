import { createContext, useContext } from "react";

export type ThemeContext = {
  isDark: boolean;
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContext>({
  isDark: true,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}
