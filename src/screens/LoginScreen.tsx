import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { themes } from "@krizaka/orazaka-shared";
import { useAuth } from "../core/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim() !== "" && password !== "" && !isSubmitting;

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // No navigate(): the navigator swaps the auth stack for the app stack as soon as the
      // session exists, so there is exactly one place that decides where a signed-in user lands.
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orazaka</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <TextInput
        id="login-email"
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={c.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!isSubmitting}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        id="login-password"
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={c.textMuted}
        secureTextEntry
        autoComplete="current-password"
        editable={!isSubmitting}
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => void submit()}
      />

      {error !== null && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        id="login-submit"
        style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
        disabled={!canSubmit}
        onPress={() => void submit()}
      >
        {isSubmitting ? (
          <ActivityIndicator color={c.surface0} />
        ) : (
          <Text style={styles.primaryBtnText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity disabled={isSubmitting} onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={isSubmitting} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}

/** The one dark palette, shared with web through `orazaka-shared`. */
const c = themes.dark;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: c.surface0,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: c.accent,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: "center",
    marginBottom: 32,
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
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: c.surface0,
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    color: c.accent,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  link: {
    color: c.accent,
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
  },
});
