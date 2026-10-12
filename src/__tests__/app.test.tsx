import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@krizaka/ui/native";
import { brands } from "@krizaka/tokens/native";
import { AppNavigator } from "../navigation/AppNavigator";
import { AuthProvider } from "../core/AuthContext";
import { answerFetch } from "./test-api";
import login from "../__fixtures__/api/auth-login.local-demo.json";
import studios from "../__fixtures__/api/studios.local-demo.json";
import jobs from "../__fixtures__/api/jobs.local-demo.json";
import profile from "../__fixtures__/api/profile.local-demo.json";

// The keychain, in memory.
const mockKeychain = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: async (key: string) => mockKeychain.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => void mockKeychain.set(key, value),
  deleteItemAsync: async (key: string) => void mockKeychain.delete(key),
}));

const app = () =>
  render(
    <ThemeProvider defaultMode="dark" overrides={brands.orazaka}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>,
  );

const signedIn = { "/api/v1/studios": studios, "/api/v1/jobs": jobs, "/api/v1/profile": profile };

beforeEach(() => mockKeychain.clear());

describe("the app, on recorded edge responses", () => {
  it("signs in with e-mail and password, keeps the session in the keychain and opens the Studios", async () => {
    const calls = answerFetch({ "/api/v1/auth/login": login, ...signedIn });
    await app();
    await fireEvent.changeText(await screen.findByPlaceholderText("Email"), " eric.morel@example.com ");
    await fireEvent.changeText(screen.getByPlaceholderText("Password"), "secret");
    await fireEvent.press(screen.getByText("Sign In"));

    expect(await screen.findByText("Vitrine Artisan")).toBeTruthy();
    expect(screen.getByText("Génération d'image")).toBeTruthy();
    // A locked Studio is listed, not hidden.
    expect(screen.getByText("Verrouillé")).toBeTruthy();

    const signIn = calls.find((c) => c.path === "/api/v1/auth/login");
    expect(signIn?.body).toEqual({ email: "eric.morel@example.com", password: "secret" });
    expect(JSON.parse(mockKeychain.get("orazaka.session") ?? "{}").token).toBe("recorded-token");
    expect(calls.find((c) => c.path === "/api/v1/studios")?.headers.Authorization).toBe("Bearer recorded-token");
  });

  it("shows the edge's refusal on a wrong password and stays on the sign-in screen", async () => {
    answerFetch({ "/api/v1/auth/login": { status: 401, body: { error: "Invalid email or password" } } });
    await app();
    await fireEvent.changeText(await screen.findByPlaceholderText("Email"), "eric.morel@example.com");
    await fireEvent.changeText(screen.getByPlaceholderText("Password"), "wrong");
    await fireEvent.press(screen.getByText("Sign In"));
    expect(await screen.findByText("Invalid email or password")).toBeTruthy();
    expect(mockKeychain.size).toBe(0);
  });

  it("opens on the Studios when a session is stored, then lists the jobs and the profile", async () => {
    mockKeychain.set("orazaka.session", JSON.stringify(login));
    answerFetch(signedIn);
    await app();
    expect(await screen.findByText("Vitrine Artisan")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: /Jobs/ }));
    expect(await screen.findByText("Tâches par jour")).toBeTruthy();
    expect(screen.getAllByText("Terminé").length).toBeGreaterThan(0);

    await fireEvent.press(screen.getByRole("button", { name: /Profil/ }));
    expect(await screen.findByText("eric.morel@example.com")).toBeTruthy();
    await fireEvent.press(screen.getByText("Se déconnecter"));
    expect(await screen.findByText("Sign in to your account")).toBeTruthy();
    expect(mockKeychain.size).toBe(0);
  });

  it("says the edge is unreachable instead of showing an empty catalogue", async () => {
    mockKeychain.set("orazaka.session", JSON.stringify(login));
    answerFetch({});
    await app();
    expect(await screen.findByText(/Network request failed/)).toBeTruthy();
  });
});
