import { useContext } from "react";
import { ThemeContext } from "@/app/providers";

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme precisa ser usado dentro de <Providers>");
  }
  return context;
}
