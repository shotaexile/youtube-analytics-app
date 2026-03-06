import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChannelConfig {
  channelId: string;
  channelName: string;
  channelUrl: string;
  iconUrl: string;
}

const DEFAULT_CONFIG: ChannelConfig = {
  channelId: 'UCkBhHqCG4N8nOBxBMt4LLIQ', // 三崎優太のチャンネルID
  channelName: '三崎優太',
  channelUrl: 'https://www.youtube.com/@yuuta.misaki',
  iconUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_mRQCpKQBUYqJCYfGMvVSKzYjJvJb5bqFOhNRQWlw=s176-c-k-c0x00ffffff-no-rj',
};

const STORAGE_KEY = 'channel_config';

export async function getChannelConfig(): Promise<ChannelConfig> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_CONFIG;
}

export async function saveChannelConfig(config: Partial<ChannelConfig>): Promise<void> {
  try {
    const current = await getChannelConfig();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...config }));
  } catch (e) {
    // ignore
  }
}

// YouTube channel URL → channel ID を抽出するユーティリティ
export function extractChannelId(url: string): string | null {
  // https://www.youtube.com/channel/UCxxxxxx
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelMatch) return channelMatch[1];
  // https://www.youtube.com/@handle
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) return `@${handleMatch[1]}`;
  return null;
}

// YouTube channel icon URL を生成する（channel IDから）
export function getChannelIconUrl(channelId: string): string {
  if (channelId.startsWith('UC')) {
    // 公式のYouTubeチャンネルアイコンURLパターン
    return `https://yt3.googleusercontent.com/ytc/AIdro_mRQCpKQBUYqJCYfGMvVSKzYjJvJb5bqFOhNRQWlw=s176-c-k-c0x00ffffff-no-rj`;
  }
  return '';
}
