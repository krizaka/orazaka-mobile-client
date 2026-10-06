import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { TextInput } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { themes, isTerminalRun } from "@krizaka/orazaka-shared";
import type { Run } from "@krizaka/orazaka-shared";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useToken } from "../core/AuthContext";
import { apiRequest } from "../config/api";
import { useApi } from "../core/useApi";
import { isComplete, parseInputSchema, toInputs } from "../core/inputSchema";

const c = themes.dark;

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
export function StudioRunScreen({ route }: Props): React.JSX.Element {
  const { installationId, label, studioKey } = route.params;
  const bearer = useToken();
  // The blueprint declares what a run needs; asking the server beats hardcoding a form per
  // Studio, and beats sending {} and letting the run be refused with a 400 the actor cannot act on.
  const detail = useApi<{ inputSchema: string | null }>(`/api/v1/studios/${studioKey}`);
  const fields = parseInputSchema(detail.data?.inputSchema);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
        setError(cause instanceof Error ? cause.message : "Suivi interrompu");
        stopPolling();
      }
    },
    [bearer, stopPolling],
  );

  const start = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const started = await apiRequest<Run>(
        `/api/v1/studios/installations/${installationId}/runs`,
        { method: "POST", token: bearer, body: { inputs: toInputs(fields, answers) } },
      );
      setRun(started);
      if (!isTerminalRun(started.status)) {
        timer.current = setInterval(() => void refresh(started.id), POLL_MS);
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Lancement impossible");
    } finally {
      setIsStarting(false);
    }
  };

  // A screen left behind must not keep polling — that is a request every two seconds, forever.
  useEffect(() => stopPolling, [stopPolling]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{label}</Text>

      {run === null ? (
        <>
          {fields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.fieldLabel}>
                {field.title}
                {field.required ? " *" : ""}
              </Text>
              <TextInput
                style={[styles.input, field.isList && styles.inputMultiline]}
                placeholder={field.isList ? "Une valeur par ligne" : ""}
                placeholderTextColor={c.textMuted}
                multiline={field.isList}
                maxLength={field.maxLength}
                editable={!isStarting}
                value={answers[field.key] ?? ""}
                onChangeText={(text) => setAnswers((prev) => ({ ...prev, [field.key]: text }))}
              />
            </View>
          ))}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (isStarting || !isComplete(fields, answers)) && styles.primaryBtnDisabled,
          ]}
          disabled={isStarting || !isComplete(fields, answers)}
          onPress={() => void start()}
        >
          {isStarting ? (
            <ActivityIndicator color={c.surface0} />
          ) : (
            <Text style={styles.primaryBtnText}>Lancer</Text>
          )}
        </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.status}>{run.status}</Text>

          {run.steps.map((step) => (
            <View key={`${step.stepId}-${String(step.ordinal)}`} style={styles.step}>
              <Text style={styles.stepId}>{step.stepId}</Text>
              <Text style={styles.stepStatus}>{step.status}</Text>
            </View>
          ))}

          {run.outputs.length > 0 && (
            <View style={styles.outputs}>
              <Text style={styles.sectionTitle}>Résultats</Text>
              {run.outputs.map((artefact) => (
                <View key={artefact.key} style={styles.artefact}>
                  <Text style={styles.artefactLabel}>{artefact.label}</Text>
                  <Text style={styles.artefactValue}>{artefact.value}</Text>
                  {artefact.type !== "TEXT" && (
                    <Text style={styles.artefactType}>{artefact.type}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {run.errorMessage !== null && <Text style={styles.error}>{run.errorMessage}</Text>}
        </>
      )}

      {error !== null && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.surface0 },
  content: { padding: 20, gap: 10 },
  title: { color: c.textPrimary, fontSize: 22, fontWeight: "800" },
  status: { color: c.accent, fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  step: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 10,
    padding: 12,
  },
  stepId: { color: c.textPrimary, fontSize: 13 },
  stepStatus: { color: c.textMuted, fontSize: 11, textTransform: "uppercase" },
  outputs: { marginTop: 12, gap: 8 },
  sectionTitle: { color: c.textMuted, fontSize: 11, textTransform: "uppercase" },
  artefact: {
    backgroundColor: c.surface1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  artefactLabel: { color: c.textMuted, fontSize: 11, textTransform: "uppercase" },
  artefactValue: { color: c.textPrimary, fontSize: 13 },
  artefactType: { color: c.accent, fontSize: 10, fontWeight: "700" },
  field: { gap: 6, marginTop: 8 },
  fieldLabel: { color: c.textMuted, fontSize: 11, textTransform: "uppercase" },
  input: {
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: c.textPrimary,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: "top" },
  primaryBtn: {
    backgroundColor: c.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: c.surface0, fontSize: 16, fontWeight: "700" },
  error: { color: c.accent, fontSize: 13, marginTop: 8 },
});
