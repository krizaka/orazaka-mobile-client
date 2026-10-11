import React from "react";
import { ChartsProvider } from "@krizaka/charts/native";
import { useTheme } from "@krizaka/ui/native";

/**
 * The settings of every native chart (@krizaka/charts/native): the Orazaka palette (orange first) and the app's own
 * colour roles and scheme, read from the @krizaka/ui/native theme — the charts follow the app, not the device.
 */
export function AppCharts({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const { scheme, theme } = useTheme();
  return (
    <ChartsProvider brand="orazaka" locale="fr-FR" scheme={scheme} theme={theme}>
      {children}
    </ChartsProvider>
  );
}
