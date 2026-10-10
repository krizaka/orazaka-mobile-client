import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { themes } from "@krizaka/orazaka-shared";
import type { StudioDetail } from "@krizaka/orazaka-shared";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useApi } from "../core/useApi";
import { useToken } from "../core/AuthContext";
import { apiRequest } from "../config/api";
import { Loading, LoadError } from "../components/AsyncState";

const c = themes.dark;

type Props = NativeStackScreenProps<RootStackParamList, "StudioDetail">;

interface InstallationResponse {
  readonly id: string;
}

/**
 * One Studio, with what it costs and the button that installs it.
 *
 * Install sends an empty config: the blueprint's own declared defaults fill the gaps server-side,
 * so an actor can start without answering a form. Editing that configuration is a web-console job
 * for now — a JSON-Schema-driven form is not a thing to build twice.
 */
export function StudioDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { studioKey } = route.params;
  const bearer = useToken();
  const { data, isLoading, error, reload } = useApi<StudioDetail>(`/api/v1/studios/${studioKey}`);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  if (isLoading) return <Loading />;
  if (error !== null || !data) return <LoadError message={error ?? "Studio introuvable"} onRetry={reload} />;

  const install = async () => {
    setIsInstalling(true);
    setInstallError(null);
    try {
      const installation = await apiRequest<InstallationResponse>(
        `/api/v1/studios/${studioKey}/installations`,
        { method: "POST", token: bearer, body: { config: {} } },
      );
      navigation.navigate("StudioRun", {
        installationId: installation.id,
        label: data.label,
        studioKey,
      });
    } catch (cause: unknown) {
      setInstallError(cause instanceof Error ? cause.message : "Installation impossible");
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{data.label}</Text>
      {data.tagline !== null && data.tagline !== undefined && (
        <Text style={styles.tagline}>{data.tagline}</Text>
      )}

      <View style={styles.row}>
        <Text style={styles.meta}>{data.profession}</Text>
        <Text style={styles.credits}>{data.estimatedCredits} crédits / run</Text>
      </View>

      {data.description !== null && data.description !== undefined && (
        <Text style={styles.description}>{data.description}</Text>
      )}

      {installError !== null && <Text style={styles.error}>{installError}</Text>}

      {data.locked ? (
        // A locked Studio keeps its page and loses its button: the actor must be able to see what
        // they would be buying, which is the whole reason locked entries stay in the catalogue.
        <View style={styles.lockedNotice}>
          <Text style={styles.lockedText}>
            Ce Studio n&apos;est pas inclus dans votre offre.
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.primaryBtn, isInstalling && styles.primaryBtnDisabled]}
          disabled={isInstalling}
          onPress={() => void install()}
        >
          {isInstalling ? (
            <ActivityIndicator color={c.onAccent} />
          ) : (
            <Text style={styles.primaryBtnText}>Installer</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.surface0 },
  content: { padding: 20, gap: 10 },
  title: { color: c.textPrimary, fontSize: 24, fontWeight: "800" },
  tagline: { color: c.textSecondary, fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  meta: { color: c.textMuted, fontSize: 11, textTransform: "uppercase" },
  credits: { color: c.accent, fontSize: 12, fontWeight: "700" },
  description: { color: c.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  primaryBtn: {
    backgroundColor: c.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: c.onAccent, fontSize: 16, fontWeight: "700" },
  lockedNotice: {
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  lockedText: { color: c.textSecondary, fontSize: 13, textAlign: "center" },
  error: { color: c.accent, fontSize: 13, marginTop: 8 },
});
