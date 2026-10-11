import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, DonutChart } from "@krizaka/charts/native";
import { Badge, Card, Progress, Txt, type BadgeTone } from "@krizaka/ui/native";
import { JobPageSchema, themes, type JobRecord, type JobStatus } from "@krizaka/orazaka-shared";
import { useApi } from "../core/useApi";
import { jobKind, jobsByKind, jobsPerDay } from "../core/jobStats";
import { Loading, LoadError, Empty } from "../components/AsyncState";

const c = themes.dark;

const STATUS: Record<JobStatus, { tone: BadgeTone; label: string }> = {
  PENDING: { tone: "neutral", label: "En attente" },
  PROCESSING: { tone: "accent", label: "En cours" },
  COMPLETED: { tone: "success", label: "Terminé" },
  FAILED: { tone: "danger", label: "Échec" },
};

/** The two native charts above the list: the last 7 days by outcome, and the kinds of work. */
function JobsCharts({ jobs }: Readonly<{ jobs: readonly JobRecord[] }>): React.JSX.Element {
  return (
    <View style={styles.charts}>
      <Card.Root>
        <Card.Body>
          <BarChart
            title="Tâches par jour"
            data={jobsPerDay(jobs, 7)}
            x="day"
            xFormat="day"
            series={[
              { key: "done", label: "Réussies", color: "accent" },
              { key: "failed", label: "Échecs", color: "danger" },
            ]}
            format="integer"
            stacked
            height={150}
          />
        </Card.Body>
      </Card.Root>
      <Card.Root>
        <Card.Body>
          <DonutChart title="Par type" data={jobsByKind(jobs)} label="kind" value="count" format="integer" height={150} />
        </Card.Body>
      </Card.Root>
    </View>
  );
}

/** One job: its kind, its state in the platform's badge, its progress while it runs, why it failed. */
function JobCard({ job }: Readonly<{ job: JobRecord }>): React.JSX.Element {
  const status = STATUS[job.status];
  const running = job.status === "PENDING" || job.status === "PROCESSING";
  return (
    <Card.Root>
      <Card.Body padding="sm" style={styles.job}>
        <View style={styles.header}>
          <Txt variant="label" numberOfLines={1} style={styles.kind}>
            {jobKind(job.featureKey)}
          </Txt>
          <Badge tone={status.tone} dot={running}>
            {status.label}
          </Badge>
        </View>
        <Txt variant="caption" tone="muted">
          {formatDistanceToNow(parseISO(job.createdAt), { addSuffix: true, locale: fr })} · {job.id.slice(0, 8)}
        </Txt>
        {running && <Progress size="sm" label={`${jobKind(job.featureKey)} en cours`} value={job.progress && job.progress > 0 ? job.progress : null} />}
        {job.errorMessage ? (
          <Txt variant="caption" tone="danger">
            {job.errorMessage}
          </Txt>
        ) : null}
      </Card.Body>
    </Card.Root>
  );
}

/**
 * The actor's asynchronous jobs, newest first, under two native charts of the same jobs (@krizaka/charts/native).
 *
 * Read-only on mobile: approving or purging a job is a console action, and putting a destructive
 * button on a phone screen is how a job gets purged from a pocket.
 */
export function JobsScreen(): React.JSX.Element {
  const { data, isLoading, error, reload } = useApi<unknown>("/api/v1/jobs?page=0&size=50");

  if (isLoading) return <Loading />;
  if (error !== null) return <LoadError message={error} onRetry={reload} />;

  const page = JobPageSchema.safeParse(data);
  const jobs = page.success ? page.data.content : [];
  if (jobs.length === 0) return <Empty message="Aucun job pour l'instant." />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={jobs}
      keyExtractor={(job) => job.id}
      ListHeaderComponent={<JobsCharts jobs={jobs} />}
      renderItem={({ item }) => <JobCard job={item} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: c.surface0 },
  listContent: { padding: 16, gap: 10 },
  charts: { gap: 10, marginBottom: 6 },
  job: { gap: 6 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  kind: { flexShrink: 1 },
});
