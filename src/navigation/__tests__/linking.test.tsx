import { getStateFromPath } from "@react-navigation/native";
import { linking } from "../linking";

const stateFor = (path: string) => getStateFromPath(path, linking.config);

describe("universal links open the screen that shows the same thing", () => {
  it.each([
    ["/studios", "Studios"],
    ["/chat", "ChatStream"],
    ["/jobs", "Jobs"],
    ["/settings", "Profile"],
  ])("%s opens the %s tab", (path, tab) => {
    const state = stateFor(path);
    expect(state?.routes[0].name).toBe("Tabs");
    const tabs = state?.routes[0].state;
    expect(tabs?.routes.at(-1)?.name).toBe(tab);
  });

  it("opens a Studio from /studios/<key>", () => {
    const route = stateFor("/studios/image")?.routes.at(-1);
    expect(route?.name).toBe("StudioDetail");
    expect(route?.params).toEqual({ studioKey: "image" });
  });

  it("claims the addresses of the web app and ours", () => {
    expect(linking.prefixes).toEqual(["https://dev.orazaka.com", "orazaka://"]);
  });
});
