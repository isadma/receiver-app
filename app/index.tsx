import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, getStats } from '../src/api';
import { Button } from '../src/components/Button';
import { useApi } from '../src/context/ApiContext';
import { useLocale } from '../src/context/LocaleContext';
import { colors, radius, space } from '../src/theme';
import type { Stats } from '../src/types';

const SHOP_LABELS: { slug: keyof Stats['shops']; name: string }[] = [
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'noon', name: 'Noon' },
  { slug: 'namshi', name: 'Namshi' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { baseUrl, ready } = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);

    try {
      setStats(await getStats(baseUrl));
    } catch (caught) {
      setStats(null);
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadStats'));
    }
  }, [baseUrl, t]);

  useFocusEffect(
    useCallback(() => {
      if (!ready) {
        return;
      }

      void loadStats();
    }, [loadStats, ready]),
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <Button label={t('receiveLot')} variant="receive" onPress={() => router.push('/receive')} />
      <Button
        label={t('receiveItem')}
        variant="receive"
        onPress={() => router.push('/receive-item')}
      />
      <Button label={t('data')} variant="data" onPress={() => router.push('/data')} />

      <Text style={styles.lede}>{t('homeLede')}</Text>

      <View style={styles.stats}>
        <StatCard label={t('received')} value={stats?.received_qty} tone="mapped" />
        <StatCard label={t('lots')} value={stats?.lots} tone="total" />
        <StatCard label={t('sizes')} value={stats?.items} tone="total" />
      </View>

      <Text style={styles.section}>{t('shops')}</Text>
      {SHOP_LABELS.map((shop) => (
        <View key={shop.slug} style={styles.shopCard}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopQty}>
            {stats
              ? t('shopReceivedCount', { received: stats.shops[shop.slug].received_qty })
              : '—'}
          </Text>
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | undefined;
  tone: 'mapped' | 'total';
}) {
  return (
    <View style={styles.card}>
      <Text
        style={styles.cardLabel}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Text>
      <Text style={[styles.cardValue, tone === 'mapped' && { color: colors.mapped }]}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.md,
  },
  lede: {
    fontSize: 20,
    lineHeight: 28,
    color: colors.muted,
    marginBottom: space.sm,
  },
  section: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: space.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: space.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    minHeight: 96,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  cardValue: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  shopCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  shopQty: {
    marginTop: 4,
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
