import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chart.bar.fill": "bar-chart",
  "trophy.fill": "emoji-events",
  "chart.line.uptrend.xyaxis": "show-chart",
  "play.rectangle.fill": "video-library",
  "brain.head.profile": "psychology",
  "arrow.left": "arrow-back",
  "star.fill": "star",
  "flame.fill": "local-fire-department",
  "eye.fill": "visibility",
  "clock.fill": "schedule",
  "hand.thumbsup.fill": "thumb-up",
  "dollarsign.circle.fill": "attach-money",
  "arrow.up.right": "trending-up",
  "arrow.down.right": "trending-down",
  "minus": "remove",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.circle.fill": "error",
  "info.circle.fill": "info",
  "magnifyingglass": "search",
  "xmark": "close",
  "slider.horizontal.3": "tune",
  "play.fill": "play-arrow",
  "doc.fill": "description",
  "square.and.arrow.up": "share",
  "lock.fill": "lock",
  "person.badge.plus": "person-add",
  "arrow.clockwise": "refresh",
  "trash.fill": "delete",
  "link": "link",
  "video.fill": "videocam",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
