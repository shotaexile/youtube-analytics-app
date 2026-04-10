import { View, Text, TouchableOpacity, Switch, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeContext } from "@/lib/theme-provider";
import { Colors } from "@/constants/theme";
import type { ColorScheme } from "@/constants/theme";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { setColorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const handleToggleTheme = () => {
    setColorScheme(isDark ? "light" : "dark");
  };

  const handleSetLight = () => setColorScheme("light");
  const handleSetDark = () => setColorScheme("dark");

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>設定</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>アプリの表示設定を管理</Text>
        </View>

        {/* Appearance Section */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, letterSpacing: 0.5, marginBottom: 8 }}>
            外観
          </Text>
        </View>

        <View style={{
          marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: colors.border,
          overflow: "hidden",
          marginBottom: 20,
        }}>
          {/* Dark mode toggle row */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: isDark ? "#1E293B" : "#FEF3C7",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}>
              <IconSymbol
                name={isDark ? "moon.fill" : "sun.max.fill"}
                size={18}
                color={isDark ? "#93C5FD" : "#F59E0B"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                ダークモード
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
                {isDark ? "ダークモードが有効です" : "ライトモードが有効です"}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggleTheme}
              trackColor={{ false: colors.border, true: "#FF0000" }}
              thumbColor={isDark ? "#fff" : "#fff"}
            />
          </View>

          {/* Theme selection buttons */}
          <View style={{ padding: 12, gap: 8 }}>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4, paddingHorizontal: 4 }}>
              テーマを選択
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* Light mode button */}
              <TouchableOpacity
                onPress={handleSetLight}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: colorScheme === "light" ? 2 : 1,
                  borderColor: colorScheme === "light" ? "#FF0000" : colors.border,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <IconSymbol name="sun.max.fill" size={20} color="#F59E0B" />
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colorScheme === "light" ? "#FF0000" : "#374151",
                }}>
                  ライト
                </Text>
                {colorScheme === "light" && (
                  <View style={{ position: "absolute", top: 6, right: 6 }}>
                    <IconSymbol name="checkmark.circle.fill" size={14} color="#FF0000" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Dark mode button */}
              <TouchableOpacity
                onPress={handleSetDark}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: colorScheme === "dark" ? 2 : 1,
                  borderColor: colorScheme === "dark" ? "#FF0000" : colors.border,
                  backgroundColor: "#1E293B",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <IconSymbol name="moon.fill" size={20} color="#93C5FD" />
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colorScheme === "dark" ? "#FF0000" : "#E2E8F0",
                }}>
                  ダーク
                </Text>
                {colorScheme === "dark" && (
                  <View style={{ position: "absolute", top: 6, right: 6 }}>
                    <IconSymbol name="checkmark.circle.fill" size={14} color="#FF0000" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* App info section */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, letterSpacing: 0.5, marginBottom: 8 }}>
            アプリ情報
          </Text>
        </View>
        <View style={{
          marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: colors.border,
          overflow: "hidden",
          marginBottom: 40,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "500" }}>ViewCore</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>YouTube Analytics</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted }}>v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
