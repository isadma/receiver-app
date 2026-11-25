import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';
import type { BoxRecord } from '../types';
import { colors, radius, space } from '../theme';

type Props = {
  boxes: BoxRecord[];
  onPress: (box: BoxRecord) => void;
};

export function BoxList({ boxes, onPress }: Props) {
  const { t } = useLocale();

  if (boxes.length === 0) {
    return <Text style={styles.empty}>{t('noBoxesYet')}</Text>;
  }

  return (
    <View style={styles.list}>
      {boxes.map((box) => (
        <Pressable
          key={`${box.shop}-${box.box_number}`}
          onPress={() => onPress(box)}
          style={styles.card}
        >
          <Text style={styles.shop}>{box.shop_name}</Text>
          <Text style={styles.number}>
            {t('box')} {box.box_number}
          </Text>
          <Text style={styles.meta}>
            {t('piecesCount', { qty: box.qty })} · {t('lotsCount', { count: box.different_lots })}
            {box.status === 'closed' ? ` · ${t('closed')}` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.sm,
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
  },
  shop: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  number: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    fontSize: 15,
    color: colors.muted,
  },
});
