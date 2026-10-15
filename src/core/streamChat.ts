import { edgeUrl } from "../config/api";
import { pipelineOfAck, stepOf } from "./pipeline";

/** Why a stream ended badly — the screen words it in the person's language. */
export type StreamFailure =
  | { readonly kind: "unauthorized" }
  | { readonly kind: "interrupted"; readonly status: number }
  | { readonly kind: "unreachable" };

interface StreamHandlers {
  /** Called with the full text so far, each time it grows. */
  readonly onContent: (accumulated: string) => void;
  /** The interceptor chain the router will run (from `pipeline-ack`), before the model answers. */
  readonly onPipeline?: (interceptorIds: readonly string[]) => void;
  /** One interceptor just finished (from `pipeline-step`). */
  readonly onStep?: (interceptorId: string) => void;
  readonly onDone: () => void;
  readonly onError: (failure: StreamFailure) => void;
}

interface StreamOptions {
  /** A catalogue model name; absent or null: the platform's default. */
  readonly model?: string | null;
}

/** Parses one SSE `data:` payload that is JSON; `undefined` when it is not. */
function jsonOf(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * Extracts the text out of one SSE `data:` payload.
 *
 * The server sends either a JSON object with `content`/`text`, or a bare string. Both shapes are
 * accepted here for the same reason the web client accepts both — the fallback is what keeps a
 * plain-text chunk from being dropped as unparseable.
 */
function chunkOf(raw: string): string {
  const parsed = jsonOf(raw);
  if (parsed === undefined) return raw;
  if (typeof parsed === "object" && parsed !== null) {
    const record = parsed as Record<string, unknown>;
    const text = record.content ?? record.text;
    return typeof text === "string" ? text : "";
  }
  return typeof parsed === "string" ? parsed : "";
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
 * @param handlers content / pipeline / done / error callbacks
 * @param options the model to answer with
 * @returns a function that aborts the stream
 */
export function streamChat(
  conversationId: string,
  prompt: string,
  token: string | null,
  handlers: StreamHandlers,
  options: StreamOptions = {},
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
      const raw = cleaned.slice(5).trim();
      // pipeline-ack / pipeline-step describe the interceptor pipeline, not the answer: they feed the
      // pipeline chips and never land in the reply.
      if (currentEvent === "pipeline-ack") {
        const ids = pipelineOfAck(jsonOf(raw));
        if (ids.length > 0) handlers.onPipeline?.(ids);
        continue;
      }
      if (currentEvent === "pipeline-step") {
        const id = stepOf(jsonOf(raw));
        if (id !== null) handlers.onStep?.(id);
        continue;
      }
      if (currentEvent !== "message") {
        continue;
      }
      const chunk = chunkOf(raw);
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
        handlers.onError(request.status === 401 ? { kind: "unauthorized" } : { kind: "interrupted", status: request.status });
      }
    }
  };

  request.onerror = () => handlers.onError({ kind: "unreachable" });
  request.send(JSON.stringify({ prompt, assetIds: [], model: options.model ?? null }));

  return () => request.abort();
}
