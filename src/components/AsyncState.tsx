import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { themes } from "@krizaka/orazaka-shared";

const c = themes.dark;

/** The waiting state, identical on every screen that loads. */
export function Loading(): React.JSX.Element {
  return (
    <View style={styles.centre}>
      <ActivityIndicator color={c.accent} />
    </View>
  );
}

interface LoadErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

/**
 * The failed state, with a retry.
 *
 * The web client factored the same three blocks into `StudioAsyncState` after they had drifted
 * apart across five screens; starting the mobile features with one component avoids repeating
 * that history here.
 */
export function LoadError({ message, onRetry }: Readonly<LoadErrorProps>): React.JSX.Element {
  return (
    <View style={styles.centre}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.retry} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

interface EmptyProps {
  readonly message: string;
}

/** Nothing to show, which is not an error and must not look like one. */
export function Empty({ message }: Readonly<EmptyProps>): React.JSX.Element {
  return (
    <View style={styles.centre}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  message: {
    color: c.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  retry: {
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
