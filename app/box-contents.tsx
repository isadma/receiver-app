import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, listBoxes } from '../src/api';
import { BoxList } from '../src/components/BoxList';
import { useApi } from '../src/context/ApiContext';
import { useLocale } from '../src/context/LocaleContext';
import { colors, space } from '../src/theme';
import type { BoxRecord } from '../src/types';

export default function BoxContentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { baseUrl } = useApi();
  const [boxes, setBoxes] = useState<BoxRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listBoxes(baseUrl)
        .then((next) => {
          if (!cancelled) {
            setBoxes(next);
          }
        })
        .catch((caught) => {
          if (!cancelled) {
            setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadBoxes'));
          }
        });

      return () => {
        cancelled = true;
      };
    }, [baseUrl, t]),
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
    >
      <BoxList
        boxes={boxes}
        onPress={(box) =>
          router.push({
            pathname: '/box-contents/[shop]/[box]',
            params: { shop: box.shop, box: box.box_number },
          })
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.md,
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
