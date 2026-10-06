/**
 * @file ErrorBoundary.tsx
 * @description React Native error boundary guarding the Sovereign Intent Mesh
 * screens (Dashboard, Console, AdminGovernance). Catches render-time crashes —
 * including unexpected null/malformed SSE payloads — and renders a recoverable
 * fallback instead of unmounting the whole navigation tree.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { themes } from "@krizaka/orazaka-shared";

interface ErrorBoundaryProps {
  /** Human-readable name of the guarded screen, surfaced in the fallback + logs. */
  screenName: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Unexpected payload";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string }): void {
    // Robust error logging — never swallow the crash silently.
    console.error(
      `[ErrorBoundary:${this.props.screenName}]`,
      error instanceof Error ? error.stack ?? error.message : error,
      info?.componentStack ?? "",
    );
  }

  private readonly handleReset = (): void => {
    this.setState({ hasError: false, message: "" });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⚠</Text>
        <Text style={styles.title}>{this.props.screenName} hit a snag</Text>
        <Text style={styles.message} numberOfLines={4}>
          {this.state.message}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Retry loading ${this.props.screenName}`}
          style={styles.retryButton}
          onPress={this.handleReset}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

/** The one dark palette, shared with web through `orazaka-shared`. */
const c = themes.dark;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.surface0,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  icon: { fontSize: 40, color: c.accent },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: c.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: c.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: c.accent,
  },
  retryText: {
    fontSize: 15,
    fontWeight: "700",
    color: c.surface0,
  },
});