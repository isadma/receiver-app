import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale } from '../context/LocaleContext';
import type { Product } from '../types';
import { colors, radius, space } from '../theme';
import { Button } from './Button';

export type SuccessNoticeData =
  | {
      kind: 'mapped';
      product: Product;
    }
  | {
      kind: 'received';
      product: Product;
      qty: number;
      shopName: string;
    };

type Props = {
  notice: SuccessNoticeData | null;
  onDone: () => void;
};

export function SuccessNotice({ notice, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  if (!notice) {
    return null;
  }

  const product = notice.product;
  const name = product.name ?? t('unknownProduct');
  const code = product.sku ?? t('noCode');
  const barcode = product.barcode ?? t('noBarcodeYet');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={[styles.card, { marginBottom: insets.bottom + space.md }]}>
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>

          {notice.kind === 'mapped' ? (
            <>
              <Text style={styles.title}>{t('barcodeLinked')}</Text>
              <Text style={styles.lede}>{t('checkProduct')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('itemCounted')}</Text>
              <Text style={styles.lede}>{t('checkProduct')}</Text>
            </>
          )}

          <Fact label={t('barcode')} value={barcode} large />
          <Fact label={t('code')} value={code} />
          <Fact label={t('product')} value={name} />

          {notice.kind === 'received' ? (
            <>
              <View style={styles.qtyRow}>
                <View style={styles.qtyBox}>
                  <Text style={styles.qtyLabel}>{t('justAdded')}</Text>
                  <Text style={styles.qtyValue}>{notice.qty}</Text>
                  <Text style={styles.qtyHint}>{t('toShop', { shop: notice.shopName })}</Text>
                </View>
                <View style={styles.qtyBox}>
                  <Text style={styles.qtyLabel}>{t('totalReceived')}</Text>
                  <Text style={styles.qtyValue}>{product.total_received_qty}</Text>
                  <Text style={styles.qtyHint}>{t('forThisProduct')}</Text>
                </View>
              </View>
            </>
          ) : null}

          <Button
            label={notice.kind === 'mapped' ? t('looksGood') : t('okNext')}
            variant="receive"
            onPress={onDone}
          />
        </View>
      </View>
    </Modal>
  );
}

function Fact({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, large && styles.factValueLarge]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  check: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCEFE3',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  checkMark: {
    fontSize: 36,
    color: colors.mapped,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  lede: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: space.xs,
  },
  fact: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: space.md,
  },
  factLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  factValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  factValueLarge: {
    fontSize: 32,
  },
  qtyRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  qtyBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: space.md,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  qtyValue: {
    marginTop: 4,
    fontSize: 40,
    fontWeight: '800',
    color: colors.mapped,
    fontVariant: ['tabular-nums'],
  },
  qtyHint: {
    marginTop: 2,
    fontSize: 15,
    color: colors.muted,
  },
});
