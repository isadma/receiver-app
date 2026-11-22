import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space } from '../theme';
import { Button } from './Button';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14'] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
};

export function CameraScanner({ visible, onClose, onScanned }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const locked = useRef(false);

  useEffect(() => {
    if (visible) {
      locked.current = false;
    }
  }, [visible]);

  const handleBarcode = (result: BarcodeScanningResult) => {
    const value = result.data?.trim();
    if (!value || locked.current) {
      return;
    }

    locked.current = true;
    onScanned(value);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        {!permission?.granted ? (
          <View style={[styles.permission, { paddingTop: insets.top + space.lg }]}>
            <Text style={styles.title}>Camera access</Text>
            <Text style={styles.body}>
              Receiver uses the camera to read the barcode on a product label.
            </Text>
            <Button label="Allow camera" onPress={() => void requestPermission()} />
            <Button label="Close" variant="ghost" onPress={onClose} />
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
              onBarcodeScanned={handleBarcode}
            />
            <View style={[styles.overlay, { paddingTop: insets.top + space.md }]} pointerEvents="box-none">
              <Text style={styles.hint}>Point at the barcode on the label</Text>
              <View style={styles.frame} />
              <Pressable
                onPress={onClose}
                style={[styles.close, { bottom: insets.bottom + space.lg }]}
              >
                <Text style={styles.closeLabel}>Close</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permission: {
    flex: 1,
    backgroundColor: colors.background,
    padding: space.lg,
    gap: space.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.muted,
    marginBottom: space.md,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  frame: {
    marginTop: 80,
    width: 280,
    height: 160,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: radius.md,
  },
  close: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 56,
    minWidth: 160,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  closeLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
});
