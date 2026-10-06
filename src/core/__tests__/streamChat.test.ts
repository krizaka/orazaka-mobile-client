import { streamChat } from "../streamChat";

/**
 * A controllable stand-in for the XHR the streamer drives.
 *
 * Hand-rolled rather than mocked with a library because the whole point of these tests is the
 * *incremental* delivery: the fake must be able to grow `responseText` one chunk at a time, which
 * is exactly the behaviour a request-level mock would paper over.
 */
class FakeXhr {
  static instances: FakeXhr[] = [];

  readyState = 0;
  status = 0;
  responseText = "";
  onreadystatechange: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readonly headers: Record<string, string> = {};
  sentBody: string | null = null;
  aborted = false;

  constructor() {
    FakeXhr.instances.push(this);
  }

  open(): void {
    this.readyState = 1;
  }

  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  send(body: string): void {
    this.sentBody = body;
  }

  abort(): void {
    this.aborted = true;
  }

  /** Appends to the body and fires a progress event, as a real streaming response does. */
  push(chunk: string): void {
    this.readyState = 3;
    this.responseText += chunk;
    this.onreadystatechange?.();
  }

  /** Completes the request. */
  finish(status = 200): void {
    this.readyState = 4;
    this.status = status;
    this.onreadystatechange?.();
  }
}

beforeEach(() => {
  FakeXhr.instances = [];
  (globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXhr;
});

function start(token: string | null = "jwt-123") {
  const content: string[] = [];
  const errors: string[] = [];
  let done = false;

  const abort = streamChat("conv-1", "Bonjour", token, {
    onContent: (accumulated) => content.push(accumulated),
    onDone: () => {
      done = true;
    },
    onError: (message) => errors.push(message),
  });

  return { xhr: FakeXhr.instances[0], content, errors, abort, isDone: () => done };
}

describe("streamChat", () => {
  it("carries the bearer token so the edge does not answer 401", () => {
    const { xhr } = start();

    expect(xhr.headers.Authorization).toBe("Bearer jwt-123");
    expect(xhr.headers.Accept).toBe("text/event-stream");
  });

  it("omits the header entirely when signed out rather than sending 'Bearer null'", () => {
    const { xhr } = start(null);

    expect(xhr.headers.Authorization).toBeUndefined();
  });

  it("accumulates tokens, emitting the whole text so far each time", () => {
    const { xhr, content } = start();

    xhr.push('data: {"content":"Bon"}\n\n');
    xhr.push('data: {"content":"jour"}\n\n');

    expect(content).toEqual(["Bon", "Bonjour"]);
  });

  it("holds a half-delivered line until its remainder arrives", () => {
    const { xhr, content } = start();

    // A chunk boundary in the middle of the JSON — the normal case over a real socket, and the
    // one that silently truncates an answer if the buffer is parsed eagerly.
    xhr.push('data: {"cont');
    expect(content).toEqual([]);

    xhr.push('ent":"Bonjour"}\n\n');
    expect(content).toEqual(["Bonjour"]);
  });

  it("reads a bare string payload, not only the JSON envelope", () => {
    const { xhr, content } = start();

    xhr.push("data: Bonjour\n\n");

    expect(content).toEqual(["Bonjour"]);
  });

  it("ignores pipeline events so interceptor traffic never lands in the reply", () => {
    const { xhr, content } = start();

    xhr.push("event: pipeline-ack\ndata: {\"interceptors\":[\"a\",\"b\"]}\n\n");
    xhr.push("event: pipeline-step\ndata: {\"interceptorId\":\"translation\"}\n\n");
    xhr.push('data: {"content":"Bonjour"}\n\n');

    expect(content).toEqual(["Bonjour"]);
  });

  it("resumes reading message events after a pipeline event", () => {
    const { xhr, content } = start();

    // The blank line ends the pipeline event; without resetting, everything after it would be
    // discarded as if it were still pipeline traffic — an answer that never appears.
    xhr.push("event: pipeline-step\ndata: {\"interceptorId\":\"x\"}\n\n");
    xhr.push('data: {"content":"Salut"}\n\n');

    expect(content).toEqual(["Salut"]);
  });

  it("reports the end of a successful stream", () => {
    const { xhr, isDone, errors } = start();

    xhr.push('data: {"content":"ok"}\n\n');
    xhr.finish(200);

    expect(isDone()).toBe(true);
    expect(errors).toEqual([]);
  });

  it("names an expired session rather than blaming the network", () => {
    const { xhr, errors } = start();

    xhr.finish(401);

    expect(errors[0]).toContain("Session expirée");
  });

  it("reports other failures with their status", () => {
    const { xhr, errors } = start();

    xhr.finish(503);

    expect(errors[0]).toContain("503");
  });

  it("aborts the underlying request when the caller stops listening", () => {
    const { xhr, abort } = start();

    abort();

    expect(xhr.aborted).toBe(true);
  });

  it("sends the prompt the actor typed", () => {
    const { xhr } = start();

    expect(JSON.parse(xhr.sentBody ?? "{}")).toMatchObject({ prompt: "Bonjour" });
  });
});
