import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@krizaka/ui/native";
import { brands } from "@krizaka/tokens/native";
import { AppNavigator } from "./navigation/AppNavigator";
import { AuthProvider } from "./core/AuthContext";

/**
 * The root: the @krizaka/ui/native theme with the Orazaka brand (the orange of the mark, from @krizaka/tokens/native)
 * over the platform's roles. The app is dark, like its screens' `themes.dark`; the primitives read the same values.
 */
export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider defaultMode="dark" overrides={brands.orazaka}>
        <StatusBar style="light" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
