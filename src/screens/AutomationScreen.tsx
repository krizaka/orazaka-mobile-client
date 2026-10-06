import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { themes } from "@krizaka/orazaka-shared";
import { useApi } from "../core/useApi";
import { Loading, LoadError, Empty } from "../components/AsyncState";

const c = themes.dark;

/** One connector and whether this actor has configured it. */
interface UserCredential {
  readonly providerName: string;
  readonly configured: boolean;
}

/**
 * The actor's connectors and their configured state.
 *
 * Read from `/api/v1/credentials`, deliberately — the web `ConnectorCatalogue` renders a hardcoded
 * array with local state, so it shows the same list to everyone whether or not they have set any
 * of it up. This screen asks the service instead; the secret itself never leaves it, only whether
 * one is on file.
 */
export function AutomationScreen(): React.JSX.Element {
  const { data, isLoading, error, reload } = useApi<UserCredential[]>("/api/v1/credentials");

  if (isLoading) return <Loading />;
  if (error !== null) return <LoadError message={error} onRetry={reload} />;
  if (!data || data.length === 0) return <Empty message="Aucun connecteur configuré." />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={data}
      keyExtractor={(credential) => credential.providerName}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.provider}>{item.providerName}</Text>
          <View style={[styles.dot, item.configured ? styles.dotOn : styles.dotOff]} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: c.surface0 },
  listContent: { padding: 16, gap: 10 },
  card: {
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  provider: { color: c.textPrimary, fontSize: 14, fontWeight: "600" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOn: { backgroundColor: c.accent },
  dotOff: { backgroundColor: c.surface3 },
});
