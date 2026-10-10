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
import { useAuth } from "../core/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit =
    username.trim() !== "" && email.trim() !== "" && password !== "" && !isSubmitting;

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const outcome = await register(username.trim(), email.trim(), password);
      if (outcome.kind === "verification-required") {
        // No session was issued, so the navigator will not switch stacks. Saying so beats
        // leaving the actor on a form that looks like it did nothing.
        setNotice(`Compte créé. Vérifiez ${outcome.email} pour l'activer, puis connectez-vous.`);
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the Orazaka ecosystem</Text>

      <TextInput
        id="register-username"
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={c.textMuted}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        id="register-email"
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={c.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        id="register-password"
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={c.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {notice !== null && <Text style={styles.notice}>{notice}</Text>}
      {error !== null && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        id="register-submit"
        style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
        disabled={!canSubmit}
        onPress={() => void submit()}
      >
        {isSubmitting ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={styles.primaryBtnText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
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
  notice: {
    color: c.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
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
