import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ApiError,
  deleteBoxLot,
  deleteBoxReceipt,
  getBoxContents,
  updateBoxReceiptQty,
} from '../../../src/api';
import { Button } from '../../../src/components/Button';
import { ConfirmDialog } from '../../../src/components/ConfirmDialog';
import { useApi } from '../../../src/context/ApiContext';
import { useLocale } from '../../../src/context/LocaleContext';
import { colors, radius, space } from '../../../src/theme';
import type { BoxContents, BoxLot, BoxLotItem } from '../../../src/types';

export default function BoxContentsDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { baseUrl } = useApi();
  const params = useLocalSearchParams<{ shop: string; box: string }>();
  const shop = String(params.shop ?? '');
  const boxNumber = String(params.box ?? '');
  const [contents, setContents] = useState<BoxContents | null>(null);
  const [qtyDraft, setQtyDraft] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteItem, setDeleteItem] = useState<BoxLotItem | null>(null);
  const [deleteLot, setDeleteLot] = useState<BoxLot | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const next = await getBoxContents(baseUrl, shop, boxNumber);
      setContents(next);
      setQtyDraft(
        Object.fromEntries(
          next.lots.flatMap((lot) => lot.items.map((item) => [item.id, String(item.qty)])),
        ),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadBoxes'));
    }
  }, [baseUrl, boxNumber, shop, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const saveQty = async (item: BoxLotItem) => {
    const qty = Number.parseInt(qtyDraft[item.id] ?? '', 10);
    if (!Number.isFinite(qty) || qty < 1) {
      setError(t('qtyMustBePositive'));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await updateBoxReceiptQty(baseUrl, item.id, qty);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotSaveBox'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deleteItem) {
      return;
    }

    setBusy(true);
    try {
      await deleteBoxReceipt(baseUrl, deleteItem.id);
      setDeleteItem(null);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotSaveBox'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteLot = async () => {
    if (!deleteLot) {
      return;
    }

    setBusy(true);
    try {
      await deleteBoxLot(baseUrl, shop, boxNumber, deleteLot.id);
      setDeleteLot(null);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotSaveBox'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      {contents ? (
        <Text style={styles.header}>
          {contents.shop_name} · {t('box')} {contents.box_number}
          {contents.status === 'closed' ? ` · ${t('closed')}` : ''}
        </Text>
      ) : null}

      {contents?.lots.map((lot) => (
        <View key={lot.id} style={styles.lot}>
          <Text style={styles.lotTitle}>{lot.lot_barcode}</Text>
          <Text style={styles.lotMeta}>
            {[lot.model, lot.name, lot.color].filter(Boolean).join(' · ')}
          </Text>
          {lot.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.barcode}>{item.barcode}</Text>
              <Text style={styles.size}>{item.size_code}</Text>
              <View style={styles.qtyRow}>
                <TextInput
                  value={qtyDraft[item.id] ?? String(item.qty)}
                  onChangeText={(value) =>
                    setQtyDraft((current) => ({ ...current, [item.id]: value }))
                  }
                  keyboardType="number-pad"
                  style={styles.qtyInput}
                />
                <Button
                  label={t('saveQty')}
                  variant="receive"
                  disabled={busy}
                  onPress={() => void saveQty(item)}
                  style={styles.smallButton}
                />
              </View>
              <Button
                label={t('deleteItem')}
                variant="danger"
                disabled={busy}
                onPress={() => setDeleteItem(item)}
              />
            </View>
          ))}
          <Button
            label={t('deleteLot')}
            variant="ghost"
            disabled={busy}
            onPress={() => setDeleteLot(lot)}
          />
        </View>
      ))}

      {contents && contents.lots.length === 0 ? (
        <Text style={styles.empty}>{t('noBoxesYet')}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ConfirmDialog
        visible={deleteItem !== null}
        title={t('deleteItem')}
        body={t('deleteItemConfirm', { barcode: deleteItem?.barcode ?? '' })}
        confirmLabel={t('deleteItem')}
        cancelLabel={t('cancel')}
        confirmVariant="danger"
        loading={busy}
        onConfirm={() => void confirmDeleteItem()}
        onCancel={() => setDeleteItem(null)}
      />
      <ConfirmDialog
        visible={deleteLot !== null}
        title={t('deleteLot')}
        body={t('deleteLotConfirm', { lot: deleteLot?.lot_barcode ?? '' })}
        confirmLabel={t('deleteLot')}
        cancelLabel={t('cancel')}
        confirmVariant="danger"
        loading={busy}
        onConfirm={() => void confirmDeleteLot()}
        onCancel={() => setDeleteLot(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.md,
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  lot: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  lotTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  lotMeta: {
    fontSize: 15,
    color: colors.muted,
  },
  item: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
    gap: space.sm,
  },
  barcode: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  size: {
    fontSize: 15,
    color: colors.muted,
  },
  qtyRow: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
  qtyInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    paddingHorizontal: space.md,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  smallButton: {
    minHeight: 52,
    paddingHorizontal: space.md,
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
