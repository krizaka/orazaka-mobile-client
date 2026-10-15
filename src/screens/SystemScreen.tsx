import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import { Button, DescriptionList, Header, Screen } from "@krizaka/ui/native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { EDGE_BASE_URL, apiRequest } from "../config/api";
import { useAuth } from "../core/AuthContext";
import { useT } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "System">;

/** `https://dev.orazaka.com/edge` → `dev.orazaka.com` — the host a person recognises, not the path. */
export function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

/**
 * The connection, measured: which server the app talks to, whether it answers right now (and how fast — a real round
 * trip, timed on this phone), who is signed in and which interceptors the session carries. Nothing here is simulated.
 */
export function SystemScreen({ navigation }: Props): React.JSX.Element {
  const t = useT();
  const { session } = useAuth();
  const [latency, setLatency] = useState<number | "down" | null>(null);

  const probe = useCallback(async () => {
    setLatency(null);
    const started = Date.now();
    try {
      await apiRequest("/api/v1/profile", { token: session?.token ?? null });
      setLatency(Date.now() - started);
    } catch {
      setLatency("down");
    }
  }, [session?.token]);

  useEffect(() => {
    void probe();
  }, [probe]);

  const status =
    latency === null ? t("common.loading") : latency === "down" ? t("system.unreachable") : t("system.reachable", { ms: latency });
  const interceptions = session?.activeInterceptions ?? [];

  return (
    <Screen header={<Header title={t("screens.system")} size="inline" backLabel={t("common.back")} onBack={() => navigation.goBack()} />}>
      <DescriptionList
        layout="stacked"
        items={[
          { term: t("system.server"), details: hostOf(EDGE_BASE_URL) },
          { term: t("system.status"), details: status },
          { term: t("system.account"), details: session?.email ?? "—" },
          { term: t("system.version"), details: Constants.expoConfig?.version ?? "—" },
          { term: t("system.interceptions"), details: interceptions.length > 0 ? String(interceptions.length) : t("system.none") },
        ]}
      />
      <Button variant="secondary" label={t("system.refresh")} onPress={() => void probe()} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 8 },
});
