import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Txt, useTheme } from "@krizaka/ui/native";
import type { RunArtefact } from "@krizaka/orazaka-shared";
import { asReport, asTextResult } from "../core/report";
import { Markdown } from "./Markdown";
import { ReportCards } from "./ReportCards";
import { ImageArtefact, VideoArtefact } from "./MediaArtefact";

/**
 * One thing a run produced, as the blueprint typed it: a picture shown, a clip played, a rules report as cards, a
 * model's text as Markdown with the run's facts apart. Never the raw value printed as a label and a path.
 */
export function ArtefactCard({ artefact, token }: Readonly<{ artefact: RunArtefact; token: string | null }>): React.JSX.Element {
  const { theme } = useTheme();
  const media = artefact.type !== "TEXT" && artefact.value !== "";
  const report = artefact.type === "TEXT" ? asReport(artefact.value) : null;
  const text = artefact.type === "TEXT" && report === null ? asTextResult(artefact.value) : null;
  return (
    <Card.Root>
      <Card.Body padding="sm" style={styles.body}>
        <Txt variant="caption" style={[styles.label, { color: theme.textMuted }]}>{artefact.label}</Txt>
        {media && artefact.type === "VIDEO" && <VideoArtefact value={artefact.value} token={token} label={artefact.label} />}
        {media && artefact.type === "AUDIO" && <VideoArtefact audio value={artefact.value} token={token} label={artefact.label} />}
        {media && artefact.type === "IMAGE" && <ImageArtefact value={artefact.value} token={token} label={artefact.label} />}
        {report !== null && <ReportCards report={report} />}
        {text !== null && <Markdown text={text.content} />}
        {text !== null && text.facts.length > 0 && (
          <View style={styles.facts}>
            {text.facts.map(([key, value]) => (
              <Txt key={key} variant="caption" style={{ color: theme.textMuted }}>{`${key} · ${value}`}</Txt>
            ))}
          </View>
        )}
      </Card.Body>
    </Card.Root>
  );
}

const styles = StyleSheet.create({
  body: { gap: 10 },
  label: { textTransform: "uppercase", letterSpacing: 0.6 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
