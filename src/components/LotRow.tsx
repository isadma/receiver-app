import { StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';
import type { Lot } from '../types';
import { colors, radius, space } from '../theme';

type Props = {
  lot: Lot;
};

export function LotRow({ lot }: Props) {
  const { t, locale } = useLocale();
  const name =
    (locale === 'ru' ? lot.name_ru : lot.name_en) ?? lot.name_en ?? lot.model ?? '';
  const color = lot.color_en ?? lot.color ?? '';

  return (
    <View style={styles.row}>
      <Text style={styles.sku}>{lot.lot_barcode}</Text>
      <Text style={styles.name}>
        {[lot.model, name, color].filter((part): part is string => Boolean(part)).join(' · ')}
      </Text>
      <Text style={styles.qty}>
        {t('qtyLine', {
          amazon: lot.amazon_received_qty ?? 0,
          noon: lot.noon_received_qty ?? 0,
          namshi: lot.namshi_received_qty ?? 0,
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
  },
  sku: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  name: {
    fontSize: 16,
    color: colors.muted,
  },
  qty: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
});
