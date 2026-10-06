import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { themes } from "@krizaka/orazaka-shared";

/** The one dark palette, shared with web through `orazaka-shared`. */
const c = themes.dark;

type Props = NativeStackScreenProps<RootStackParamList, "Subscription">;

interface PlanCard {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  accent: string;
  highlighted: boolean;
}

const plans: PlanCard[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "5 AI conversations/day",
      "Text-only mode",
      "Community support",
      "Basic model access",
    ],
    accent: c.textSecondary,
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    features: [
      "Unlimited conversations",
      "Multi-modal (Text + Image + Audio)",
      "Priority SSE streaming",
      "Video synthesis access",
      "Premium model routing",
      "Priority support",
    ],
    accent: c.accent,
    highlighted: true,
  },
];

export function SubscriptionScreen(_props: Props): React.JSX.Element {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>
        Unlock the full power of sovereign AI
      </Text>

      {plans.map((plan) => (
        <View
          key={plan.id}
          style={[
            styles.card,
            plan.highlighted && styles.cardHighlighted,
          ]}
        >
          {plan.highlighted && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>RECOMMENDED</Text>
            </View>
          )}
          <Text style={[styles.planName, { color: plan.accent }]}>
            {plan.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.period}>{plan.period}</Text>
          </View>

          {plan.features.map((feat, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          ))}

          <TouchableOpacity
            id={`subscribe-${plan.id}`}
            style={[
              styles.subscribeBtn,
              { backgroundColor: plan.highlighted ? plan.accent : "transparent" },
              !plan.highlighted && styles.subscribeBtnOutline,
            ]}
          >
            <Text
              style={[
                styles.subscribeBtnText,
                !plan.highlighted && { color: plan.accent },
              ]}
            >
              {plan.highlighted ? "Get Pro" : "Continue Free"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.surface0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: c.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  card: {
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.surface3,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  cardHighlighted: {
    borderColor: c.accent,
    shadowColor: c.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  badge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: c.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: c.surface0,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: "800",
    color: c.textPrimary,
  },
  period: {
    fontSize: 14,
    color: c.textSecondary,
    marginLeft: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkmark: {
    color: c.accent,
    fontSize: 15,
    marginRight: 10,
    fontWeight: "700",
  },
  featureText: {
    fontSize: 14,
    color: c.textSecondary,
  },
  subscribeBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  subscribeBtnOutline: {
    borderWidth: 1,
    borderColor: c.textSecondary,
  },
  subscribeBtnText: {
    color: c.surface0,
    fontSize: 16,
    fontWeight: "700",
  },
});
