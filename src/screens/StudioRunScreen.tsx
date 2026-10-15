import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Badge, Button, Chip, Header, Progress, Screen, TextField, Txt } from "@krizaka/ui/native";
import { isTerminalRun } from "@krizaka/orazaka-shared";
import type { Run } from "@krizaka/orazaka-shared";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useToken } from "../core/AuthContext";
import { apiRequest } from "../config/api";
import { useApi } from "../core/useApi";
import { ArtefactCard } from "../components/ArtefactCard";
import { isComplete, parseInputSchema, toInputs, type SchemaField } from "../core/inputSchema";
import { runPercent, splitFields } from "../core/runForm";
import { errorText } from "../i18n/errorText";
import { useI18n, type Key } from "../i18n";

/** Where a run starts: an installed Studio's installation, or — a TOOLKIT Studio has none — its own key. */
export const runPath = (installationId: string | null, studioKey: string): string =>
  installationId === null ? `/api/v1/studios/${studioKey}/runs` : `/api/v1/studios/installations/${installationId}/runs`;

/** How often a live run is re-read. The DAG advances on job outcomes, not on a clock. */
const POLL_MS = 2000;

type Props = NativeStackScreenProps<RootStackParamList, "StudioRun">;

/**
 * Starts a run of an installed Studio and follows it to its end.
 *
 * Polling, not SSE: the run stream is a server-side saga whose progress lands in the run row, and
 * a native app that backgrounds and resumes recovers from a poll for free — where a dropped
 * EventSource would need reconnection logic for a screen that finishes in minutes.
 */
export function StudioRunScreen({ route, navigation }: Props): React.JSX.Element {
  const { installationId, label, studioKey } = route.params;
  const { t, locale } = useI18n();
  const bearer = useToken();
  // The blueprint declares what a run needs; asking the server beats hardcoding a form per
  // Studio, and beats sending {} and letting the run be refused with a 400 the actor cannot act on.
  const detail = useApi<{ inputSchema: string | null }>(`/api/v1/studios/${studioKey}?locale=${locale}`);
  const fields = parseInputSchema(detail.data?.inputSchema);
  const { basic, advanced } = splitFields(fields);
  const [typed, setAnswers] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  // A field with a default (the video Studio's `aspect`) starts on it; what the person chose wins.
  const answers = {
    ...Object.fromEntries(fields.flatMap((f) => (f.defaultValue === undefined ? [] : [[f.key, f.defaultValue]]))),
    ...typed,
  };
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const refresh = useCallback(
    async (runId: string) => {
      try {
        const next = await apiRequest<Run>(`/api/v1/studios/runs/${runId}`, { token: bearer });
        setRun(next);
        if (isTerminalRun(next.status)) {
          stopPolling();
        }
      } catch (cause: unknown) {
        setError(errorText(cause, t, "studios.followFailed"));
        stopPolling();
      }
    },
    [bearer, stopPolling, t],
  );

  const start = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const started = await apiRequest<Run>(
        runPath(installationId, studioKey),
        { method: "POST", token: bearer, body: { inputs: toInputs(fields, answers) } },
      );
      setRun(started);
      if (!isTerminalRun(started.status)) {
        timer.current = setInterval(() => void refresh(started.id), POLL_MS);
      }
    } catch (cause: unknown) {
      setError(errorText(cause, t, "studios.startFailed"));
    } finally {
      setIsStarting(false);
    }
  };

  // A screen left behind must not keep polling — that is a request every two seconds, forever.
  useEffect(() => stopPolling, [stopPolling]);

  /** The words of a field: the app's own for the fields it knows (by Studio, then by key), else the platform's. */
  const titleOf = (field: SchemaField): string => {
    for (const key of [`studios.fields.${studioKey}.${field.key}`, `studios.fields.${field.key}`] as Key[]) {
      const text = t(key);
      if (text !== key) return text;
    }
    return field.title;
  };

  const renderField = (field: SchemaField): React.JSX.Element =>
    field.options ? (
      <View key={field.key} style={styles.field}>
        <Txt variant="label" tone="secondary">
          {titleOf(field)}
        </Txt>
        <Chip.Group
          type="single"
          aria-label={titleOf(field)}
          value={answers[field.key] ?? field.options[0] ?? ""}
          onValueChange={(value) => setAnswers((prev) => ({ ...prev, [field.key]: value }))}
        >
          {field.options.map((value) => (
            <Chip key={value} value={value}>
              {value}
            </Chip>
          ))}
        </Chip.Group>
      </View>
    ) : (
      <TextField
        key={field.key}
        testID={`field-${field.key}`}
        label={`${titleOf(field)}${field.required ? " *" : ""}`}
        placeholder={field.isList ? t("studios.listPlaceholder") : undefined}
        multiline={field.isList || field.key === "prompt" || field.key === "text"}
        keyboardType={field.isNumber ? "number-pad" : "default"}
        maxLength={field.maxLength}
        disabled={isStarting}
        value={answers[field.key] ?? ""}
        onValueChange={(text) => setAnswers((prev) => ({ ...prev, [field.key]: text }))}
        returnKeyType={field.key === "prompt" || field.key === "text" ? "done" : undefined}
        blurOnSubmit
      />
    );

  const percent = run === null ? null : runPercent(run.steps);
  const done = run?.steps.filter((s) => s.status === "SUCCEEDED" || s.status === "SKIPPED").length ?? 0;
  const live = run !== null && !isTerminalRun(run.status);

  return (
    <Screen
      header={<Header title={label} size="inline" backLabel={t("common.back")} onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
    >
      {run === null ? (
        <>
          {basic.map(renderField)}
          {advanced.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                label={showAdvanced ? t("studios.fewerOptions") : t("studios.moreOptions")}
                onPress={() => setShowAdvanced((v) => !v)}
              />
              {showAdvanced && advanced.map(renderField)}
            </>
          )}
          <Button
            testID="run-launch"
            label={t("studios.launch")}
            size="lg"
            loading={isStarting}
            disabled={!isComplete(fields, answers)}
            onPress={() => void start()}
          />
        </>
      ) : (
        <>
          <View style={styles.status}>
            <Badge tone={run.status === "SUCCEEDED" ? "success" : run.status === "FAILED" || run.status === "CANCELLED" ? "danger" : "accent"} dot={live} pulse={live}>
              {t(`studios.run.${run.status}` as Key)}
            </Badge>
            {run.steps.length > 0 && (
              <Txt variant="caption" tone="secondary">
                {t("studios.stepsDone", { done, total: run.steps.length })}
              </Txt>
            )}
          </View>
          {live && <Progress label={t("studios.progress")} value={percent} valueText={percent === null ? t("studios.generating") : `${String(percent)}%`} />}

          {run.outputs.length > 0 && (
            <View style={styles.outputs}>
              {run.outputs.map((artefact) => (
                <ArtefactCard key={artefact.key} artefact={artefact} token={bearer} />
              ))}
            </View>
          )}

          {run.errorMessage !== null && <Txt tone="danger" variant="caption">{run.errorMessage}</Txt>}
          {!live && <Button variant="secondary" label={t("studios.runAgain")} onPress={() => { setRun(null); setError(null); }} />}
        </>
      )}

      {error !== null && <Txt tone="danger" variant="caption">{error}</Txt>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  field: { gap: 8 },
  status: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  outputs: { gap: 12 },
});
