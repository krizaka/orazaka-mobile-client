import { edgeUrl } from "../config/api";

interface StreamHandlers {
  /** Called with the full text so far, each time it grows. */
  readonly onContent: (accumulated: string) => void;
  readonly onDone: () => void;
  readonly onError: (message: string) => void;
}

/**
 * Extracts the text out of one SSE `data:` payload.
 *
 * The server sends either a JSON object with `content`/`text`, or a bare string. Both shapes are
 * accepted here for the same reason the web client accepts both — the fallback is what keeps a
 * plain-text chunk from being dropped as unparseable.
 */
function chunkOf(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const text = record.content ?? record.text;
      return typeof text === "string" ? text : "";
    }
    return typeof parsed === "string" ? parsed : "";
  } catch {
    return raw;
  }
}

/**
 * Streams a chat completion token by token.
 *
 * Built on `XMLHttpRequest`, not `fetch` or `EventSource`. React Native's `fetch` resolves only
 * when the whole body has arrived — it exposes no readable stream — so a token-by-token UI is
 * impossible through it, and `EventSource` neither exists natively nor can carry the
 * `Authorization` header the edge requires. XHR's incremental `responseText` is the one transport
 * that gives both. That is also why this reads the *delta* of `responseText` on each progress
 * event rather than re-parsing the whole buffer.
 *
 * @param conversationId the conversation to append to
 * @param prompt what the actor typed
 * @param token the bearer JWT
 * @param handlers content / done / error callbacks
 * @returns a function that aborts the stream
 */
export function streamChat(
  conversationId: string,
  prompt: string,
  token: string | null,
  handlers: StreamHandlers,
): () => void {
  const request = new XMLHttpRequest();
  let consumed = 0;
  let pending = "";
  let currentEvent = "message";
  let accumulated = "";

  const consume = (text: string) => {
    pending += text;
    const lines = pending.split("\n");
    // The last element may be half a line; keep it for the next progress event.
    pending = lines.pop() ?? "";

    for (const line of lines) {
      const cleaned = line.trim();
      if (cleaned === "") {
        currentEvent = "message";
        continue;
      }
      if (cleaned.startsWith("event:")) {
        currentEvent = cleaned.slice(6).trim();
        continue;
      }
      if (!cleaned.startsWith("data:")) {
        continue;
      }
      // pipeline-ack / pipeline-step describe the interceptor pipeline, not the answer. The web
      // console visualises them; on a phone they would be noise in the middle of a reply.
      if (currentEvent !== "message") {
        continue;
      }
      const chunk = chunkOf(cleaned.slice(5).trim());
      if (chunk !== "") {
        accumulated += chunk;
        handlers.onContent(accumulated);
      }
    }
  };

  request.open("POST", edgeUrl(`/api/v1/chat/stream/${conversationId}`));
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Accept", "text/event-stream");
  if (token !== null) {
    request.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  request.onreadystatechange = () => {
    // 3 = LOADING: the body is still arriving, which is the whole point.
    if (request.readyState >= 3) {
      const text = request.responseText;
      if (text.length > consumed) {
        consume(text.slice(consumed));
        consumed = text.length;
      }
    }
    if (request.readyState === 4) {
      if (request.status >= 200 && request.status < 300) {
        handlers.onDone();
      } else {
        handlers.onError(
          request.status === 401
            ? "Session expirée — reconnectez-vous."
            : `Le flux s'est interrompu (${String(request.status)})`,
        );
      }
    }
  };

  request.onerror = () => handlers.onError("Impossible de joindre la plateforme.");
  request.send(JSON.stringify({ prompt, assetIds: [], model: null }));

  return () => request.abort();
}
