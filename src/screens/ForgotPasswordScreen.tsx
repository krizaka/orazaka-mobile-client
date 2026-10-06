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

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim() !== "" && !isSubmitting;

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiRequest("/api/v1/auth/forgot", { method: "POST", body: { email: email.trim() } });
      // Deliberately the same message whether or not the address is known: the service answers
      // identically too, because a "no such account" reply is an account-enumeration oracle.
      setSent(true);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we&apos;ll send you a recovery link
      </Text>

      <TextInput
        id="forgot-email"
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={c.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {sent ? (
        <Text style={styles.notice}>
          If that address has an account, a reset link is on its way.
        </Text>
      ) : null}
      {error !== null && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        id="forgot-submit"
        style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
        disabled={!canSubmit}
        onPress={() => void submit()}
      >
        {isSubmitting ? (
          <ActivityIndicator color={c.surface0} />
        ) : (
          <Text style={styles.primaryBtnText}>Send Recovery Link</Text>
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
  notice: {
    color: c.textSecondary,
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
    marginBottom: 32,
    paddingHorizontal: 12,
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
    color: c.surface0,
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
