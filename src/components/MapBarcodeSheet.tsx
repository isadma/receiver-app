import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, listProducts, updateProductBarcode } from '../api';
import { useApi } from '../context/ApiContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { Product } from '../types';
import { colors, space } from '../theme';
import { Button } from './Button';
import { ProductRow } from './ProductRow';
import { SearchField } from './SearchField';

type Props = {
  visible: boolean;
  barcode: string;
  onClose: () => void;
  onMapped: (product: Product) => void;
};

export function MapBarcodeSheet({ visible, barcode, onClose, onMapped }: Props) {
  const insets = useSafeAreaInsets();
  const { baseUrl } = useApi();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setQuery('');
    setResults([]);
    setSelected(null);
    setError(null);
    setSaving(false);
  }, [visible, barcode]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (debouncedQuery.length === 0) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    setError(null);

    listProducts(baseUrl, { q: debouncedQuery, perPage: 20 })
      .then((page) => {
        if (!cancelled) {
          setResults(page.data);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setResults([]);
          setError(caught instanceof ApiError ? caught.displayMessage : 'Search failed.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, debouncedQuery, visible]);

  const replaceWarning =
    selected?.barcode && selected.barcode !== barcode
      ? `${selected.sku} already has barcode ${selected.barcode}. Saving will replace it.`
      : null;

  const save = async () => {
    if (!selected?.sku) {
      setError('This product has no SKU, so it cannot be mapped.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const product = await updateProductBarcode(baseUrl, selected.sku, barcode);
      onMapped(product);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : 'Could not save the barcode.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.screen, { paddingTop: insets.top + space.md }]}>
          <Text style={styles.kicker}>Scanned barcode</Text>
          <Text style={styles.barcode}>{barcode}</Text>
          <Text style={styles.title}>Find the product SKU</Text>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Type SKU or product name"
            autoCapitalize="none"
            autoFocus
          />

          {searching ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searching ? undefined : (
                <Text style={styles.empty}>
                  {debouncedQuery.length > 0
                    ? 'No products match that search.'
                    : 'Type a SKU from the label, such as USB2866.'}
                </Text>
              )
            }
            renderItem={({ item }) => (
              <ProductRow
                product={item}
                selected={selected?.id === item.id}
                showBarcode
                onPress={() => {
                  setSelected(item);
                  setError(null);
                }}
              />
            )}
          />

          <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
            {replaceWarning ? <Text style={styles.warning}>{replaceWarning}</Text> : null}
            <Button
              label={selected ? `Map to ${selected.sku}` : 'Select a product'}
              variant="receive"
              disabled={!selected || saving}
              loading={saving}
              onPress={() => void save()}
            />
            <Button label="Cancel" variant="ghost" onPress={onClose} disabled={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  barcode: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: space.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.sm,
  },
  spinner: {
    marginTop: space.sm,
  },
  error: {
    marginTop: space.sm,
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  warning: {
    color: colors.pending,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  list: {
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.sm,
    flexGrow: 1,
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    paddingTop: space.md,
  },
  footer: {
    gap: space.sm,
    paddingTop: space.sm,
    backgroundColor: colors.background,
  },
});
