/**
 * Push notification registration hook for ViewCore
 *
 * Registers the device's Expo push token with the server so that
 * when a new CSV is uploaded, all registered devices receive a notification.
 *
 * NOTE: Push notifications only work on physical devices (not simulators/web).
 * In Expo Go on Android SDK 53+, push notifications require a development build.
 * Local (in-app) notifications still work in Expo Go.
 */
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { trpc } from "@/lib/trpc";

// Configure how notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  // Set up Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("viewcore-updates", {
      name: "ViewCore データ更新",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4a90e2",
    });
  }

  // Physical device check
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Get Expo push token
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      // In Expo Go without EAS projectId, use device token directly
      const token = await Notifications.getDevicePushTokenAsync();
      return token.data as string;
    }
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    console.warn("Failed to get push token:", e);
    return null;
  }
}

/**
 * Hook that registers the device for push notifications and stores the token in DB.
 * Call this once at app startup (e.g., in _layout.tsx or the main screen).
 */
export function usePushNotificationSetup() {
  const registerMutation = trpc.analytics.registerPushToken.useMutation();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Register device and save token to server
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        const deviceName = Device.deviceName || Device.modelName || "Unknown Device";
        registerMutation.mutate({ token, deviceName });
      }
    });

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification.request.content.title);
      }
    );

    // Listen for notification tap responses
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.type === "csv_update") {
          // Could navigate to dashboard or refresh data
          console.log("CSV update notification tapped");
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
