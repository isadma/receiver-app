import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, listProducts } from '../src/api';
import { ProductRow } from '../src/components/ProductRow';
import { SearchField } from '../src/components/SearchField';
import { useApi } from '../src/context/ApiContext';
import { useDebouncedValue } from '../src/hooks/useDebouncedValue';
import { colors, space } from '../src/theme';
import type { Product } from '../src/types';

export default function DataScreen() {
  const insets = useSafeAreaInsets();
  const { baseUrl } = useApi();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
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
        const result = await listProducts(baseUrl, {
          page: nextPage,
          perPage: 20,
          q: debouncedQuery,
          status: 'mapped',
        });

        setPage(result.meta.current_page);
        setLastPage(result.meta.last_page);
        setProducts((current) => (replace ? result.data : [...current, ...result.data]));
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.displayMessage : 'Could not load mapped products.');
        if (replace) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [baseUrl, debouncedQuery],
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
          placeholder="Search mapped SKU or name"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={products}
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
              {query.trim() ? 'No mapped products match that search.' : 'No mapped products yet.'}
            </Text>
          )
        }
        renderItem={({ item }) => <ProductRow product={item} showQty />}
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
