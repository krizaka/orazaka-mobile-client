/**
 * @file SovereignChatCard.tsx
 * @description Mobile (React Native) counterpart of the web `ChatShowcase`.
 * A static, welcome-state mockup of the Orazaka engine answering *locally* —
 * dramatizes on-prem inference + interceptor pipeline + zero data egress.
 *
 * Consumes the SAME design tokens as web (AGENTS.md §8: "Mobile has its own
 * RN components but imports the same tokens from shared"). No inline hex —
 * every colour comes from `themes` in `orazaka-shared`. A single status dot
 * pulses on the native driver (transform/opacity only), disabled under
 * Reduce Motion.
 */

import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from "react-native";
import { themes } from "@krizaka/orazaka-shared";

const c = themes.dark;

/** Scripted, sovereign demo copy (mobile is English-first, like its siblings). */
const DEMO = {
  agent: "Orazaka",
  status: "Online · local",
  model: "llama3 · Ollama",
  routed: "ROUTED LOCALLY",
  question: "Summarize the attached contract and flag Law 25 issues.",
  answer:
    "3 clauses to review: data transfer outside Quebec, indefinite retention, no explicit consent. Analysis ran on your device — nothing was transmitted.",
  pipeline: ["Intent", "Context", "Routing", "Validation"],
  privacy: "0 data leaves your network",
  placeholder: "Ask your sovereign AI…",
};

/** Renders the mobile sovereign-chat welcome card. */
export function SovereignChatCard(): React.JSX.Element {
  const pulse = useRef(new Animated.Value(0.5)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (active) setReduceMotion(on);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.head}>
        <View style={styles.idRow}>
          <View style={styles.avatar}>
            <View style={styles.avatarMark} />
          </View>
          <View>
            <Text style={styles.agent}>{DEMO.agent}</Text>
            <View style={styles.statusRow}>
              <Animated.View style={[styles.dot, { opacity: pulse }]} />
              <Text style={styles.status}>{DEMO.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.modelChip}>
          <Text style={styles.modelText}>{DEMO.model}</Text>
        </View>
      </View>

      {/* Conversation */}
      <View style={styles.body}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>{DEMO.question}</Text>
        </View>

        <View style={[styles.bubble, styles.aiBubble]}>
          <Text style={styles.routed}>{DEMO.routed}</Text>
          <Text style={styles.aiText}>{DEMO.answer}</Text>
          <View style={styles.pipeline}>
            {DEMO.pipeline.map((step) => (
              <View key={step} style={styles.chip}>
                <Text style={styles.chipText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.foot}>
        <View style={styles.fakeInput}>
          <Text style={styles.placeholder}>{DEMO.placeholder}</Text>
          <View style={styles.send}>
            <Text style={styles.sendArrow}>↑</Text>
          </View>
        </View>
        <View style={styles.privacyRow}>
          <View style={styles.privacyDot} />
          <Text style={styles.privacy}>{DEMO.privacy}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.borderDefault,
    backgroundColor: c.surface1,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
    backgroundColor: c.surface2,
  },
  idRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.surface3,
    borderWidth: 1,
    borderColor: c.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMark: { width: 14, height: 14, borderRadius: 4, backgroundColor: c.accent },
  agent: { fontSize: 13, fontWeight: "700", color: c.textPrimary },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
  status: { fontSize: 11, color: c.textSecondary },
  modelChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    backgroundColor: c.surface1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modelText: { fontSize: 10, fontWeight: "600", color: c.textSecondary },
  body: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  bubble: { maxWidth: "88%", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  userBubble: { alignSelf: "flex-end", backgroundColor: c.accent, borderBottomRightRadius: 5 },
  userText: { fontSize: 13, fontWeight: "500", color: c.surface0, lineHeight: 19 },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderBottomLeftRadius: 5,
  },
  routed: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: c.accent,
    marginBottom: 6,
  },
  aiText: { fontSize: 13, color: c.textPrimary, lineHeight: 19 },
  pipeline: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: c.borderSubtle,
  },
  chip: { borderRadius: 999, backgroundColor: c.surface3, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 10, fontWeight: "600", color: c.accent },
  foot: {
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: c.borderSubtle,
    backgroundColor: c.surface2,
    gap: 10,
  },
  fakeInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.borderDefault,
    backgroundColor: c.surface1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  placeholder: { fontSize: 12.5, color: c.textMuted },
  send: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendArrow: { fontSize: 15, fontWeight: "700", color: c.surface0 },
  privacyRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  privacyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
  privacy: { fontSize: 11, fontWeight: "500", color: c.textSecondary },
});
