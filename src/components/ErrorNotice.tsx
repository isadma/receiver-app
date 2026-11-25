import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale } from '../context/LocaleContext';
import { colors, radius, space } from '../theme';
import { Button } from './Button';

export type ReceiveErrorNotice = {
  title: string;
  message: string;
  barcode: string | null;
  box: string | null;
  shop: string | null;
};

type Props = {
  notice: ReceiveErrorNotice | null;
  onDone: () => void;
};

export function ErrorNotice({ notice, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  if (!notice) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={[styles.card, { marginBottom: Math.max(insets.bottom, space.sm) }]}>
          <View style={styles.header}>
            <View style={styles.mark}>
              <Text style={styles.markText}>!</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{notice.title}</Text>
              <Text style={styles.lede}>{notice.message}</Text>
            </View>
          </View>

          <View style={styles.summary}>
            {notice.barcode ? (
              <View style={styles.summaryMain}>
                <Text style={styles.factLabel}>{t('scannedBarcode')}</Text>
                <Text selectable style={styles.barcode}>
                  {notice.barcode}
                </Text>
              </View>
            ) : null}
            {notice.shop || notice.box ? (
              <View style={styles.meta}>
                {notice.shop ? <Text style={styles.metaText}>{notice.shop}</Text> : null}
                {notice.box ? (
                  <Text style={styles.metaText}>
                    {t('box')} {notice.box}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <Button
            label={t('okContinue')}
            variant="danger"
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
    borderWidth: 2,
    borderColor: '#F0B4AE',
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
  mark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontSize: 22,
    color: colors.danger,
    fontWeight: '800',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.danger,
  },
  lede: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  summary: {
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    padding: space.sm,
    gap: space.sm,
  },
  summaryMain: {
    gap: 2,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  barcode: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  meta: {
    gap: 2,
  },
  metaText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  button: {
    minHeight: 128,
    marginTop: space.xs,
  },
});
