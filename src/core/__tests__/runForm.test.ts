import { isAdvanced, runPercent, splitFields } from "../runForm";
import type { SchemaField } from "../inputSchema";

const field = (key: string, required = false): SchemaField => ({ key, title: key, required, isList: false, isNumber: false });

describe("a run form on a phone", () => {
  it("keeps the required prompt and the format in view, tuning behind More options", () => {
    const { basic, advanced } = splitFields([field("prompt", true), field("size"), field("seed"), field("model"), field("negativePrompt")]);
    expect(basic.map((f) => f.key)).toEqual(["prompt", "size"]);
    expect(advanced.map((f) => f.key)).toEqual(["seed", "model", "negativePrompt"]);
  });

  it("never hides a required field, whatever its name", () => {
    expect(isAdvanced(field("model", true))).toBe(false);
  });
});

describe("run progress", () => {
  it("is unknown before the steps are", () => {
    expect(runPercent([])).toBeNull();
  });

  it("counts the steps that are over, skipped ones included", () => {
    expect(runPercent([{ status: "SUCCEEDED" }, { status: "SKIPPED" }, { status: "RUNNING" }, { status: "PENDING" }])).toBe(50);
  });
});
