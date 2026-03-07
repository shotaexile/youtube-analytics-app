import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // On web: fixed compact height. On native: icon(24) + label(12) + paddingTop(8) + paddingBottom + safeArea
  const bottomPadding = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 16);
  // 8 paddingTop + 24 icon + 4 gap + 14 label + bottomPadding
  const tabBarHeight = Platform.OS === "web" ? 60 : 50 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF0000",
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          lineHeight: 14,
          marginTop: 2,
          marginBottom: 0,
          includeFontPadding: false,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ダッシュボード",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: "ランキング",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="trophy.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: "グラフ",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: "動画一覧",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="play.rectangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI分析",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="brain.head.profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
