import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@krizaka/ui/native";
import { brands } from "@krizaka/tokens/native";
import { AuthProvider } from "../../core/AuthContext";
import { StudioRunScreen } from "../StudioRunScreen";
import { answerFetch } from "../../__tests__/test-api";
import mockLogin from "../../__fixtures__/api/auth-login.local-demo.json";

jest.mock("expo-secure-store", () => ({
  getItemAsync: async () => JSON.stringify(mockLogin),
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

const inputSchema = JSON.stringify({
  required: ["prompt"],
  properties: {
    prompt: { type: "string", title: "Prompt" },
    aspect: { type: "string", title: "Format", enum: ["9:16", "16:9"], default: "16:9" },
    seed: { type: "integer", title: "Seed" },
  },
});

const finished = {
  id: "run-1", installationId: "inst-1", studioKey: "video-generation", blueprintVersion: "1.3.0", status: "SUCCEEDED",
  startedAt: "2026-10-15T10:00:00Z", finishedAt: "2026-10-15T10:01:00Z", errorMessage: null,
  steps: [{ stepId: "render", ordinal: 0, status: "SUCCEEDED" }],
  outputs: [
    { key: "clip", label: "Clip", type: "VIDEO", value: "/api/v1/assets/job-1/video.mp4" },
    { key: "note", label: "Note", type: "TEXT", value: "**Plan :** une lampe" },
  ],
};

describe("StudioRunScreen — start, then the result as the phone should show it", () => {
  it("offers the enum as a choice, sends it with the seed as a number, then plays the clip and renders the note", async () => {
    const calls = answerFetch({
      "/api/v1/studios/video-generation": { inputSchema },
      "/api/v1/studios/installations/inst-1/runs": finished,
    });
    const route = { params: { installationId: "inst-1", label: "Vidéo", studioKey: "video-generation" } };
    await render(
      <ThemeProvider defaultMode="dark" overrides={brands.orazaka}>
        <AuthProvider>
          <StudioRunScreen route={route as never} navigation={{} as never} />
        </AuthProvider>
      </ThemeProvider>,
    );
    await fireEvent.changeText((await screen.findAllByDisplayValue(""))[0]!, "une lampe en chêne");
    await fireEvent.press(screen.getByText("9:16"));
    await fireEvent.press(screen.getByText("Lancer"));

    expect(await screen.findByLabelText("Clip")).toBeTruthy();
    expect(screen.getByText("Plan :")).toBeTruthy();
    expect(screen.queryByText(/\*\*/)).toBeNull();
    const start = calls.find((c) => c.method === "POST");
    expect(start?.body).toEqual({ inputs: { prompt: "une lampe en chêne", aspect: "9:16" } });
  });
});
