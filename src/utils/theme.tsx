import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

export interface ThemeColors {
  background: string;
  surface: string;
  surface2: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  accent: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  statusBar: "light" | "dark";
}

const darkColors: ThemeColors = {
  background: "#0f0f14",
  surface: "#1a1a24",
  surface2: "#22223a",
  border: "#2e2e4a",
  textPrimary: "#f0f0ff",
  textSecondary: "#9090b0",
  primary: "#7c3aed",
  accent: "#a855f7",
  tabBar: "#13131f",
  tabBarBorder: "#2e2e4a",
  inputBg: "#0f0f14",
  statusBar: "light",
};

const lightColors: ThemeColors = {
  background: "#f5f3ff",
  surface: "#ffffff",
  surface2: "#ede9fe",
  border: "#ddd6fe",
  textPrimary: "#1e1b4b",
  textSecondary: "#6d6d9a",
  primary: "#7c3aed",
  accent: "#7c3aed",
  tabBar: "#ffffff",
  tabBarBorder: "#e8e4fb",
  inputBg: "#f5f3ff",
  statusBar: "dark",
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    AsyncStorage.getItem("theme").then((saved) => {
      if (saved === "light" || saved === "dark") setTheme(saved);
    });
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    AsyncStorage.setItem("theme", next);
  }

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
