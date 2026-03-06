/**
 * CSV Store - CSVデータの永続化管理
 * AsyncStorageにカスタムCSVデータを保存し、デフォルトデータを上書きする
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_CSV_KEY = 'custom_analytics_csv';

export async function saveCustomCSV(csvContent: string): Promise<void> {
  await AsyncStorage.setItem(CUSTOM_CSV_KEY, csvContent);
}

export async function loadCustomCSV(): Promise<string | null> {
  return await AsyncStorage.getItem(CUSTOM_CSV_KEY);
}

export async function clearCustomCSV(): Promise<void> {
  await AsyncStorage.removeItem(CUSTOM_CSV_KEY);
}

export async function hasCustomCSV(): Promise<boolean> {
  const val = await AsyncStorage.getItem(CUSTOM_CSV_KEY);
  return val !== null && val.length > 0;
}
