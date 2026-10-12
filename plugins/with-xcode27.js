// Builds and launches this Expo SDK 53 app with Xcode 27 and on iOS 27 — until the move to Expo SDK 57 (whose
// template and React Native carry these changes), when this plugin is deleted.
//
//   1. Podfile: fmt 11.0.2 (React Native 0.79) does not compile in C++20 under the Xcode 27 clang (consteval format
//      strings) → fmt in C++17; resource bundles that still target iOS 12.4 → 15.1 (Xcode 27 refuses below 15).
//   2. Scene life cycle: the iOS 27 SDK stops an app at launch unless it adopts UIScene
//      (`___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`). Info.plist declares one window scene; its
//      delegate (added to AppDelegate.swift) creates the window and starts React Native, which the app delegate no
//      longer does. SDK 53's ExpoAppDelegate has no scene forwarding: a URL that opens the running app goes to React
//      Native's Linking directly from the scene delegate.
const { withAppDelegate, withInfoPlist, withPodfile } = require("expo/config-plugins");

const MARK = "# @with-xcode27";
const PODFILE_PATCH = `
    ${MARK}: fmt in C++17, no pod below iOS 15.1 (Xcode 27).
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17' if target.name == 'fmt'
        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        end
      end
    end
`;

const START_IN_APP_DELEGATE = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

const SCENE_DELEGATE = `
/// The window scene (iOS 27 requires the scene life cycle): creates the window and starts React Native in it.
@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory else { return }
    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    var launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions = [.url: url]
    }
    factory.startReactNative(withModuleName: "main", in: window, launchOptions: launchOptions)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
  }
}
`;

function withXcode27(config) {
  config = withPodfile(config, (c) => {
    if (!c.modResults.contents.includes(MARK)) {
      const anchor = /(\n\s*:ccache_enabled => [^\n]*\n\s*\)\n)/;
      if (!anchor.test(c.modResults.contents)) throw new Error("with-xcode27: Podfile template changed");
      c.modResults.contents = c.modResults.contents.replace(anchor, `$1${PODFILE_PATCH}`);
    }
    return c;
  });
  config = withInfoPlist(config, (c) => {
    c.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [{ UISceneConfigurationName: "Default Configuration", UISceneDelegateClassName: "SceneDelegate" }],
      },
    };
    return c;
  });
  return withAppDelegate(config, (c) => {
    let src = c.modResults.contents;
    if (!src.includes("class SceneDelegate")) {
      if (!START_IN_APP_DELEGATE.test(src)) throw new Error("with-xcode27: AppDelegate template changed");
      src = src.replace(START_IN_APP_DELEGATE, "\n    // SceneDelegate creates the window and starts React Native (scene life cycle, iOS 27).\n");
      src += SCENE_DELEGATE;
    }
    c.modResults.contents = src;
    return c;
  });
}

module.exports = withXcode27;
