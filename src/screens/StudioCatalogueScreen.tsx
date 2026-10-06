import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { themes } from "@krizaka/orazaka-shared";
import type { StudioSummary } from "@krizaka/orazaka-shared";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useApi } from "../core/useApi";
import { Loading, LoadError, Empty } from "../components/AsyncState";

const c = themes.dark;

type Props = NativeStackScreenProps<RootStackParamList, "Studios">;

/** How each pricing model is named — the same wording the web catalogue uses. */
const PRICING_LABEL: Record<string, string> = {
  FREE: "Gratuit",
  INCLUDED: "Inclus",
  PAID: "Payant",
};

/**
 * The Studio marketplace (ADR-034).
 *
 * Locked Studios are listed rather than hidden, exactly as on web: the catalogue is the funnel,
 * and a Studio nobody can see is a product nobody buys.
 */
export function StudioCatalogueScreen({ navigation }: Props): React.JSX.Element {
  const { data, isLoading, error, reload } = useApi<StudioSummary[]>("/api/v1/studios");

  if (isLoading) return <Loading />;
  if (error !== null) return <LoadError message={error} onRetry={reload} />;
  if (!data || data.length === 0) return <Empty message="Aucun Studio au catalogue." />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={data}
      keyExtractor={(studio) => studio.studioKey}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("StudioDetail", { studioKey: item.studioKey })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            {item.locked && <Text style={styles.lock}>Verrouillé</Text>}
          </View>
          {item.tagline !== null && item.tagline !== undefined && (
            <Text style={styles.tagline}>{item.tagline}</Text>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.meta}>{item.profession}</Text>
            <Text style={styles.pricing}>{PRICING_LABEL[item.pricing] ?? item.pricing}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: c.surface0 },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: c.textPrimary, fontSize: 16, fontWeight: "700", flexShrink: 1 },
  lock: { color: c.accent, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  tagline: { color: c.textSecondary, fontSize: 13 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  meta: { color: c.textMuted, fontSize: 11, textTransform: "uppercase" },
  pricing: { color: c.accent, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
});
