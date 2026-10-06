import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { themes } from "@krizaka/orazaka-shared";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useApi } from "../core/useApi";
import { useAuth } from "../core/AuthContext";
import { Loading, LoadError } from "../components/AsyncState";

const c = themes.dark;

/** What `/api/v1/profile` returns. */
interface UserDescriptor {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly authorities: readonly string[];
  readonly preferences: Record<string, unknown>;
}

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

/**
 * The signed-in actor, and the way out.
 *
 * The profile is re-read from the service rather than shown from the stored session: the token
 * carries who you were when you signed in, which is not the same as who you are now — a role
 * granted this morning would otherwise stay invisible until the next sign-in.
 */
export function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const { signOut } = useAuth();
  const { data, isLoading, error, reload } = useApi<UserDescriptor>("/api/v1/profile");

  if (isLoading) return <Loading />;
  if (error !== null || !data) return <LoadError message={error ?? "Profil indisponible"} onRetry={reload} />;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{data.username}</Text>
      <Text style={styles.email}>{data.email}</Text>

      <Text style={styles.sectionTitle}>Rôles</Text>
      <View style={styles.chips}>
        {data.authorities.map((role) => (
          <Text key={role} style={styles.chip}>
            {role}
          </Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Plus</Text>
      {([
        ["Subscription", "Abonnement"],
        ["Console", "Console d'intentions"],
        ["AdminGovernance", "Gouvernance"],
      ] as const).map(([route, label]) => (
        <TouchableOpacity
          key={route}
          style={styles.linkRow}
          onPress={() => navigation.navigate(route)}
        >
          <Text style={styles.linkText}>{label}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.signOut} onPress={() => void signOut()}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.surface0 },
  content: { padding: 20, gap: 8 },
  name: { color: c.textPrimary, fontSize: 24, fontWeight: "800" },
  email: { color: c.textSecondary, fontSize: 14 },
  sectionTitle: {
    color: c.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    marginTop: 20,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    color: c.textPrimary,
    fontSize: 12,
    backgroundColor: c.surface2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.surface1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  linkText: { color: c.textPrimary, fontSize: 14 },
  chevron: { color: c.textMuted, fontSize: 18 },
  signOut: {
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 32,
  },
  signOutText: { color: c.accent, fontSize: 15, fontWeight: "700" },
});
