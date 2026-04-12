import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

function getWebBottomInset(): number {
  if (typeof window === "undefined" || typeof document === "undefined") return 0;
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue("--sab");
    return parseFloat(val) || 0;
  } catch {
    return 0;
  }
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const CONTENT_HEIGHT = 52;
  const webBottomInset = Platform.OS === "web" ? Math.max(getWebBottomInset(), insets.bottom) : 0;
  const bottomInset = Platform.OS === "web" ? webBottomInset : Math.max(insets.bottom, 20);
  const tabBarHeight = CONTENT_HEIGHT + bottomInset;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF0000",
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomInset,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          lineHeight: 12,
          letterSpacing: -0.3,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          height: CONTENT_HEIGHT,
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 2,
        },
        tabBarAllowFontScaling: false,
      }}
    >
      {/* YouTube タブ（メイン） */}
      <Tabs.Screen
        name="index"
        options={{
          title: "YouTube",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="play.rectangle.fill" color={color} />,
        }}
      />
      {/* AI タブ */}
      <Tabs.Screen
        name="ideas"
        options={{
          title: "AI",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="brain.head.profile" color={color} />,
        }}
      />
      {/* 設定タブ */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "設定",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="gear" color={color} />,
        }}
      />
      {/* 非表示タブ（YouTubeタブ内サブナビから呼ばれる） */}
      <Tabs.Screen name="rankings" options={{ href: null }} />
      <Tabs.Screen name="charts" options={{ href: null }} />
      <Tabs.Screen name="videos" options={{ href: null }} />
      <Tabs.Screen name="ai" options={{ href: null }} />
      <Tabs.Screen name="early-stats" options={{ href: null }} />
    </Tabs>
  );
}
