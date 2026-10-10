import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { themes } from "@krizaka/orazaka-shared";
import { apiRequest } from "../config/api";

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">;

export function ResetPasswordScreen({ route, navigation }: Props): React.JSX.Element {
  const { token } = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirmPassword !== "" && newPassword !== confirmPassword;
  const canSubmit = newPassword !== "" && !mismatch && !isSubmitting;

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiRequest("/api/v1/auth/reset", { method: "POST", body: { token, newPassword } });
      navigation.navigate("Login");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Reset failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Password</Text>
      <Text style={styles.subtitle}>Enter your new password below</Text>
      <Text style={styles.tokenHint}>Token: {token.slice(0, 8)}…</Text>

      <TextInput
        id="reset-new-password"
        style={styles.input}
        placeholder="New password"
        placeholderTextColor={c.textMuted}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        id="reset-confirm-password"
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor={c.textMuted}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {mismatch && <Text style={styles.error}>The two passwords do not match.</Text>}
      {error !== null && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        id="reset-submit"
        style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
        disabled={!canSubmit}
        onPress={() => void submit()}
      >
        {isSubmitting ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={styles.primaryBtnText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

/** The one dark palette, shared with web through `orazaka-shared`. */
const c = themes.dark;

const styles = StyleSheet.create({
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  error: {
    color: c.accent,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: c.surface0,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: c.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  tokenHint: {
    fontSize: 12,
    color: c.textMuted,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "monospace",
  },
  input: {
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: c.textPrimary,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: c.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  primaryBtnText: {
    color: c.onAccent,
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    color: c.accent,
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
  },
});
