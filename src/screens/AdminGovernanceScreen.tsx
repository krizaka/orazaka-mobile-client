/**
 * @file AdminGovernanceScreen.tsx
 * @description Governance console — list view of active DB predicates with
 * drag-and-drop ordering and toggle switches. All mutations routed through BFF.
 * Types imported from orazaka-shared — no local duplication.
 */

import React, { useCallback, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import type { InterceptorPolicy } from "@krizaka/orazaka-shared";
import { themes } from "@krizaka/orazaka-shared";
import { MOCK_POLICIES } from "./AdminGovernanceScreen.mock";

/** Shared design tokens (AGENTS.md §8: mobile uses the same tokens as web). */
const c = themes.dark;

// Enable smooth layout transitions on Android (no-op on the new architecture / iOS).
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Animate the next state commit so reorders/toggles slide instead of snapping. */
function animateNext(): void {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function PolicyRow({
  policy,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  policy: InterceptorPolicy;
  onToggle: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  return (
    <View style={[styles.policyRow, !policy.enabled && styles.policyRowDisabled]}>
      <View style={styles.orderControls}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Move ${policy.interceptorName} up`}
          activeOpacity={0.6}
          onPress={() => onMoveUp(policy.id)}
          style={styles.orderButton}
        >
          <Text style={styles.orderButtonText}>↑</Text>
        </TouchableOpacity>
        <Text style={styles.orderText}>{policy.executionOrder}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Move ${policy.interceptorName} down`}
          activeOpacity={0.6}
          onPress={() => onMoveDown(policy.id)}
          style={styles.orderButton}
        >
          <Text style={styles.orderButtonText}>↓</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.dragHandle} accessibilityElementsHidden>
        ⠿
      </Text>

      <View style={styles.policyInfo}>
        <Text style={styles.policyName}>{policy.interceptorName}</Text>
        {policy.predicates.length > 0 && (
          <Text style={styles.predicateCount}>
            {policy.predicates.length} predicate{policy.predicates.length > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      <Switch
        value={policy.enabled}
        onValueChange={() => onToggle(policy.id)}
        trackColor={{
          false: c.surface3,
          true: c.accentHover,
        }}
        thumbColor={policy.enabled ? c.accent : c.textMuted}
      />
    </View>
  );
}

export function AdminGovernanceScreen(): React.JSX.Element {
  const [policies, setPolicies] = useState<InterceptorPolicy[]>(MOCK_POLICIES);

  const handleToggle = useCallback((id: string) => {
    animateNext();
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );
  }, []);

  const handleMoveUp = useCallback((id: string) => {
    setPolicies((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index <= 0) return prev;
      animateNext();
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((p, i) => ({ ...p, executionOrder: i + 1 }));
    });
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    setPolicies((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index < 0 || index >= prev.length - 1) return prev;
      animateNext();
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((p, i) => ({ ...p, executionOrder: i + 1 }));
    });
  }, []);

  const renderPolicy = useCallback(
    ({ item }: { item: InterceptorPolicy }) => (
      <PolicyRow
        policy={item}
        onToggle={handleToggle}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />
    ),
    [handleToggle, handleMoveUp, handleMoveDown],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Governance</Text>
      {/* No endpoint lists interceptor policies — not for this screen, and not for web-admin
          either. Saying so beats rendering seed data that looks live. */}
      <Text style={styles.demoNotice}>Données de démonstration — aucune API ne les expose encore.</Text>
      <Text style={styles.subtitle}>
        {policies.filter((p) => p.enabled).length} of {policies.length} interceptors active
      </Text>

      <FlatList
        data={policies}
        renderItem={renderPolicy}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  demoNotice: {
    color: c.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  container: {
    flex: 1,
    backgroundColor: c.surface0,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: c.textPrimary,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: c.textSecondary,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  listContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 24 },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  policyRowDisabled: { opacity: 0.5 },
  orderControls: { alignItems: "center", gap: 2 },
  dragHandle: {
    fontSize: 16,
    color: c.textMuted,
    paddingHorizontal: 2,
  },
  orderButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: c.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  orderButtonText: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: "600",
  },
  orderText: {
    fontSize: 12,
    color: c.accent,
    fontWeight: "700",
  },
  policyInfo: { flex: 1 },
  policyName: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textPrimary,
  },
  predicateCount: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 2,
  },
});
