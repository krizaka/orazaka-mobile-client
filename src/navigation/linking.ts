import type { LinkingOptions } from "@react-navigation/native";
import appLinks from "../../app-links.json";
import type { RootStackParamList } from "./AppNavigator";

/**
 * Universal links / App Links: the addresses `app-links.json` claims (the same file the web app serves its
 * apple-app-site-association and assetlinks from) open the screen that shows the same thing. `orazaka://` stays for
 * deep links of our own. A path with no screen here opens the app where it was.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`https://${appLinks.host}`, "orazaka://"],
  config: {
    screens: {
      Tabs: {
        screens: { Studios: "studios", ChatStream: "chat", Jobs: "jobs", Profile: "settings" },
      },
      StudioDetail: "studios/:studioKey",
    },
  },
};
