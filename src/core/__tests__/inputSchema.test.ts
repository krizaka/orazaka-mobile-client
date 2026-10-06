import { isComplete, parseInputSchema, toInputs } from "../inputSchema";

/** The real `trade-showcase` schema, copied from what the service returned. */
const TRADE_SHOWCASE = JSON.stringify({
  type: "object",
  required: ["photos", "trade"],
  properties: {
    trade: { type: "string", title: "Votre métier", maxLength: 60 },
    photos: {
      type: "array",
      items: { type: "string" },
      title: "Photos de vos réalisations",
      maxItems: 6,
      minItems: 1,
    },
  },
});

describe("parseInputSchema", () => {
  it("reads the fields a real Studio declares", () => {
    const fields = parseInputSchema(TRADE_SHOWCASE);

    expect(fields.map((field) => field.key).sort()).toEqual(["photos", "trade"]);
    expect(fields.find((field) => field.key === "photos")?.isList).toBe(true);
    expect(fields.find((field) => field.key === "trade")?.isList).toBe(false);
    expect(fields.find((field) => field.key === "trade")?.maxLength).toBe(60);
  });

  it("uses the declared title, falling back to the key", () => {
    const fields = parseInputSchema(
      JSON.stringify({ properties: { a: { type: "string", title: "Le A" }, b: { type: "string" } } }),
    );

    expect(fields.find((field) => field.key === "a")?.title).toBe("Le A");
    expect(fields.find((field) => field.key === "b")?.title).toBe("b");
  });

  it("puts required fields first — on a phone, what is below the fold gets missed", () => {
    const fields = parseInputSchema(
      JSON.stringify({
        required: ["second"],
        properties: { first: { type: "string" }, second: { type: "string" } },
      }),
    );

    expect(fields[0].key).toBe("second");
  });

  it("treats an absent or unparseable schema as no fields rather than throwing", () => {
    expect(parseInputSchema(null)).toEqual([]);
    expect(parseInputSchema("")).toEqual([]);
    expect(parseInputSchema("{ not json")).toEqual([]);
  });
});

describe("toInputs", () => {
  const fields = parseInputSchema(TRADE_SHOWCASE);

  it("splits a list field on newlines", () => {
    const inputs = toInputs(fields, { trade: "plombier", photos: "photo-1\nphoto-2" });

    expect(inputs).toEqual({ trade: "plombier", photos: ["photo-1", "photo-2"] });
  });

  it("drops blank lines and surrounding space, which a phone keyboard adds freely", () => {
    const inputs = toInputs(fields, { trade: " plombier ", photos: "photo-1\n\n  photo-2  \n" });

    expect(inputs).toEqual({ trade: "plombier", photos: ["photo-1", "photo-2"] });
  });

  it("omits an unanswered optional field instead of sending an empty string", () => {
    // An empty string is an answer; the absence of the key is not. Sending "" would make the
    // service validate a value the actor never gave.
    expect(toInputs(fields, { trade: "plombier" })).toEqual({ trade: "plombier" });
  });
});

describe("isComplete", () => {
  const fields = parseInputSchema(TRADE_SHOWCASE);

  it("refuses a run the service would reject with a 400", () => {
    // This is the whole point: the screen used to send {} and the run came back
    // "missing required inputs: [photos, trade]" — a refusal the actor could do nothing about.
    expect(isComplete(fields, {})).toBe(false);
    expect(isComplete(fields, { trade: "plombier" })).toBe(false);
  });

  it("accepts once every required field has an answer", () => {
    expect(isComplete(fields, { trade: "plombier", photos: "photo-1" })).toBe(true);
  });

  it("does not count whitespace as an answer", () => {
    expect(isComplete(fields, { trade: "   ", photos: "photo-1" })).toBe(false);
  });
});
