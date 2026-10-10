/**
 * @file ConsoleScreen.tsx
 * @description Intent console — form + stream handler for text intent submission.
 * Routes all traffic through the Next.js BFF proxy.
 * Implements input blocking per ERR-126 (isSending || isGenerating).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { IntentTokenSchema, themes } from "@krizaka/orazaka-shared";
import { useToken } from "../core/AuthContext";
import { apiRequest } from "../config/api";

interface StreamMessage {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: number;
}

const INTENT_PATH = "/api/v1/intent/route";

export function ConsoleScreen(): React.JSX.Element {
  const bearer = useToken();
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const flatListRef = useRef<FlatList<StreamMessage>>(null);

  const isLocked = isSending || isGenerating;

  // Smooth auto-scroll: follow the tail whenever a new token/message lands or
  // the generating indicator toggles. rAF defers until after layout commits.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, isGenerating]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLocked) return;

    const userMessage: StreamMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      setIsGenerating(true);
      // Parsed through the shared contract rather than read off an `unknown`: the envelope
      // is versioned in orazaka-shared, so a field the router stops sending fails here
      // instead of rendering "Gate: UNKNOWN" forever.
      const token = IntentTokenSchema.parse(
        await apiRequest(INTENT_PATH, {
          method: "POST",
          token: bearer,
          body: {
            intentId: `mobile-${Date.now()}`,
            payload: trimmed,
            metadata: {},
          },
        }),
      );
      const systemMessage: StreamMessage = {
        id: `sys-${Date.now()}`,
        role: "system",
        content: `Gate: ${token.gateDecision}\nToken: ${token.tokenValue.slice(0, 16)}…`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "system",
          content: "Could not reach the platform — check the edge URL and your session.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
      setIsGenerating(false);
    }
  }, [input, isLocked, bearer]);

  const renderMessage = useCallback(
    ({ item }: { item: StreamMessage }) => (
      <View
        style={[
          styles.messageBubble,
          item.role === "user" ? styles.userBubble : styles.systemBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Intent Console</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          isGenerating ? (
            <View style={[styles.messageBubble, styles.systemBubble, styles.typingBubble]}>
              <Text style={styles.typingText}>● ● ●</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.textInput, isLocked && styles.inputLocked]}
          value={input}
          onChangeText={setInput}
          placeholder="Enter intent…"
          placeholderTextColor={c.textMuted}
          editable={!isLocked}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          style={[styles.sendButton, isLocked && styles.buttonLocked]}
          onPress={handleSubmit}
          disabled={isLocked}
        >
          <Text style={styles.sendButtonText}>
            {isSending ? "…" : "→"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** The one dark palette, shared with web through `orazaka-shared`. */
const c = themes.dark;

const styles = StyleSheet.create({
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
    marginBottom: 12,
  },
  messageList: { flex: 1 },
  messageContent: { paddingHorizontal: 24, paddingBottom: 12, gap: 8 },
  messageBubble: {
    borderRadius: 12,
    padding: 12,
    maxWidth: "85%",
    flexShrink: 1,
  },
  typingBubble: { paddingVertical: 10 },
  typingText: {
    fontSize: 12,
    letterSpacing: 2,
    color: c.accent,
  },
  userBubble: {
    backgroundColor: c.accentHover,
    alignSelf: "flex-end",
  },
  systemBubble: {
    backgroundColor: c.surface2,
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 14,
    color: c.textPrimary,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: c.surface2,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: c.surface2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: c.textPrimary,
  },
  inputLocked: { opacity: 0.5 },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLocked: { opacity: 0.4 },
  sendButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: c.onAccent,
  },
});
