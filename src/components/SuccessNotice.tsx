import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale } from '../context/LocaleContext';
import type { ReceiveResult } from '../types';
import { colors, radius, space } from '../theme';
import { Button } from './Button';

type Props = {
  notice: ReceiveResult | null;
  mode?: 'lot' | 'item';
  onDone: () => void;
};

export function SuccessNotice({ notice, mode = 'lot', onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { t, locale } = useLocale();

  if (!notice) {
    return null;
  }

  const isItem = mode === 'item';
  const scannedItem = notice.items[0];
  const name =
    (locale === 'ru' ? notice.name_ru : notice.name_en) ??
    notice.name_en ??
    notice.model ??
    t('unknownProduct');
  const color = notice.color_en ?? notice.color ?? '—';
  const product = [...new Set([notice.model, name].filter((part): part is string => Boolean(part)))].join(
    ' · ',
  );
  const barcode = isItem ? (scannedItem?.barcode ?? notice.lot_barcode) : notice.lot_barcode;
  const sizes = isItem && scannedItem ? [scannedItem] : notice.items;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={[styles.card, { marginBottom: Math.max(insets.bottom, space.sm) }]}>
          <View style={styles.header}>
            <View style={styles.check}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{isItem ? t('itemPieceCounted') : t('itemCounted')}</Text>
              <Text style={styles.lede}>{isItem ? t('checkItem') : t('checkProduct')}</Text>
            </View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryMain}>
              <Text style={styles.factLabel}>{isItem ? t('productBarcode') : t('barcode')}</Text>
              <Text style={styles.barcode}>{barcode}</Text>
              <Text style={styles.product} numberOfLines={2}>
                {product}
              </Text>
              <Text style={styles.color}>{color}</Text>
              <Text style={styles.box}>{t('box')} {notice.box}</Text>
            </View>
            <View style={styles.qtyBox}>
              <Text style={styles.qtyValue}>{notice.pieces_added}</Text>
              <Text style={styles.qtyHint}>
                {t('toShop', { shop: notice.shop_name, box: notice.box })}
              </Text>
            </View>
          </View>

          <View style={styles.sizes}>
            {sizes.map((item) => (
              <View key={item.barcode} style={styles.sizeRow}>
                <Text style={styles.sizeLabel}>{item.size_code}</Text>
                <Text style={styles.sizeQty}>+{item.pieces_added ?? item.pieces_per_lot}</Text>
              </View>
            ))}
          </View>

          <Button
            label={isItem ? t('okNextItem') : t('okNext')}
            variant="receive"
            onPress={onDone}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCEFE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 22,
    color: colors.mapped,
    fontWeight: '800',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  lede: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  summary: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: space.sm,
  },
  summaryMain: {
    flex: 1,
    gap: 2,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  barcode: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  product: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  color: {
    fontSize: 13,
    color: colors.muted,
  },
  box: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  qtyBox: {
    minWidth: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.mapped,
    fontVariant: ['tabular-nums'],
  },
  qtyHint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
  },
  sizes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  sizeRow: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 8,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sizeQty: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.mapped,
    fontVariant: ['tabular-nums'],
  },
  button: {
    minHeight: 128,
    marginTop: space.xs,
  },
});
