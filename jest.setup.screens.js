// Expo SDK 53's "winter" runtime installs lazy globals (import.meta registry, structuredClone) whose first read
// requires a module; under Jest that read can land after the test file is torn down ("require a file outside of the
// scope of the test code"). Define them eagerly here.
jest.mock("expo/src/winter/ImportMetaRegistry", () => ({ ImportMetaRegistry: { get url() { return null; } } }));
if (typeof global.structuredClone !== "function") {
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
