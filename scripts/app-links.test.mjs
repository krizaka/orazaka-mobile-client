// node --test scripts — app.json carries what the claimed paths need: the iOS associated domain and an Android
// autoVerify intent filter covering every path of app-links.json (the file the web app serves its AASA / assetlinks from).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkAppJson } from "./check-app-links.mjs";

const read = (f) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"));

test("app.json passes the app-links rule (associated domain, autoVerify intent filter, every claimed path)", () => {
  assert.deepEqual(checkAppJson(read("app.json"), read("app-links.json")), []);
});

test("the rule notices a path no intent filter covers", () => {
  const links = { ...read("app-links.json"), paths: [...read("app-links.json").paths, "/elsewhere/*"] };
  assert.equal(checkAppJson(read("app.json"), links).length, 1);
});
