/**
 * @file DashboardScreen.tsx
 * @description System entropy/stabilization wave visualizer.
 * Renders animated wave patterns representing real-time system health metrics.
 * Animations run on the native driver (transform-only) for a locked 60 FPS.
 * Interactive controls lock per ERR-126 while isSending || isGenerating.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { themes } from "@krizaka/orazaka-shared";
import { PALETTE, BASE_WAVES, type WaveData } from "./DashboardScreen.data";

/** Shared design tokens (AGENTS.md §8: mobile uses the same tokens as web). */
const c = themes.dark;

function WaveBar({ index, wave }: { index: number; wave: WaveData }): React.JSX.Element {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 2000 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true, // transform-only → runs on the UI thread (60 FPS)
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 2000 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animValue, index]);

  // Scale a full-width bar from its left edge instead of animating `width`
  // (a layout prop) — keeps the whole animation on the native driver.
  const scaleX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, Math.max(0.4, wave.entropy)],
  });

  return (
    <View style={styles.waveRow}>
      <Text style={styles.waveLabel}>{wave.label}</Text>
      <View style={styles.waveTrack}>
        <Animated.View
          style={[
            styles.waveBar,
            { backgroundColor: PALETTE[index % PALETTE.length], transform: [{ scaleX }] },
          ]}
        />
      </View>
      <Text style={styles.waveValue}>{(wave.stability * 100).toFixed(0)}%</Text>
    </View>
  );
}

export function DashboardScreen(): React.JSX.Element {
  const [waves, setWaves] = useState<WaveData[]>(BASE_WAVES);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isLocked = isSending || isGenerating;

  const handleRefresh = useCallback(() => {
    if (isLocked) return;
    setIsSending(true);
    setIsGenerating(true);
    // Re-sample metrics with a small jitter to visualize a live refresh.
    setWaves((prev) =>
      prev.map((w) => ({
        ...w,
        entropy: Math.min(1, Math.max(0.15, w.entropy + (Math.random() - 0.5) * 0.2)),
        stability: Math.min(1, Math.max(0.5, w.stability + (Math.random() - 0.5) * 0.05)),
      })),
    );
    const timer = setTimeout(() => {
      setIsSending(false);
      setIsGenerating(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [isLocked]);

  const avgStability = useMemo(
    () => (waves.reduce((s, w) => s + w.stability, 0) / waves.length) * 100,
    [waves],
  );
  const avgEntropy = useMemo(
    () => waves.reduce((s, w) => s + w.entropy, 0) / waves.length,
    [waves],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>System Entropy</Text>
          <Text style={styles.subtitle}>Real-time stabilization waves</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh system metrics"
          style={[styles.refreshButton, isLocked && styles.refreshButtonLocked]}
          onPress={handleRefresh}
          disabled={isLocked}
        >
          <Text style={styles.refreshText}>{isLocked ? "…" : "↻"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {waves.map((wave, i) => (
          <WaveBar key={wave.label} index={i} wave={wave} />
        ))}
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{avgStability.toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>Avg Stability</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{avgEntropy.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>Avg Entropy</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.surface0,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: c.textSecondary,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonLocked: { opacity: 0.4 },
  refreshText: {
    fontSize: 20,
    fontWeight: "700",
    color: c.accent,
  },
  card: {
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  waveLabel: {
    width: 64,
    fontSize: 13,
    color: c.textSecondary,
    fontWeight: "500",
  },
  waveTrack: {
    flex: 1,
    height: 24,
    backgroundColor: c.surface3,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
  },
  waveBar: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    opacity: 0.85,
    // Anchor the scaleX animation to the left edge so the bar grows rightward.
    transformOrigin: "left",
  },
  waveValue: {
    width: 44,
    fontSize: 13,
    color: c.accent,
    fontWeight: "600",
    textAlign: "right",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: c.accent,
  },
  metricLabel: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 4,
  },
});