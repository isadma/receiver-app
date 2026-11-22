import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, listProducts, updateProductBarcode } from '../api';
import { useApi } from '../context/ApiContext';
import { useLocale } from '../context/LocaleContext';
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
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <MapBarcodeForm
          key={barcode}
          barcode={barcode}
          onClose={onClose}
          onMapped={onMapped}
        />
      ) : null}
    </Modal>
  );
}

function MapBarcodeForm({
  barcode,
  onClose,
  onMapped,
}: {
  barcode: string;
  onClose: () => void;
  onMapped: (product: Product) => void;
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { baseUrl } = useApi();
  const searchRef = useRef<ComponentRef<typeof TextInput>>(null);
  const savingRef = useRef(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [resultsFor, setResultsFor] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      searchRef.current?.focus();
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, 300);
  const listData = trimmedQuery.length === 0 ? [] : results;
  const showSearching = trimmedQuery.length > 0 && resultsFor !== trimmedQuery;

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      return;
    }

    let cancelled = false;

    listProducts(baseUrl, { q: debouncedQuery, perPage: 20 })
      .then((page) => {
        if (!cancelled) {
          setResults(page.data);
          setResultsFor(debouncedQuery);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setResults([]);
          setResultsFor(debouncedQuery);
          setError(caught instanceof ApiError ? caught.displayMessage : t('searchFailed'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, debouncedQuery, t]);

  const needsConfirm = (product: Product): boolean =>
    Boolean(product.barcode && product.barcode !== barcode);

  const replaceWarning =
    selected && needsConfirm(selected)
      ? t('replaceBarcode', { sku: selected.sku ?? '', barcode: selected.barcode ?? '' })
      : null;

  const hideKeyboard = () => {
    Keyboard.dismiss();
  };

  const save = async (product: Product) => {
    if (!product.sku) {
      setError(t('noSkuCannotMap'));
      return;
    }

    if (savingRef.current) {
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const mapped = await updateProductBarcode(baseUrl, product.sku, barcode);
      onMapped(mapped);
    } catch (caught) {
      savingRef.current = false;
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotSaveBarcode'));
    } finally {
      setSaving(false);
    }
  };

  const selectProduct = (product: Product) => {
    hideKeyboard();
    setSelected(product);
    setError(null);

    if (!needsConfirm(product)) {
      void save(product);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.md }]}>
      <Text style={styles.kicker}>{t('scannedBarcode')}</Text>
      <Text style={styles.barcode}>{barcode}</Text>
      <Text style={styles.title}>{t('findSku')}</Text>
      <SearchField
        ref={searchRef}
        value={query}
        onChangeText={setQuery}
        placeholder={t('typeSkuOrName')}
        autoCapitalize="none"
        autoFocus
      />

      {showSearching ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        style={styles.list}
        data={listData}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          showSearching ? undefined : (
            <Text style={styles.empty}>
              {trimmedQuery.length > 0 ? t('noProductsMatch') : t('typeSkuHint')}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            selected={selected?.id === item.id}
            showBarcode
            onPress={() => selectProduct(item)}
          />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        {replaceWarning ? <Text style={styles.warning}>{replaceWarning}</Text> : null}
        <Button
          label={selected ? t('mapTo', { sku: selected.sku ?? '' }) : t('selectProduct')}
          variant="receive"
          disabled={!selected || saving}
          loading={saving}
          onPress={() => {
            if (selected) {
              hideKeyboard();
              void save(selected);
            }
          }}
        />
        <Button
          label={t('cancel')}
          variant="ghost"
          onPress={() => {
            hideKeyboard();
            onClose();
          }}
          disabled={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
  },
  listContent: {
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
