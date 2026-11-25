import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, getShops, listBoxes, moveBoxShop } from '../src/api';
import { BoxList } from '../src/components/BoxList';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { useApi } from '../src/context/ApiContext';
import { useLocale } from '../src/context/LocaleContext';
import { colors, radius, space } from '../src/theme';
import type { BoxRecord, Shop } from '../src/types';

export default function ChangeBoxShopScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { baseUrl } = useApi();
  const [boxes, setBoxes] = useState<BoxRecord[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [picked, setPicked] = useState<BoxRecord | null>(null);
  const [target, setTarget] = useState<Shop | null>(null);
  const [confirmMove, setConfirmMove] = useState(false);
  const [confirmMerge, setConfirmMerge] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextBoxes, nextShops] = await Promise.all([listBoxes(baseUrl), getShops(baseUrl)]);
      setBoxes(nextBoxes);
      setShops(nextShops);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadBoxes'));
    }
  }, [baseUrl, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const startMove = (shop: Shop) => {
    if (!picked || shop.slug === picked.shop) {
      return;
    }

    setTarget(shop);
    const clash = boxes.some(
      (item) => item.shop === shop.slug && item.box_number === picked.box_number,
    );
    if (clash) {
      setConfirmMerge(true);
      return;
    }

    setConfirmMove(true);
  };

  const runMove = async () => {
    if (!picked || !target) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await moveBoxShop(baseUrl, picked.shop, target.slug, picked.box_number);
      setMessage(t('movedBox'));
      setPicked(null);
      setTarget(null);
      setConfirmMove(false);
      setConfirmMerge(false);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('couldNotMoveBox'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.lede}>{t('changeBoxShop')}</Text>
      <BoxList boxes={boxes} onPress={setPicked} />
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={picked !== null && !confirmMove && !confirmMerge} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{t('pickNewShop')}</Text>
            <Text style={styles.body}>
              {picked ? `${picked.shop_name} · ${t('box')} ${picked.box_number}` : ''}
            </Text>
            {shops
              .filter((shop) => shop.slug !== picked?.shop)
              .map((shop) => (
                <Pressable key={shop.slug} onPress={() => startMove(shop)} style={styles.shopButton}>
                  <Text style={styles.shopLabel}>{shop.name}</Text>
                </Pressable>
              ))}
            <Pressable onPress={() => setPicked(null)} style={styles.cancel}>
              <Text style={styles.cancelLabel}>{t('cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmMove && target !== null && picked !== null}
        title={t('moveBox')}
        body={
          picked && target
            ? t('moveBoxConfirm', {
                box: picked.box_number,
                from: picked.shop_name,
                to: target.name,
              })
            : ''
        }
        confirmLabel={t('moveBox')}
        cancelLabel={t('cancel')}
        loading={busy}
        onConfirm={() => void runMove()}
        onCancel={() => {
          setConfirmMove(false);
          setTarget(null);
        }}
      />

      <ConfirmDialog
        visible={confirmMerge && target !== null && picked !== null}
        title={t('moveBox')}
        body={
          picked && target
            ? t('mergeBoxConfirm', { shop: target.name, box: picked.box_number })
            : ''
        }
        confirmLabel={t('moveBox')}
        cancelLabel={t('cancel')}
        loading={busy}
        onConfirm={() => void runMove()}
        onCancel={() => {
          setConfirmMerge(false);
          setTarget(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.md,
  },
  lede: {
    fontSize: 16,
    color: colors.muted,
  },
  ok: {
    color: colors.mapped,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  shopButton: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: '#DCEFE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.receive,
  },
  cancel: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.muted,
  },
});
