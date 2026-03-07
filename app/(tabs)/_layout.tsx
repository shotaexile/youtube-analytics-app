import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // On iOS, the tab bar sits above the home indicator.
  // We set a fixed content height (icon + label) and add the safe area bottom separately.
  // This ensures the label is never clipped by the home indicator area.
  const CONTENT_HEIGHT = 50; // icon(22) + gap(4) + label(11) + paddingTop(6) + some slack
  const bottomInset = Platform.OS === "web" ? 0 : insets.bottom;
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
          paddingTop: 6,
          // Push content up above the home indicator
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
    </Tabs>
  );
}
