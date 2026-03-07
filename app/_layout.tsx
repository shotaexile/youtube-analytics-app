import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, View, Image, StyleSheet, Animated, Dimensions, Text, TextInput, TouchableOpacity, KeyboardAvoidingView } from "react-native";
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
import { usePushNotificationSetup } from "@/lib/data/use-push-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

// Read CSS env(safe-area-inset-*) values injected by the browser for PWA standalone mode
function getWebSafeAreaInsets(): EdgeInsets {
  if (typeof window === "undefined" || typeof document === "undefined") return DEFAULT_WEB_INSETS;
  try {
    const style = getComputedStyle(document.documentElement);
    const parse = (v: string) => parseFloat(v) || 0;
    return {
      top: parse(style.getPropertyValue("--sat")),
      right: parse(style.getPropertyValue("--sar")),
      bottom: parse(style.getPropertyValue("--sab")),
      left: parse(style.getPropertyValue("--sal")),
    };
  } catch {
    return DEFAULT_WEB_INSETS;
  }
}
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Password ────────────────────────────────────────────────────────────────
const CORRECT_PASSWORD = "0329";
const AUTH_STORAGE_KEY = "viewcore_auth_v2";

function PasswordScreen({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake] = useState(new Animated.Value(0));
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (input === CORRECT_PASSWORD) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, "true");
      onUnlock();
    } else {
      setError(true);
      setInput("");
      triggerShake();
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={pwStyles.container}
    >
      <Animated.View style={[pwStyles.inner, { opacity: fadeIn }]}>
        {/* Logo */}
        <Image
          source={require("@/assets/images/icon.png")}
          style={pwStyles.logo}
          resizeMode="contain"
        />
        <Text style={pwStyles.appName}>ViewCore</Text>
        <Text style={pwStyles.subtitle}>YouTube Analytics</Text>

        {/* Input area */}
        <Animated.View style={[pwStyles.inputWrapper, { transform: [{ translateX: shake }] }]}>
          <TextInput
            style={[pwStyles.input, error && pwStyles.inputError]}
            placeholder="パスワードを入力"
            placeholderTextColor="#8899bb"
            value={input}
            onChangeText={(t) => { setInput(t); setError(false); }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {error && (
            <Text style={pwStyles.errorText}>パスワードが違います</Text>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[pwStyles.button, input.length === 0 && pwStyles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={input.length === 0}
          activeOpacity={0.8}
        >
          <Text style={pwStyles.buttonText}>ログイン</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const pwStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#8899bb",
    letterSpacing: 1,
    marginBottom: 48,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    height: 52,
    backgroundColor: "#1a1f35",
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 18,
    color: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#2a3050",
    letterSpacing: 4,
    textAlign: "center",
  },
  inputError: {
    borderColor: "#FF4444",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#FF0000",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: "#3a1a1a",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
});

// ─── Splash ───────────────────────────────────────────────────────────────────
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

function PushNotificationSetup() {
  usePushNotificationSetup();
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}

function RootLayoutInner() {
  const { isAuthenticated, login } = useAuth();
  const initialInsets = Platform.OS === "web"
    ? getWebSafeAreaInsets()
    : (initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS);
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

    // Also update safe area on resize (covers PWA orientation changes)
    const handleResize = () => {
      const webInsets = getWebSafeAreaInsets();
      const webFrame = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
      setInsets(webInsets);
      setFrame(webFrame);
    };
    window.addEventListener("resize", handleResize);
    // Run once after mount so CSS env() values are resolved
    setTimeout(handleResize, 100);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
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
    // For web (including PWA), use the CSS env() safe area values directly
    // For native, fall back to initialWindowMetrics with minimum padding
    if (Platform.OS === "web") {
      return {
        insets,
        frame: {
          x: 0,
          y: 0,
          width: typeof window !== "undefined" ? window.innerWidth : 390,
          height: typeof window !== "undefined" ? window.innerHeight : 844,
        },
      };
    }
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [insets, initialInsets, initialFrame]);

  // While checking auth state, show nothing (or a brief blank screen)
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a1a" }} />
    );
  }

  // Not authenticated → show password screen
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <PasswordScreen onUnlock={() => login()} />
      </ThemeProvider>
    );
  }

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <PushNotificationSetup />
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
