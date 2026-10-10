import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { themes } from "@krizaka/orazaka-shared";
import { SovereignChatCard } from "../components/SovereignChatCard";
import { useToken } from "../core/AuthContext";
import { streamChat } from "../core/streamChat";

/** Shared design tokens (AGENTS.md §8: mobile uses the same tokens as web). */
const c = themes.dark;

type Props = NativeStackScreenProps<RootStackParamList, "ChatStream">;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatStreamScreen(_props: Props): React.JSX.Element {
  const bearer = useToken();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One conversation per mounted screen, so a reply lands in the thread that asked for it.
  const conversationId = useRef(`mobile-${String(Date.now())}`);
  const abort = useRef<(() => void) | null>(null);

  // Leaving the screen mid-answer must close the request, not leave it writing into a dead tree.
  useEffect(() => () => abort.current?.(), []);

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt || isSending) return;

    const replyId = `msg-${String(Date.now())}-reply`;
    setMessages((prev) => [
      ...prev,
      { id: `msg-${String(Date.now())}`, role: "user", content: prompt },
      { id: replyId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsSending(true);
    setError(null);

    abort.current = streamChat(conversationId.current, prompt, bearer, {
      onContent: (accumulated) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === replyId ? { ...message, content: accumulated } : message,
          ),
        );
      },
      onDone: () => setIsSending(false),
      onError: (message) => {
        setError(message);
        setIsSending(false);
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orazaka Chat</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        ListEmptyComponent={
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>Your sovereign AI, on this device.</Text>
            <Text style={styles.welcomeSub}>
              Every request runs through the local interceptor pipeline. Nothing leaves your network.
            </Text>
            <SovereignChatCard />
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={[styles.messageText, item.role === "user" && styles.userText]}>
              {item.content === "" ? "…" : item.content}
            </Text>
          </View>
        )}
      />

      {error !== null && <Text style={styles.streamError}>{error}</Text>}

      <View style={styles.inputBar}>
        <TextInput
          id="chat-input"
          style={styles.textInput}
          placeholder="Message Orazaka…"
          placeholderTextColor={c.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!isSending}
          multiline
          maxLength={4000}
        />
        <TouchableOpacity
          id="chat-send"
          style={[styles.sendBtn, (isSending || !input.trim()) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isSending || !input.trim()}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  streamError: {
    color: c.accent,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 6,
  },
  container: {
    flex: 1,
    backgroundColor: c.surface0,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: c.textPrimary,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  welcome: {
    paddingTop: 28,
    paddingBottom: 8,
    gap: 10,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: c.textPrimary,
  },
  welcomeSub: {
    fontSize: 13.5,
    lineHeight: 20,
    color: c.textSecondary,
    marginBottom: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: c.accent,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.borderSubtle,
  },
  messageText: {
    fontSize: 15,
    color: c.textPrimary,
    lineHeight: 21,
  },
  userText: {
    color: c.onAccent,
    fontWeight: "500",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.borderSubtle,
    backgroundColor: c.surface1,
  },
  textInput: {
    flex: 1,
    backgroundColor: c.surface0,
    borderWidth: 1,
    borderColor: c.borderDefault,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: c.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.accent,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: c.onAccent,
    fontSize: 20,
    fontWeight: "700",
  },
});
