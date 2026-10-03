"use client";
import { createContext, useContext, type ReactNode } from "react";

// Style des icônes illustrées selon l'espace : l'espace client garde les illustrations 3D
// d'origine (préférence de Samuel), le CRM utilise les pictogrammes épurés au trait doré.
export type IconStyle = "line" | "3d";
const Ctx = createContext<IconStyle>("line");
export const useIconStyle = () => useContext(Ctx);
export function IconStyleProvider({ value, children }: { value: IconStyle; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
