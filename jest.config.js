/**
 * Jest for the mobile client.
 *
 * Node environment with `ts-jest`, not the `jest-expo` preset: what is under test here is pure
 * logic — the SSE parser, the API client, the session store — none of which touches a native
 * module. Loading Expo's native runtime to test a string parser buys nothing and costs a
 * teardown crash (`expo/src/winter/runtime.native.ts` requires lazily, outside the test scope).
 *
 * Component rendering, if it is ever wanted here, belongs in a second project with the
 * `jest-expo` preset rather than by weighing this one down.
 */
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["src/core/**/*.ts", "src/config/**/*.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx", esModuleInterop: true } }],
  },
};
