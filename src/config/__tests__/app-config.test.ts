import { readFileSync } from "fs";
import { join } from "path";

// app.json is what EAS Build reads: the Expo project (owner + id) the app's builds and updates belong to.
const { expo } = JSON.parse(readFileSync(join(__dirname, "../../../app.json"), "utf8")) as {
  expo: { owner: string; slug: string; extra: { eas: { projectId: string } }; ios: { bundleIdentifier: string }; android: { package: string } };
};

describe("app.json — EAS project", () => {
  it("is linked to the Expo project @oussamaabid/orazaka-mobile", () => {
    expect(expo.owner).toBe("oussamaabid");
    expect(expo.slug).toBe("orazaka-mobile");
    expect(expo.extra.eas.projectId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("keeps the store identifiers of the app", () => {
    expect(expo.ios.bundleIdentifier).toBe("com.krizaka.orazaka");
    expect(expo.android.package).toBe("com.krizaka.orazaka");
  });
});
