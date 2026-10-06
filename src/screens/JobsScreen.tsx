import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { themes } from "@krizaka/orazaka-shared";
import { useApi } from "../core/useApi";
import { Loading, LoadError, Empty } from "../components/AsyncState";

const c = themes.dark;

/** One asynchronous job, as `/api/v1/jobs` returns it. */
interface JobInfo {
  readonly id: string;
  readonly featureKey: string;
  readonly status: string;
  readonly errorMessage: string | null;
  readonly createdAt: string;
}

/** A Spring `Page` of jobs. */
interface JobPage {
  readonly content: readonly JobInfo[];
}

/**
 * The actor's asynchronous jobs, newest first.
 *
 * Read-only on mobile: approving or purging a job is a console action, and putting a destructive
 * button on a phone screen is how a job gets purged from a pocket.
 */
export function JobsScreen(): React.JSX.Element {
  const { data, isLoading, error, reload } = useApi<JobPage>("/api/v1/jobs?page=0&size=30");

  if (isLoading) return <Loading />;
  if (error !== null) return <LoadError message={error} onRetry={reload} />;

  const jobs = data?.content ?? [];
  if (jobs.length === 0) return <Empty message="Aucun job pour l'instant." />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={jobs}
      keyExtractor={(job) => job.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.feature}>{item.featureKey}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
          <Text style={styles.id}>{item.id.slice(0, 8)}…</Text>
          {item.errorMessage !== null && <Text style={styles.error}>{item.errorMessage}</Text>}
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
    padding: 14,
    gap: 4,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feature: { color: c.textPrimary, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  status: { color: c.accent, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  id: { color: c.textMuted, fontSize: 11 },
  error: { color: c.accent, fontSize: 12 },
});
