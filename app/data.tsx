import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, listLots } from '../src/api';
import { LotRow } from '../src/components/LotRow';
import { SearchField } from '../src/components/SearchField';
import { useApi } from '../src/context/ApiContext';
import { useLocale } from '../src/context/LocaleContext';
import { useDebouncedValue } from '../src/hooks/useDebouncedValue';
import { colors, space } from '../src/theme';
import type { Lot } from '../src/types';

export default function DataScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { baseUrl } = useApi();
  const [query, setQuery] = useState('');
  const [lots, setLots] = useState<Lot[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (replace) {
        setLoading(true);
      }

      setError(null);

      try {
        const result = await listLots(baseUrl, {
          page: nextPage,
          perPage: 20,
          q: debouncedQuery,
        });

        setPage(result.meta.current_page);
        setLastPage(result.meta.last_page);
        setLots((current) => (replace ? result.data : [...current, ...result.data]));
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadLots'));
        if (replace) {
          setLots([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [baseUrl, debouncedQuery, t],
  );

  useFocusEffect(
    useCallback(() => {
      void load(1, true);
    }, [load]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.search}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchLots')}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={lots}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.lg }]}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void load(1, true);
        }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loading && page < lastPage) {
            void load(page + 1, false);
          }
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.empty}>
              {query.trim() ? t('noLotMatch') : t('noLotsYet')}
            </Text>
          )
        }
        renderItem={({ item }) => <LotRow lot={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  search: {
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  list: {
    paddingHorizontal: space.lg,
    gap: space.sm,
    flexGrow: 1,
  },
  error: {
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    paddingTop: space.lg,
    color: colors.muted,
    fontSize: 16,
    textAlign: 'center',
  },
});
