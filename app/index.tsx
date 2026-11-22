import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, getStats } from '../src/api';
import { Button } from '../src/components/Button';
import { useApi } from '../src/context/ApiContext';
import { DEFAULT_API_URL } from '../src/storage';
import { colors, radius, space } from '../src/theme';
import type { ShopQty, Stats } from '../src/types';

const SHOP_LABELS: { slug: keyof Stats['shops']; name: string }[] = [
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'noon', name: 'Noon' },
  { slug: 'namshi', name: 'Namshi' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { baseUrl, ready, setBaseUrl } = useApi();
  const [urlDraft, setUrlDraft] = useState(baseUrl);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingUrl, setSavingUrl] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!ready) {
        return;
      }

      setUrlDraft(baseUrl);
      let cancelled = false;
      setError(null);

      getStats(baseUrl)
        .then((next) => {
          if (!cancelled) {
            setStats(next);
          }
        })
        .catch((caught) => {
          if (!cancelled) {
            setStats(null);
            setError(caught instanceof ApiError ? caught.displayMessage : 'Could not load stats.');
          }
        });

      return () => {
        cancelled = true;
      };
    }, [baseUrl, ready]),
  );

  const saveUrl = async () => {
    setSavingUrl(true);
    try {
      await setBaseUrl(urlDraft);
    } finally {
      setSavingUrl(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.lede}>Sort warehouse labels into a shop and map new barcodes.</Text>

      <Text style={styles.section}>Mapping</Text>
      <View style={styles.stats}>
        <StatCard label="Mapped" value={stats?.mapped} tone="mapped" />
        <StatCard label="Pending" value={stats?.pending} tone="pending" />
      </View>

      <Text style={styles.section}>Units</Text>
      <View style={styles.stats}>
        <StatCard label="Received" value={stats?.received_qty} tone="mapped" />
        <StatCard label="Expected" value={stats?.expected_qty} tone="total" />
        <StatCard label="Remaining" value={stats?.remaining_qty} tone="pending" />
      </View>

      <Text style={styles.section}>Shops</Text>
      {SHOP_LABELS.map((shop) => (
        <ShopCard key={shop.slug} name={shop.name} qty={stats?.shops[shop.slug]} />
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Receive" variant="receive" onPress={() => router.push('/receive')} />
      <Button label="Data" variant="data" onPress={() => router.push('/data')} />

      <Text style={styles.apiLabel}>API address</Text>
      <TextInput
        value={urlDraft}
        onChangeText={setUrlDraft}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder={DEFAULT_API_URL}
        placeholderTextColor={colors.muted}
        style={styles.apiInput}
      />
      <Button
        label="Save API address"
        variant="ghost"
        loading={savingUrl}
        disabled={urlDraft.trim() === baseUrl}
        onPress={() => void saveUrl()}
      />
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
  tone: 'mapped' | 'pending' | 'total';
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text
        style={[
          styles.cardValue,
          tone === 'mapped' && { color: colors.mapped },
          tone === 'pending' && { color: colors.pending },
        ]}
      >
        {value ?? '—'}
      </Text>
    </View>
  );
}

function ShopCard({ name, qty }: { name: string; qty: ShopQty | undefined }) {
  return (
    <View style={styles.shopCard}>
      <Text style={styles.shopName}>{name}</Text>
      <Text style={styles.shopQty}>
        {qty ? `${qty.received_qty} received / ${qty.expected_qty} expected` : '—'}
      </Text>
      <Text style={styles.shopRemaining}>
        {qty ? `${qty.remaining_qty} remaining` : ''}
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
    padding: space.md,
    minHeight: 96,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  shopRemaining: {
    marginTop: 2,
    fontSize: 14,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  apiLabel: {
    marginTop: space.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  apiInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
  },
});
