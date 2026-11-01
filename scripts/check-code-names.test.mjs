import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { displayedTexts } from "./check-code-names.mjs";

const config = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8"));

test("the name under the icon is the commercial name; the identifiers keep the code name", () => {
  assert.equal(config.expo.name, "Sovkora");
  assert.equal(config.expo.ios.bundleIdentifier, "com.krizaka.orazaka");
  assert.equal(config.expo.android.package, "com.krizaka.orazaka");
  assert.equal(config.expo.scheme, "orazaka");
  assert.equal(config.expo.slug, "orazaka-mobile");
});

test("the displayed fields are the name and the system prompts, in words a customer reads", () => {
  const shown = displayedTexts(config);
  assert.equal(shown.name, "Sovkora");
  assert.ok(shown.prompts.length >= 2);
  for (const text of [shown.name, ...shown.prompts, ...shown.infoPlist]) {
    assert.doesNotMatch(text, /orazaka|yomizaka|akinaza|kachizaka/i);
  }
  assert.ok(shown.prompts.every((p) => p.startsWith("Sovkora")));
});
