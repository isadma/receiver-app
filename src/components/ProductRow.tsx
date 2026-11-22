import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';
import type { Product } from '../types';
import { colors, radius, space } from '../theme';

type Props = {
  product: Product;
  onPress?: () => void;
  selected?: boolean;
  showBarcode?: boolean;
  showQty?: boolean;
};

export function ProductRow({
  product,
  onPress,
  selected = false,
  showBarcode = true,
  showQty = false,
}: Props) {
  const { t } = useLocale();
  const mapped = Boolean(product.barcode);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, selected && styles.selected]}
    >
      <View style={styles.main}>
        <Text style={styles.sku}>{product.sku ?? t('noSku')}</Text>
        <Text style={styles.name}>{product.name ?? t('untitledProduct')}</Text>
        {showBarcode ? (
          <Text style={styles.barcode}>{product.barcode ?? t('noBarcodeYet')}</Text>
        ) : null}
        {showQty ? (
          <Text style={styles.qty}>
            {t('qtyLine', {
              received: product.total_received_qty,
              expected: product.total_expected_qty,
              amazon: product.amazon_received_qty,
              noon: product.noon_received_qty,
              namshi: product.namshi_received_qty,
            })}
          </Text>
        ) : null}
      </View>
      <View style={[styles.badge, mapped ? styles.mapped : styles.pending]}>
        <Text style={[styles.badgeLabel, mapped ? styles.mappedLabel : styles.pendingLabel]}>
          {mapped ? t('mapped') : t('pending')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.receive,
  },
  main: {
    flex: 1,
    gap: 4,
  },
  sku: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  name: {
    fontSize: 16,
    color: colors.muted,
  },
  barcode: {
    marginTop: 4,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  qty: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapped: {
    backgroundColor: '#DCEFE3',
  },
  pending: {
    backgroundColor: '#F8E6D8',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  mappedLabel: {
    color: colors.mapped,
  },
  pendingLabel: {
    color: colors.pending,
  },
});
