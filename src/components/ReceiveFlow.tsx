import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ApiError,
  closeBox,
  createBox,
  getShops,
  listBoxes,
  openBox,
  receiveItem,
  receiveLot,
} from '../api';
import { useApi } from '../context/ApiContext';
import { useLocale } from '../context/LocaleContext';
import { useSettings } from '../context/SettingsContext';
import {
  clearLastBox,
  loadLastBoxes,
  loadSelectedShop,
  saveLastBox,
  saveSelectedShop,
} from '../storage';
import { colors, radius, space } from '../theme';
import type { BoxRecord, ReceiveResult, Shop } from '../types';
import { BoxList } from './BoxList';
import { Button } from './Button';
import { CameraScanner } from './CameraScanner';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorNotice, type ReceiveErrorNotice } from './ErrorNotice';
import { SuccessNotice } from './SuccessNotice';

type Props = {
  mode: 'lot' | 'item';
};

export function ReceiveFlow({ mode }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { allowSameLotScan } = useSettings();
  const { baseUrl } = useApi();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [boxes, setBoxes] = useState<BoxRecord[]>([]);
  const [selected, setSelected] = useState<BoxRecord | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [notice, setNotice] = useState<ReceiveResult | null>(null);
  const [errorNotice, setErrorNotice] = useState<ReceiveErrorNotice | null>(null);
  const [newBoxOpen, setNewBoxOpen] = useState(false);
  const [newBoxNumber, setNewBoxNumber] = useState('');
  const [chooseOpen, setChooseOpen] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [existingBox, setExistingBox] = useState<BoxRecord | null>(null);
  const noticeDone = useRef<(() => void) | null>(null);

  const showNotice = (next: ReceiveResult): Promise<void> => {
    return new Promise((resolve) => {
      noticeDone.current = resolve;
      setNotice(next);
    });
  };

  const applyShopBoxes = useCallback(
    async (nextShop: Shop, lastNumber: string | undefined) => {
      const nextBoxes = await listBoxes(baseUrl, nextShop.slug);
      setBoxes(nextBoxes);
      const remembered = lastNumber
        ? nextBoxes.find((item) => item.box_number === lastNumber && item.status === 'open')
        : undefined;
      setSelected(remembered ?? null);
    },
    [baseUrl],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      Promise.all([getShops(baseUrl), loadSelectedShop(), loadLastBoxes()])
        .then(async ([nextShops, savedSlug, last]) => {
          if (cancelled) {
            return;
          }

          setShops(nextShops);
          const nextShop =
            nextShops.find((item) => item.slug === savedSlug) ?? nextShops[0] ?? null;
          setShop(nextShop);
          if (nextShop) {
            await applyShopBoxes(nextShop, last[nextShop.slug]);
          }
        })
        .catch((caught) => {
          if (!cancelled) {
            setHint(caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadShops'));
          }
        });

      return () => {
        cancelled = true;
      };
    }, [applyShopBoxes, baseUrl, t]),
  );

  const selectShop = async (next: Shop) => {
    setShop(next);
    setHint(null);
    void saveSelectedShop(next.slug);
    const last = await loadLastBoxes();
    try {
      await applyShopBoxes(next, last[next.slug]);
    } catch (caught) {
      setHint(caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadBoxes'));
    }
  };

  const selectBox = async (box: BoxRecord) => {
    let next = box;
    if (box.status === 'closed') {
      next = await openBox(baseUrl, box.shop, box.box_number);
    }
    setSelected(next);
    setBoxes((current) => {
      const match = current.some(
        (item) => item.shop === next.shop && item.box_number === next.box_number,
      );
      if (!match) {
        return [next, ...current];
      }

      return current.map((item) =>
        item.shop === next.shop && item.box_number === next.box_number ? next : item,
      );
    });
    void saveLastBox(next.shop, next.box_number);
    setChooseOpen(false);
    setNewBoxOpen(false);
    setExistingBox(null);
    setHint(null);
  };

  const submitNewBox = async () => {
    if (!shop) {
      return;
    }

    const number = newBoxNumber.trim();
    if (!number) {
      setHint(t('enterBoxFirst'));
      return;
    }

    setBusy(true);
    setHint(null);
    try {
      const created = await createBox(baseUrl, shop.slug, number);
      if (created.exists) {
        setExistingBox(created);
        return;
      }

      await selectBox(created);
      setNewBoxNumber('');
    } catch (caught) {
      setHint(caught instanceof ApiError ? caught.displayMessage : t('couldNotSaveBox'));
    } finally {
      setBusy(false);
    }
  };

  const confirmExisting = async () => {
    if (!existingBox) {
      return;
    }

    setBusy(true);
    try {
      await selectBox(existingBox);
      setNewBoxNumber('');
    } catch (caught) {
      setHint(caught instanceof ApiError ? caught.displayMessage : t('couldNotSaveBox'));
    } finally {
      setBusy(false);
    }
  };

  const confirmClose = async () => {
    if (!shop || !selected) {
      return;
    }

    setBusy(true);
    try {
      await closeBox(baseUrl, shop.slug, selected.box_number);
      setSelected(null);
      await clearLastBox(shop.slug);
      setBoxes(await listBoxes(baseUrl, shop.slug));
      setCloseConfirm(false);
    } catch (caught) {
      setHint(caught instanceof ApiError ? caught.displayMessage : t('couldNotSaveBox'));
    } finally {
      setBusy(false);
    }
  };

  const resetForNext = () => {
    setManualBarcode('');
    setHint(null);
  };

  const handleBarcode = async (raw: string) => {
    const barcode = raw.trim().toUpperCase();
    setCameraOpen(false);

    if (!shop) {
      setHint(t('selectShopFirst'));
      return;
    }

    if (!selected) {
      setHint(t('selectBoxFirst'));
      return;
    }

    if (!barcode) {
      setHint(t('enterBarcodeFirst'));
      return;
    }

    setBusy(true);
    setHint(null);

    try {
      const received =
        mode === 'item'
          ? await receiveItem(baseUrl, barcode, shop.slug, selected.box_number)
          : await receiveLot(baseUrl, barcode, shop.slug, selected.box_number, allowSameLotScan);
      setManualBarcode('');
      await showNotice(received);
    } catch (caught) {
      const apiMessage = caught instanceof ApiError ? caught.displayMessage : null;
      const notFound =
        caught instanceof ApiError &&
        caught.status === 404 &&
        (apiMessage === 'Штрихкод не найден.' || apiMessage === 'Лот не найден.');
      const duplicate = caught instanceof ApiError && caught.status === 409;
      const title = notFound
        ? t(mode === 'item' ? 'itemNotFoundTitle' : 'lotNotFoundTitle')
        : duplicate
          ? t('lotAlreadyReceivedTitle')
          : t('receiveErrorTitle');
      const message = notFound
        ? t(mode === 'item' ? 'itemNotFoundBody' : 'lotNotFoundBody')
        : duplicate
          ? t('lotAlreadyReceivedBody')
          : apiMessage ?? t('couldNotLookup');

      setManualBarcode(barcode);
      setErrorNotice({
        title,
        message,
        barcode,
        box: selected.box_number,
        shop: shop.name,
      });
    } finally {
      setBusy(false);
    }
  };

  const shopReady = shop !== null;
  const canScan = shopReady && selected !== null && selected.status === 'open';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>{t('shop')}</Text>
        <View style={styles.shops}>
          {shops.map((item) => {
            const isSelected = shop?.slug === item.slug;
            return (
              <Pressable
                key={item.id}
                onPress={() => void selectShop(item)}
                style={[styles.shopButton, isSelected && styles.shopSelected]}
              >
                <Text style={[styles.shopLabel, isSelected && styles.shopLabelSelected]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!shopReady ? <Text style={styles.hint}>{t('selectShop')}</Text> : null}

        <Text style={styles.kicker}>{t('box')}</Text>
        <View style={styles.currentBox}>
          <Text style={styles.currentLabel}>
            {selected
              ? `${t('box')} ${selected.box_number}`
              : t('noBoxSelected')}
          </Text>
        </View>
        <Button
          label={t('newBox')}
          variant="receive"
          disabled={!shopReady || busy}
          onPress={() => {
            setNewBoxNumber('');
            setNewBoxOpen(true);
          }}
        />
        <Button
          label={t('chooseBox')}
          variant="ghost"
          disabled={!shopReady || busy}
          onPress={() => {
            if (shop) {
              void listBoxes(baseUrl, shop.slug)
                .then(setBoxes)
                .catch((caught) => {
                  setHint(
                    caught instanceof ApiError ? caught.displayMessage : t('couldNotLoadBoxes'),
                  );
                });
            }
            setChooseOpen(true);
          }}
        />
        <Button
          label={t('closeBox')}
          variant="danger"
          disabled={!canScan || busy}
          onPress={() => setCloseConfirm(true)}
        />

        <Text style={styles.title}>{t(mode === 'item' ? 'scanItemTitle' : 'scanTitle')}</Text>
        <Text style={styles.body}>
          {t(mode === 'item' ? 'scanItemBody' : 'scanBody', {
            shop: shop?.name ?? t('theSelectedShop'),
            box: selected?.box_number ?? '—',
          })}
        </Text>

        <Button
          label={t('openCamera')}
          variant="receive"
          disabled={!canScan || busy}
          loading={busy}
          onPress={() => {
            setHint(null);
            setCameraOpen(true);
          }}
        />

        <Text style={styles.or}>{t('damagedBarcode')}</Text>
        <TextInput
          value={manualBarcode}
          onChangeText={setManualBarcode}
          placeholder={t(mode === 'item' ? 'typeItemBarcode' : 'typeBarcode')}
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          style={styles.input}
        />
        <Button
          label={t('continueTyped')}
          variant="ghost"
          disabled={!canScan || busy || manualBarcode.trim().length === 0}
          loading={busy}
          onPress={() => void handleBarcode(manualBarcode)}
        />

        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </ScrollView>

      <Modal visible={newBoxOpen} transparent animationType="fade" onRequestClose={() => setNewBoxOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('newBox')}</Text>
            <TextInput
              value={newBoxNumber}
              onChangeText={setNewBoxNumber}
              placeholder={t('typeBox')}
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
            <Button
              label={t('createBox')}
              variant="receive"
              loading={busy}
              onPress={() => void submitNewBox()}
            />
            <Button label={t('cancel')} variant="ghost" onPress={() => setNewBoxOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={chooseOpen} transparent animationType="fade" onRequestClose={() => setChooseOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('chooseBox')}</Text>
            <ScrollView style={styles.chooseList}>
              <BoxList boxes={boxes} onPress={(box) => void selectBox(box)} />
            </ScrollView>
            <Button label={t('cancel')} variant="ghost" onPress={() => setChooseOpen(false)} />
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={existingBox !== null}
        title={t('newBox')}
        body={t('useExistingBox', { box: existingBox?.box_number ?? '' })}
        confirmLabel={t('okContinue')}
        cancelLabel={t('cancel')}
        loading={busy}
        onConfirm={() => void confirmExisting()}
        onCancel={() => setExistingBox(null)}
      />

      <ConfirmDialog
        visible={closeConfirm}
        title={t('closeBox')}
        body={t('closeBoxConfirm', { box: selected?.box_number ?? '' })}
        confirmLabel={t('closeBox')}
        cancelLabel={t('cancel')}
        confirmVariant="danger"
        loading={busy}
        onConfirm={() => void confirmClose()}
        onCancel={() => setCloseConfirm(false)}
      />

      <CameraScanner
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScanned={(barcode) => void handleBarcode(barcode)}
        cameraBody={mode === 'item' ? t('cameraItemBody') : t('cameraBody')}
        pointHint={mode === 'item' ? t('pointAtItemBarcode') : t('pointAtBarcode')}
      />

      <SuccessNotice
        mode={mode}
        notice={notice}
        onDone={() => {
          setNotice(null);
          resetForNext();
          noticeDone.current?.();
          noticeDone.current = null;
        }}
      />

      <ErrorNotice
        notice={errorNotice}
        onDone={() => {
          setErrorNotice(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: space.lg,
    gap: space.md,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  shops: {
    flexDirection: 'row',
    gap: space.sm,
  },
  shopButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  shopSelected: {
    borderColor: colors.receive,
    backgroundColor: '#DCEFE3',
  },
  shopLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  shopLabelSelected: {
    color: colors.receive,
  },
  hint: {
    color: colors.pending,
    fontSize: 16,
    fontWeight: '600',
  },
  currentBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  currentLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.muted,
  },
  or: {
    marginTop: space.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    paddingHorizontal: space.md,
    fontSize: 18,
    color: colors.text,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  chooseList: {
    maxHeight: 360,
  },
});
