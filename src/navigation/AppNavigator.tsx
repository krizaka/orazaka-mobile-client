/**
 * @file AppNavigator.tsx
 * @description Root navigation for the Orazaka mobile client.
 *
 * Two stacks, chosen by whether a session exists: the auth flow, or the app. That replaces a
 * single stack that started on Login and let every other screen be reached without ever signing
 * in — the old `guarded()` wrapper was an error boundary, not an access check, despite the name.
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { themes } from "@krizaka/orazaka-shared";

import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../screens/ResetPasswordScreen";
import { ChatStreamScreen } from "../screens/ChatStreamScreen";
import { SubscriptionScreen } from "../screens/SubscriptionScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ConsoleScreen } from "../screens/ConsoleScreen";
import { AdminGovernanceScreen } from "../screens/AdminGovernanceScreen";
import { StudioCatalogueScreen } from "../screens/StudioCatalogueScreen";
import { StudioDetailScreen } from "../screens/StudioDetailScreen";
import { StudioRunScreen } from "../screens/StudioRunScreen";
import { JobsScreen } from "../screens/JobsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AutomationScreen } from "../screens/AutomationScreen";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useAuth } from "../core/AuthContext";

const c = themes.dark;

/**
 * Wraps a screen in an error boundary so a malformed payload degrades to a recoverable fallback
 * instead of taking down the navigation tree.
 */
function boundary(screenName: string, Screen: React.ComponentType): React.ComponentType {
  return function BoundedScreen(): React.JSX.Element {
    return (
      <ErrorBoundary screenName={screenName}>
        <Screen />
      </ErrorBoundary>
    );
  };
}

/** Routes reachable without a session. */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

/** Routes reachable only with one. */
export type AppStackParamList = {
  Tabs: undefined;
  StudioDetail: { studioKey: string };
  StudioRun: { installationId: string; label: string; studioKey: string };
  Subscription: undefined;
  AdminGovernance: undefined;
  Console: undefined;
};

/** The tab destinations. */
export type TabParamList = {
  Studios: undefined;
  ChatStream: undefined;
  Jobs: undefined;
  Automation: undefined;
  Dashboard: undefined;
  Profile: undefined;
};

/**
 * The union every screen types its props against.
 *
 * One list rather than three because a screen should not have to know which stack hosts it — and
 * because `ResetPassword` is reachable from the auth flow while `Profile` is not.
 */
export type RootStackParamList = AuthStackParamList & AppStackParamList & TabParamList;

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const OrazakaDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: c.accent,
    background: c.surface0,
    card: c.surface1,
    text: c.textPrimary,
    border: c.surface3,
    notification: c.accent,
  },
};

function TabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.surface1 },
        headerTintColor: c.textPrimary,
        tabBarStyle: { backgroundColor: c.surface1, borderTopColor: c.surface3 },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
      }}
    >
      <Tab.Screen name="Studios" component={StudioCatalogueScreen} options={{ title: "Studios" }} />
      <Tab.Screen name="ChatStream" component={ChatStreamScreen} options={{ title: "Chat", headerShown: false }} />
      <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: "Jobs" }} />
      <Tab.Screen name="Automation" component={AutomationScreen} options={{ title: "Connecteurs" }} />
      <Tab.Screen
        name="Dashboard"
        component={boundary("Dashboard", DashboardScreen)}
        options={{ title: "Système" }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil" }} />
    </Tab.Navigator>
  );
}

export function AppNavigator(): React.JSX.Element {
  const { session, isRestoring } = useAuth();

  // The stored session is read asynchronously. Rendering the auth stack during that gap would
  // flash the login screen at an already-signed-in user on every cold start.
  if (isRestoring) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={OrazakaDarkTheme}>
      {session === null ? (
        <AuthStack.Navigator
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.surface0 } }}
        >
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </AuthStack.Navigator>
      ) : (
        <AppStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: c.surface1 },
            headerTintColor: c.textPrimary,
            contentStyle: { backgroundColor: c.surface0 },
          }}
        >
          <AppStack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <AppStack.Screen
            name="StudioDetail"
            component={StudioDetailScreen}
            options={{ title: "Studio" }}
          />
          <AppStack.Screen name="StudioRun" component={StudioRunScreen} options={{ title: "Run" }} />
          <AppStack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ title: "Abonnement" }}
          />
          <AppStack.Screen
            name="Console"
            component={boundary("Console", ConsoleScreen)}
            options={{ title: "Console" }}
          />
          <AppStack.Screen
            name="AdminGovernance"
            component={boundary("AdminGovernance", AdminGovernanceScreen)}
            options={{ title: "Gouvernance" }}
          />
        </AppStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface0,
  },
});
