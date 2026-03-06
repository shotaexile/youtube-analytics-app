import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, View, Image, StyleSheet, Animated, Dimensions } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { loadCustomCSV } from "@/lib/data/csv-store";
import { setCustomCSVContent } from "@/lib/data/csv-parser";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Icon appears with scale + fade
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Glow pulse
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Phase 3: Text fades in
      Animated.timing(textOpacityAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }).start(() => {
        // Phase 4: Hold then fade out entire splash
        setTimeout(() => {
          Animated.timing(fadeOutAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            onFinish();
          });
        }, 600);
      });
    });
  }, []);

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeOutAnim }]}>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            opacity: opacityAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, glowScale) },
            ],
          },
        ]}
      >
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.splashIcon}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={{ opacity: textOpacityAnim, alignItems: "center", marginTop: 24 }}>
        <Animated.Text style={styles.splashTitle}>ViewCore</Animated.Text>
        <Animated.Text style={styles.splashSubtitle}>YouTube Analytics</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#0a0a1a",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  iconWrapper: {
    shadowColor: "#4a90e2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  splashIcon: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 2,
  },
  splashSubtitle: {
    fontSize: 14,
    color: "#8899bb",
    marginTop: 4,
    letterSpacing: 1,
  },
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);
  const [showSplash, setShowSplash] = useState(Platform.OS !== "web");

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
    // Load custom CSV from AsyncStorage on startup
    loadCustomCSV().then((csv) => {
      if (csv) {
        setCustomCSVContent(csv);
      }
    });
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
            <Stack.Screen name="video/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="import" options={{ presentation: 'modal' }} />
            <Stack.Screen name="grade-videos" options={{ presentation: 'card' }} />
            <Stack.Screen name="unlisted-videos" options={{ presentation: 'card' }} />
          </Stack>
          <StatusBar style="light" />
        </QueryClientProvider>
      </trpc.Provider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
