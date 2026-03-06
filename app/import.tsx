import { Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { trpc } from "@/lib/trpc";

export default function ImportScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const lastUploadQuery = trpc.analytics.getLastUpload.useQuery(undefined, { staleTime: 10_000 });
  const hasDataQuery = trpc.analytics.hasData.useQuery(undefined, { staleTime: 10_000 });
  const uploadCSVMutation = trpc.analytics.uploadCSV.useMutation();
  const utils = trpc.useUtils();

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setStatus('idle');
      setMessage('');

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const asset = result.assets[0];
      let csvContent: string;

      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        csvContent = await response.text();
      } else {
        csvContent = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      // Validate CSV structure
      const lines = csvContent.split('\n').filter(l => l.trim());
      if (lines.length < 3) {
        throw new Error('CSVファイルのデータが少なすぎます（最低2行のデータが必要です）');
      }

      const header = lines[0];
      if (!header.includes('コンテンツ') && !header.includes('動画のタイトル') && !header.includes('視聴回数')) {
        throw new Error('YouTubeアナリティクスのCSVファイルではありません。\n正しいファイルを選択してください。');
      }

      // Upload to DB (server-side, shared across all users)
      const uploadResult = await uploadCSVMutation.mutateAsync({ csvContent });

      // Invalidate all analytics queries so all screens refresh
      await utils.analytics.invalidate();

      setStatus('success');
      setMessage(`✅ ${uploadResult.videoCount}本の動画データをサーバーに保存しました\n\nチームメンバー全員のアプリに即時反映されます。`);

      // Refresh last upload info
      lastUploadQuery.refetch();
      hasDataQuery.refetch();

    } catch (err: any) {
      setStatus('error');
      setMessage(`❌ ${err.message || 'ファイルの読み込みに失敗しました'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const lastUpload = lastUploadQuery.data;
  const hasDbData = hasDataQuery.data === true;

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <ScreenContainer containerClassName="bg-[#F8F8F8]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: 'white', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
            <IconSymbol name="chevron.right" size={18} color="#0F0F0F" style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F0F0F' }}>CSVデータ更新</Text>
            <Text style={{ fontSize: 11, color: '#606060', marginTop: 1 }}>チーム全員に即時反映</Text>
          </View>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          {/* DB Status Card */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 12 }}>サーバーデータ状態</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: hasDbData ? '#F0FDF4' : '#FFF5F5', borderRadius: 12, marginBottom: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: hasDbData ? '#22C55E' : '#F59E0B' }} />
              <Text style={{ fontSize: 13, color: hasDbData ? '#16A34A' : '#D97706', fontWeight: '600', flex: 1 }}>
                {hasDbData ? 'サーバーDBにデータあり（チーム共有中）' : 'サーバーDBにデータなし（デフォルトデータを表示中）'}
              </Text>
            </View>
            {lastUpload && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>最終更新</Text>
                <Text style={{ fontSize: 12, color: '#606060', fontWeight: '600' }}>
                  {formatDate(lastUpload.createdAt)} · {lastUpload.videoCount}本
                </Text>
              </View>
            )}
          </View>

          {/* Team Sync Explanation */}
          <View style={{ backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#BFDBFE' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 16 }}>🔄</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E40AF' }}>チーム共有の仕組み</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#1E40AF', lineHeight: 20 }}>
              CSVをアップロードすると、サーバーのデータベースに保存されます。チームメンバーがアプリを開くと、自動的に最新データが表示されます。
            </Text>
          </View>

          {/* Import Instructions */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0F0F', marginBottom: 12 }}>CSVファイルの取得方法</Text>
            {[
              { step: '1', text: 'YouTube Studioにアクセス' },
              { step: '2', text: '「アナリティクス」→「詳細モード」を開く' },
              { step: '3', text: '「動画」タブを選択' },
              { step: '4', text: '右上の「エクスポート」→「CSV形式でダウンロード」' },
              { step: '5', text: 'ダウンロードしたCSVファイルをこのアプリで読み込む' },
            ].map(item => (
              <View key={item.step} style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, color: 'white', fontWeight: '800' }}>{item.step}</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#444', flex: 1, lineHeight: 22 }}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Status Message */}
          {message !== '' && (
            <View style={{
              backgroundColor: status === 'success' ? '#F0FDF4' : '#FFF5F5',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: status === 'success' ? '#86EFAC' : '#FCA5A5',
            }}>
              <Text style={{ fontSize: 13, color: status === 'success' ? '#16A34A' : '#DC2626', fontWeight: '600', lineHeight: 20 }}>{message}</Text>
              {status === 'success' && (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ marginTop: 10, backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 14, color: 'white', fontWeight: '700' }}>ダッシュボードに戻る</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Import Button */}
          <TouchableOpacity
            onPress={handleImport}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#9CA3AF' : '#FF0000',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#FF0000',
              shadowOpacity: isLoading ? 0 : 0.3,
              shadowRadius: 8,
              elevation: isLoading ? 0 : 4,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <IconSymbol name="paperplane.fill" size={18} color="white" />
            )}
            <Text style={{ fontSize: 16, color: 'white', fontWeight: '800' }}>
              {isLoading ? 'サーバーに保存中...' : 'CSVを選択してチームに共有'}
            </Text>
          </TouchableOpacity>

          {/* Note */}
          <View style={{ backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FDE68A' }}>
            <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>
              📌 アップロードしたデータはサーバーに保存され、チームメンバー全員のアプリに即時反映されます。新しいCSVをアップロードすると前のデータは上書きされます。
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
