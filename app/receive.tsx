import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, getShops, receiveLot } from '../src/api';
import { Button } from '../src/components/Button';
import { CameraScanner } from '../src/components/CameraScanner';
import { SuccessNotice } from '../src/components/SuccessNotice';
import { useApi } from '../src/context/ApiContext';
import { useLocale } from '../src/context/LocaleContext';
import { useSettings } from '../src/context/SettingsContext';
import { loadSelectedShop, saveSelectedShop } from '../src/storage';
import { colors, radius, space } from '../src/theme';
import type { ReceiveResult, Shop } from '../src/types';

export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { allowSameLotScan } = useSettings();
  const { baseUrl } = useApi();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReceiveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedBarcode, setFailedBarcode] = useState<string | null>(null);
  const [lotMissing, setLotMissing] = useState(false);
  const [lotDuplicate, setLotDuplicate] = useState(false);
  const [notice, setNotice] = useState<ReceiveResult | null>(null);
  const noticeDone = useRef<(() => void) | null>(null);

  const showNotice = (next: ReceiveResult): Promise<void> => {
    return new Promise((resolve) => {
      noticeDone.current = resolve;
      setNotice(next);
    });
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      Promise.all([getShops(baseUrl), loadSelectedShop()])
        .then(([nextShops, savedSlug]) => {
          if (cancelled) {
            return;
          }

          setShops(nextShops);
          setShop((current) => {
            const selectedSlug = current?.slug ?? savedSlug;
            return nextShops.find((item) => item.slug === selectedSlug) ?? current ?? null;
          });
        })
        .catch((caught) => {
          if (!cancelled) {
            setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadShops'));
          }
        });

      return () => {
        cancelled = true;
      };
    }, [baseUrl, t]),
  );

  const selectShop = (next: Shop) => {
    setShop(next);
    setError(null);
    setFailedBarcode(null);
    setLotMissing(false);
    setLotDuplicate(false);
    void saveSelectedShop(next.slug);
  };

  const resetForNext = () => {
    setManualBarcode('');
    setResult(null);
    setError(null);
    setFailedBarcode(null);
    setLotMissing(false);
    setLotDuplicate(false);
  };

  const handleBarcode = async (raw: string) => {
    const barcode = raw.trim().toUpperCase();
    setCameraOpen(false);

    if (!shop) {
      setError(t('selectShopFirst'));
      return;
    }

    if (!barcode) {
      setError(t('enterBarcodeFirst'));
      return;
    }

    setBusy(true);
    setError(null);
    setFailedBarcode(null);
    setLotMissing(false);
    setLotDuplicate(false);
    setResult(null);

    try {
      const received = await receiveLot(baseUrl, barcode, shop.slug, allowSameLotScan);
      setResult(received);
      setManualBarcode('');
      await showNotice(received);
    } catch (caught) {
      const notFound = caught instanceof ApiError && caught.status === 404;
      const duplicate = caught instanceof ApiError && caught.status === 409;
      setFailedBarcode(barcode);
      setLotMissing(notFound);
      setLotDuplicate(duplicate);
      setManualBarcode(barcode);
      setError(
        notFound
          ? t('lotNotFoundBody')
          : duplicate
            ? t('lotAlreadyReceivedBody')
            : caught instanceof ApiError
              ? caught.displayMessage
              : t('couldNotLookup'),
      );
    } finally {
      setBusy(false);
    }
  };

  const shopReady = shop !== null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>{t('shop')}</Text>
        <View style={styles.shops}>
          {shops.map((item) => {
            const selected = shop?.slug === item.slug;
            return (
              <Pressable
                key={item.id}
                onPress={() => selectShop(item)}
                style={[styles.shopButton, selected && styles.shopSelected]}
              >
                <Text style={[styles.shopLabel, selected && styles.shopLabelSelected]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!shopReady ? <Text style={styles.hint}>{t('selectShop')}</Text> : null}

        <Text style={styles.title}>{t('scanTitle')}</Text>
        <Text style={styles.body}>
          {t('scanBody', { shop: shop?.name ?? t('theSelectedShop') })}
        </Text>

        <Button
          label={t('openCamera')}
          variant="receive"
          disabled={!shopReady || busy}
          loading={busy}
          onPress={() => {
            setError(null);
            setFailedBarcode(null);
            setLotMissing(false);
            setLotDuplicate(false);
            setCameraOpen(true);
          }}
        />

        <Text style={styles.or}>{t('damagedBarcode')}</Text>
        <TextInput
          value={manualBarcode}
          onChangeText={setManualBarcode}
          placeholder={t('typeBarcode')}
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          style={styles.input}
        />
        <Button
          label={t('continueTyped')}
          variant="ghost"
          disabled={!shopReady || busy || manualBarcode.trim().length === 0}
          loading={busy}
          onPress={() => void handleBarcode(manualBarcode)}
        />

        {error ? (
          <View style={styles.errorCard}>
            {lotMissing ? (
              <Text style={styles.errorTitle}>{t('lotNotFoundTitle')}</Text>
            ) : null}
            {lotDuplicate ? (
              <Text style={styles.errorTitle}>{t('lotAlreadyReceivedTitle')}</Text>
            ) : null}
            {failedBarcode ? (
              <>
                <Text style={styles.errorLabel}>{t('scannedBarcode')}</Text>
                <Text selectable style={styles.errorBarcode}>
                  {failedBarcode}
                </Text>
              </>
            ) : null}
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={styles.card}>
            <Text style={[styles.cardKicker, { color: colors.mapped }]}>
              {t('receivedOn', { qty: result.pieces_added, shop: result.shop_name })}
            </Text>
            <Text style={styles.cardSku}>{result.lot_barcode}</Text>
            <Text style={styles.cardName}>{result.model}</Text>
            <Button label={t('scanAnother')} variant="receive" onPress={resetForNext} />
          </View>
        ) : null}
      </ScrollView>

      <CameraScanner
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScanned={(barcode) => void handleBarcode(barcode)}
      />

      <SuccessNotice
        notice={notice}
        onDone={() => {
          setNotice(null);
          resetForNext();
          noticeDone.current?.();
          noticeDone.current = null;
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: space.lg,
    gap: space.md,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  shops: {
    flexDirection: 'row',
    gap: space.sm,
  },
  shopButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  shopSelected: {
    borderColor: colors.receive,
    backgroundColor: '#DCEFE3',
  },
  shopLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  shopLabelSelected: {
    color: colors.receive,
  },
  hint: {
    color: colors.pending,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.muted,
  },
  or: {
    marginTop: space.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    paddingHorizontal: space.md,
    fontSize: 18,
    color: colors.text,
  },
  errorCard: {
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
    borderWidth: 1,
    borderColor: '#F0B4AE',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.danger,
  },
  errorLabel: {
    marginTop: space.xs,
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  errorBarcode: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  error: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  cardKicker: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.pending,
    textTransform: 'uppercase',
  },
  cardSku: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  cardName: {
    fontSize: 18,
    color: colors.muted,
  },
});
