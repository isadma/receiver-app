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
import { ApiError, getProductByBarcode, getShops, receiveProduct } from '../src/api';
import { Button } from '../src/components/Button';
import { CameraScanner } from '../src/components/CameraScanner';
import { MapBarcodeSheet } from '../src/components/MapBarcodeSheet';
import { SuccessNotice, type SuccessNoticeData } from '../src/components/SuccessNotice';
import { useApi } from '../src/context/ApiContext';
import { useLocale } from '../src/context/LocaleContext';
import { loadSelectedShop, saveSelectedShop } from '../src/storage';
import { colors, radius, space } from '../src/theme';
import { productShopQty, type Product, type Shop } from '../src/types';

type Result = {
  product: Product;
  qty: number;
  shop: Shop;
} | null;

function parseQty(raw: string): number | null {
  const qty = Number.parseInt(raw.trim(), 10);
  if (!Number.isInteger(qty) || qty < 1 || qty > 9999) {
    return null;
  }

  return qty;
}

export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { baseUrl } = useApi();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [qtyText, setQtyText] = useState('1');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
  const [mapping, setMapping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<SuccessNoticeData | null>(null);
  const noticeDone = useRef<(() => void) | null>(null);

  const showNotice = (next: SuccessNoticeData): Promise<void> => {
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
    void saveSelectedShop(next.slug);
  };

  const currentQty = (): number | null => parseQty(qtyText);

  const resetForNext = () => {
    setActiveBarcode(null);
    setMapping(false);
    setManualBarcode('');
    setResult(null);
    setError(null);
  };

  const completeReceive = async (barcode: string, selectedShop: Shop) => {
    const qty = currentQty();
    if (qty === null) {
      setError(t('invalidQty'));
      return;
    }

    const product = await receiveProduct(baseUrl, barcode, selectedShop.slug, qty);
    setMapping(false);
    setResult({ product, qty, shop: selectedShop });
    setActiveBarcode(null);
    setManualBarcode('');
    await showNotice({
      kind: 'received',
      product,
      qty,
      shopName: selectedShop.name,
    });
  };

  const handleBarcode = async (raw: string) => {
    const barcode = raw.trim();
    setCameraOpen(false);

    if (!shop) {
      setError(t('selectShopFirst'));
      return;
    }

    if (currentQty() === null) {
      setError(t('invalidQty'));
      return;
    }

    if (!barcode) {
      setError(t('enterBarcodeFirst'));
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setActiveBarcode(barcode);

    try {
      const existing = await getProductByBarcode(baseUrl, barcode);
      if (existing) {
        await completeReceive(barcode, shop);
        return;
      }

      setMapping(true);
    } catch (caught) {
      setActiveBarcode(null);
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotLookup'));
    } finally {
      setBusy(false);
    }
  };

  const handleMapped = async (product: Product) => {
    if (!shop || !product.barcode) {
      setError(t('selectShopFirst'));
      setMapping(false);
      return;
    }

    setMapping(false);
    setBusy(true);
    setError(null);

    try {
      await completeReceive(product.barcode, shop);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('mappedButReceiveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const shopReady = shop !== null;
  const shopQty = result ? productShopQty(result.product, result.shop.slug) : null;

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
        {!shopReady ? (
          <Text style={styles.hint}>{t('selectShop')}</Text>
        ) : null}

        <Text style={styles.kicker}>{t('qty')}</Text>
        <TextInput
          value={qtyText}
          onChangeText={setQtyText}
          keyboardType="number-pad"
          placeholder="1"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

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
            setCameraOpen(true);
          }}
        />

        <Text style={styles.or}>{t('damagedBarcode')}</Text>
        <TextInput
          value={manualBarcode}
          onChangeText={setManualBarcode}
          placeholder={t('typeBarcode')}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {result ? (
          <View style={styles.card}>
            <Text style={[styles.cardKicker, { color: colors.mapped }]}>
              {t('receivedOn', { qty: result.qty, shop: result.shop.name })}
            </Text>
            <Text style={styles.cardSku}>{result.product.sku}</Text>
            <Text style={styles.cardName}>{result.product.name}</Text>
            <Text style={styles.cardBarcode}>{result.product.barcode}</Text>
            {shopQty ? (
              <Text style={styles.cardQty}>
                {t('shopReceivedExpectedLine', {
                  shop: result.shop.name,
                  received: shopQty.received,
                  expected: shopQty.expected,
                })}
              </Text>
            ) : null}
            <Text style={styles.cardQty}>
              {t('totalReceivedExpected', {
                received: result.product.total_received_qty,
                expected: result.product.total_expected_qty,
              })}
            </Text>
            <Button label={t('scanAnother')} variant="receive" onPress={resetForNext} />
          </View>
        ) : null}
      </ScrollView>

      <CameraScanner
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScanned={(barcode) => void handleBarcode(barcode)}
      />

      <MapBarcodeSheet
        visible={mapping && activeBarcode !== null}
        barcode={activeBarcode ?? ''}
        onClose={resetForNext}
        onMapped={(product) => void handleMapped(product)}
      />

      <SuccessNotice
        notice={notice}
        onDone={() => {
          setNotice(null);
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
  error: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
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
  cardBarcode: {
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  cardQty: {
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
