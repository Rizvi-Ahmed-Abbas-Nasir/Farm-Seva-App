import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Platform, LogBox } from "react-native";
import { notificationService } from "@/app/lib/notificationService";

// Ignore specific warnings that are benign on web
LogBox.ignoreLogs([
  "Invalid DOM property `transform-origin`",
  "Unknown event handler property `onStartShouldSetResponder`",
  "Unknown event handler property `onResponderTerminationRequest`",
  "Unknown event handler property `onResponderGrant`",
  "Unknown event handler property `onResponderMove`",
  "Unknown event handler property `onResponderRelease`",
  "Unknown event handler property `onResponderTerminate`",
]);

export default function RootLayout() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("userToken");

      // Initialize notification service
      await notificationService.initialize();

      setTimeout(() => {
        if (token) {
          router.replace("/(tabs)");
        } else {
          router.replace("/auth");
        }
        setLoading(false);
      }, 1);
    };

    checkAuth();
  }, []);

  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chatbot" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </LanguageProvider>
  );
}
