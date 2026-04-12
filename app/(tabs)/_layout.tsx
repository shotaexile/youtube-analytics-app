import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useYoutubeSubNav, YoutubeTab } from "@/lib/youtube-subnav-context";

function getWebBottomInset(): number {
  if (typeof window === "undefined" || typeof document === "undefined") return 0;
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue("--sab");
    return parseFloat(val) || 0;
  } catch {
    return 0;
  }
}

const YOUTUBE_TABS: { key: YoutubeTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'TOP', icon: '🏠' },
  { key: 'rankings', label: 'ランキング', icon: '🏆' },
  { key: 'charts', label: 'グラフ', icon: '📈' },
  { key: 'videos', label: '動画', icon: '🎥' },
  { key: 'ai', label: 'AI分析', icon: '🤖' },
  { key: 'early-stats', label: '初速', icon: '⚡' },
];

function YoutubeSubNavBar() {
  const { activeTab, setActiveTab } = useYoutubeSubNav();
  const colors = useColors();

  return (
    <View style={[subNavStyles.wrapper, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={subNavStyles.content}
      >
        {YOUTUBE_TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[
                subNavStyles.item,
                isActive && subNavStyles.itemActive,
              ]}
            >
              <Text style={subNavStyles.icon}>{t.icon}</Text>
              <Text
                style={[
                  subNavStyles.label,
                  isActive && subNavStyles.labelActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const subNavStyles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 0.5,
    paddingVertical: 6,
  },
  content: {
    paddingHorizontal: 10,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  itemActive: {
    backgroundColor: '#FF0000',
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#606060',
  },
  labelActive: {
    color: '#fff',
  },
});

function CustomTabBar(props: any) {
  // Check if current route is the YouTube (index) tab
  const currentRoute = props.state?.routes?.[props.state?.index]?.name;
  const isOnYoutubeTab = currentRoute === 'index';

  const colors = useColors();
  const insets = useSafeAreaInsets();
  const CONTENT_HEIGHT = 52;
  const webBottomInset = Platform.OS === "web" ? Math.max(getWebBottomInset(), insets.bottom) : 0;
  const bottomInset = Platform.OS === "web" ? webBottomInset : Math.max(insets.bottom, 20);

  return (
    <View style={{ backgroundColor: colors.background }}>
      {isOnYoutubeTab && <YoutubeSubNavBar />}
      <View
        style={{
          height: CONTENT_HEIGHT + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: isOnYoutubeTab ? 0 : 0.5,
          flexDirection: 'row',
        }}
      >
        {props.state.routes.map((route: any, index: number) => {
          const { options } = props.descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = props.state.index === index;

          // Skip hidden tabs (href: null)
          if (options.href === null) return null;

          const onPress = () => {
            const event = props.navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              props.navigation.navigate(route.name, route.params);
            }
          };

          const color = isFocused ? '#FF0000' : colors.muted;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.7}
            >
              {options.tabBarIcon?.({ color, size: 24, focused: isFocused })}
              <Text style={{ fontSize: 10, fontWeight: '600', color, marginTop: 2, lineHeight: 14 }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
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
