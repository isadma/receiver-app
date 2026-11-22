import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, getStats, resetDemo } from '../src/api';
import { Button } from '../src/components/Button';
import { useApi } from '../src/context/ApiContext';
import { useLocale } from '../src/context/LocaleContext';
import { colors, radius, space } from '../src/theme';
import type { Locale } from '../src/i18n/translations';
import type { ShopQty, Stats } from '../src/types';

const SHOP_LABELS: { slug: keyof Stats['shops']; name: string }[] = [
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'noon', name: 'Noon' },
  { slug: 'namshi', name: 'Namshi' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useLocale();
  const { baseUrl, ready } = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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

  const runReset = async () => {
    setResetting(true);
    setError(null);

    try {
      await resetDemo(baseUrl);
      setConfirmReset(false);
      await loadStats();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('resetDemoFailed'));
    } finally {
      setResetting(false);
    }
  };

  const languages: { id: Locale; label: string }[] = [
    { id: 'ru', label: t('russian') },
    { id: 'en', label: t('english') },
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <Button label={t('receive')} variant="receive" onPress={() => router.push('/receive')} />
      <Button label={t('data')} variant="data" onPress={() => router.push('/data')} />

      <Text style={styles.lede}>{t('homeLede')}</Text>

      <Text style={styles.section}>{t('mapping')}</Text>
      <View style={styles.stats}>
        <StatCard label={t('mapped')} value={stats?.mapped} tone="mapped" />
        <StatCard label={t('pending')} value={stats?.pending} tone="pending" />
      </View>

      <Text style={styles.section}>{t('units')}</Text>
      <View style={styles.stats}>
        <StatCard label={t('received')} value={stats?.received_qty} tone="mapped" />
        <StatCard label={t('expected')} value={stats?.expected_qty} tone="total" />
        <StatCard label={t('remaining')} value={stats?.remaining_qty} tone="pending" />
      </View>

      <Text style={styles.section}>{t('shops')}</Text>
      {SHOP_LABELS.map((shop) => (
        <ShopCard
          key={shop.slug}
          name={shop.name}
          qty={stats?.shops[shop.slug]}
          receivedExpected={
            stats
              ? t('shopReceivedExpected', {
                  received: stats.shops[shop.slug].received_qty,
                  expected: stats.shops[shop.slug].expected_qty,
                })
              : '—'
          }
          remaining={
            stats
              ? t('shopRemainingCount', { remaining: stats.shops[shop.slug].remaining_qty })
              : ''
          }
        />
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={t('resetDemo')}
        variant="danger"
        loading={resetting}
        onPress={() => setConfirmReset(true)}
      />

      <Text style={styles.section}>{t('language')}</Text>
      <View style={styles.stats}>
        {languages.map((item) => {
          const selected = locale === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => void setLocale(item.id)}
              style={[styles.langButton, selected && styles.langSelected]}
            >
              <Text style={[styles.langLabel, selected && styles.langLabelSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={confirmReset}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!resetting) {
            setConfirmReset(false);
          }
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t('resetDemoTitle')}</Text>
            <Text style={styles.confirmBody}>{t('resetDemoBody')}</Text>
            <Button
              label={t('resetDemo')}
              variant="danger"
              loading={resetting}
              onPress={() => void runReset()}
            />
            <Button
              label={t('cancel')}
              variant="ghost"
              disabled={resetting}
              onPress={() => setConfirmReset(false)}
            />
          </View>
        </View>
      </Modal>
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
      <Text
        style={styles.cardLabel}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Text>
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

function ShopCard({
  name,
  qty,
  receivedExpected,
  remaining,
}: {
  name: string;
  qty: ShopQty | undefined;
  receivedExpected: string;
  remaining: string;
}) {
  return (
    <View style={styles.shopCard}>
      <Text style={styles.shopName}>{name}</Text>
      <Text style={styles.shopQty}>{qty ? receivedExpected : '—'}</Text>
      <Text style={styles.shopRemaining}>{qty ? remaining : ''}</Text>
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
  langButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSelected: {
    borderColor: colors.receive,
    backgroundColor: '#DCEFE3',
  },
  langLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  langLabelSelected: {
    color: colors.receive,
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
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.lg,
  },
  confirmCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  confirmTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  confirmBody: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: space.xs,
  },
});
