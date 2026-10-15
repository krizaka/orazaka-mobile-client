import React from "react";
import { StyleSheet, View } from "react-native";
import { Badge, Card, Txt, useTheme, type BadgeTone } from "@krizaka/ui/native";
import type { Report, Tone } from "../core/report";

const BADGE: Record<Tone, BadgeTone> = { success: "success", danger: "danger", warning: "warning", neutral: "neutral" };

/**
 * A rules report as cards: the verdict counts, then one card per finding — failures first — with the rule, what was
 * found, the passage quoted and the law cited. The words are the report's own; nothing is summarised here.
 */
export function ReportCards({ report }: Readonly<{ report: Report }>): React.JSX.Element {
  const { theme } = useTheme();
  return (
    <View style={styles.root}>
      <View style={styles.counts}>
        {report.counts.map(([verdict, count]) => (
          <Badge key={verdict} tone={verdict === "FAIL" ? "danger" : verdict === "PASS" ? "success" : "warning"}>
            {`${verdict.replace(/_/g, " ")} · ${String(count)}`}
          </Badge>
        ))}
        {report.source !== null && <Txt variant="caption" style={{ color: theme.textMuted }}>{report.source}</Txt>}
      </View>
      {report.findings.map((finding) => (
        <Card.Root key={finding.id}>
          <Card.Body padding="sm" style={styles.finding}>
            <View style={styles.head}>
              <Badge tone={BADGE[finding.tone]}>{finding.verdict.replace(/_/g, " ")}</Badge>
              <Txt variant="caption" style={{ color: theme.textMuted }}>{finding.id}</Txt>
            </View>
            <Txt variant="label">{finding.title}</Txt>
            {finding.explanation !== null && <Txt variant="body" style={{ color: theme.textSecondary }}>{finding.explanation}</Txt>}
            {finding.quote !== null && (
              <View style={[styles.quote, { borderLeftColor: theme.accent }]}>
                <Txt variant="caption" style={{ color: theme.textSecondary, fontStyle: "italic" }}>{`« ${finding.quote} »`}</Txt>
              </View>
            )}
            {finding.citation !== null && <Txt variant="caption" style={{ color: theme.textMuted }}>{finding.citation}</Txt>}
          </Card.Body>
        </Card.Root>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  counts: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  finding: { gap: 6 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quote: { borderLeftWidth: 2, paddingLeft: 10 },
});
