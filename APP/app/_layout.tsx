import React from "react";
import { Stack, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { ThemeProvider, useTheme } from "../context/themeContext";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, AuthContext } from "../context/authContext"; // Import AuthProvider
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <MainLayout />
        </GestureHandlerRootView>
      </ThemeProvider>
    </AuthProvider>
  );
}

function MainLayout() {
  const router = useRouter();
  const theme = useTheme();
  const authContext = useContext(AuthContext);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authContext) return;

      if (authContext.user === undefined) {
        console.log("⏳ User data is still loading...");
        return;
      }

      setCheckingAuth(false);

      if (authContext.user === null) {
        console.log("🔴 No user found, redirecting to login...");

        // Use setTimeout to ensure router updates
        setTimeout(() => {
          if (router) {
            router.replace("/(auth)/login"); // or try router.push("/(auth)/login")
          }
        }, 500);
      } else {
        console.log("✅ User found, redirecting to home...");
        setTimeout(() => {
          if (router) {
            router.replace("/(tabs)");
          }
        }, 500);
      }
    };

    checkAuth();
  }, [authContext?.user]);

  if (checkingAuth) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} backgroundColor={theme.header} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ title: "Main Tabs" }} />
        <Stack.Screen name="notification" options={{ title: "Notifications" }} />
      </Stack>
    </>
  );
}
