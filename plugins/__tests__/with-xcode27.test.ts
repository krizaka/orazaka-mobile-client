import fs from "node:fs";
import path from "node:path";

// The plugin is CommonJS run by Expo's prebuild; its pure parts are tested against the SDK 53 template
// (expo-template-bare-minimum@53.0.42), what `expo prebuild` generates for this app.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const plugin = require("../with-xcode27") as {
  patchPodfile: (src: string) => string;
  adoptScenes: (src: string) => string;
  SCENE_MANIFEST: { UISceneConfigurations: { UIWindowSceneSessionRoleApplication: { UISceneDelegateClassName: string }[] } };
};

const read = (name: string) => fs.readFileSync(path.join(__dirname, name), "utf8");
const appDelegate = read("AppDelegate.sdk53.swift.txt");
const podfile = read("Podfile.sdk53.txt");

describe("with-xcode27", () => {
  it("compiles fmt in C++17 and no pod below iOS 15.1, inside post_install", () => {
    const patched = plugin.patchPodfile(podfile);
    expect(patched).toContain("config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17' if target.name == 'fmt'");
    expect(patched).toContain("config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'");
    expect(patched.indexOf("@with-xcode27")).toBeGreaterThan(patched.indexOf("post_install do |installer|"));
    expect(plugin.patchPodfile(patched)).toBe(patched);
  });

  it("starts React Native from a scene delegate, not from the app delegate (iOS 27 stops an app without scenes)", () => {
    expect(appDelegate).toContain("window = UIWindow(frame: UIScreen.main.bounds)");
    const patched = plugin.adoptScenes(appDelegate);
    expect(patched).not.toContain("UIWindow(frame:");
    expect(patched).toContain("class SceneDelegate: UIResponder, UIWindowSceneDelegate");
    expect(patched.match(/factory\.startReactNative\(/g)).toHaveLength(1);
    expect(plugin.adoptScenes(patched)).toBe(patched);
    expect(plugin.SCENE_MANIFEST.UISceneConfigurations.UIWindowSceneSessionRoleApplication[0].UISceneDelegateClassName).toBe("SceneDelegate");
  });

  it("refuses templates it does not know", () => {
    expect(() => plugin.patchPodfile("platform :ios")).toThrow(/template changed/);
    expect(() => plugin.adoptScenes("class AppDelegate {}")).toThrow(/template changed/);
  });
});
