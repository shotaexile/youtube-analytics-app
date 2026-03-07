import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // CONTENT_HEIGHT = the visible area for icon + label (above the home indicator)
  // Increase this so the icon+label sit comfortably above the bottom bezel.
  const CONTENT_HEIGHT = Platform.OS === "web" ? 52 : 62;
  const bottomInset = Platform.OS === "web" ? 0 : Math.max(insets.bottom, 20);
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
          fontSize: 9,
          fontWeight: "500",
          lineHeight: 11,
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
      <Tabs.Screen
        name="ideas"
        options={{
          title: "企画提案",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="lightbulb.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
