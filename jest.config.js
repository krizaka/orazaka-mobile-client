/**
 * Jest for the mobile client — two projects.
 *
 * `logic`: Node with `ts-jest` for what touches no native module (the SSE parser, the API client, the session store):
 * loading Expo's native runtime to test a string parser buys nothing.
 *
 * `screens`: the `jest-expo` preset with @testing-library/react-native — screens and the navigator rendered on API
 * responses recorded from the local Orazaka stack (`src/__fixtures__/api`, the demo persona). React is mapped to this
 * package's own copy (React 19.0.0, the version of React Native 0.79's renderer — see metro.config.js), never the
 * workspace's hoisted 19.2.x.
 */
const path = require("path");

const reactDir = path.dirname(require.resolve("react/package.json", { paths: [__dirname] }));
/** @krizaka/* packages export ES modules only (an `import` condition): Jest requires their files directly. */
const krizaka = (name, file) => path.join(path.dirname(require.resolve(`@krizaka/${name}/package.json`, { paths: [__dirname] })), file);

module.exports = {
  projects: [
    {
      displayName: "logic",
      testEnvironment: "node",
      preset: "ts-jest",
      testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx", esModuleInterop: true } }],
      },
    },
    {
      displayName: "screens",
      preset: "jest-expo/ios",
      // Like Metro (expo/metro-config): this package's own node_modules first, for hoisted packages too.
      modulePaths: ["<rootDir>/node_modules"],
      setupFiles: ["<rootDir>/jest.setup.screens.js"],
      testMatch: ["<rootDir>/src/**/__tests__/**/*.test.tsx"],
      moduleNameMapper: {
        "^react$": reactDir,
        "^react/(.*)$": `${reactDir}/$1`,
        "^@krizaka/ui/native$": krizaka("ui", "dist/native.js"),
        "^@krizaka/tokens/native$": krizaka("tokens", "dist/native.js"),
        "^@krizaka/charts/native$": krizaka("charts", "dist/native.js"),
        "^@krizaka/intl$": krizaka("intl", "dist/index.js"),
      },
      transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-navigation|@krizaka/.*|react-native-svg))",
      ],
    },
  ],
  collectCoverageFrom: ["src/core/**/*.ts", "src/config/**/*.ts"],
};
