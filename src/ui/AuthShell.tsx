import React from "react";
import { StyleSheet, View } from "react-native";
import { OrazakaMark, Screen, Txt } from "@krizaka/ui/native";

interface Props {
  readonly title: string;
  readonly subtitle: string;
  readonly children: React.ReactNode;
}

/** The frame of every signed-out screen: the Orazaka mark, a title and a line, then the form — the kit's `Screen`. */
export function AuthShell({ title, subtitle, children }: Readonly<Props>): React.JSX.Element {
  return (
    <Screen padding={24} contentStyle={styles.content}>
      <View style={styles.head}>
        <OrazakaMark size={64} />
        <Txt variant="display" style={styles.centre}>
          {title}
        </Txt>
        <Txt tone="secondary" style={styles.centre}>
          {subtitle}
        </Txt>
      </View>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, justifyContent: "center", flexGrow: 1 },
  head: { alignItems: "center", gap: 8, marginBottom: 8 },
  centre: { textAlign: "center" },
});
