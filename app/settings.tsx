import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, resetDemo } from '../src/api';
import { Button } from '../src/components/Button';
import { useApi } from '../src/context/ApiContext';
import { useLocale } from '../src/context/LocaleContext';
import { useSettings } from '../src/context/SettingsContext';
import type { Locale } from '../src/i18n/translations';
import { colors, radius, space } from '../src/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useLocale();
  const { allowSameLotScan, setAllowSameLotScan } = useSettings();
  const { baseUrl } = useApi();
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languages: { id: Locale; label: string }[] = [
    { id: 'ru', label: t('russian') },
    { id: 'en', label: t('english') },
  ];

  const runReset = async () => {
    setResetting(true);
    setError(null);

    try {
      await resetDemo(baseUrl);
      setConfirmReset(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.displayMessage : t('resetDemoFailed'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{t('allowSameLotScan')}</Text>
          <Text style={styles.rowHint}>{t('allowSameLotScanHint')}</Text>
        </View>
        <Switch
          value={allowSameLotScan}
          onValueChange={(value) => void setAllowSameLotScan(value)}
          trackColor={{ false: colors.border, true: '#9FCFB0' }}
          thumbColor={allowSameLotScan ? colors.receive : '#F4F3F4'}
        />
      </View>

      <Text style={styles.section}>{t('language')}</Text>
      <View style={styles.langs}>
        {languages.map((item) => {
          const selected = locale === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => void setLocale(item.id)}
              style={[styles.langButton, selected && styles.langSelected]}
            >
              <Text style={[styles.langLabel, selected && styles.langLabelSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label={t('resetDemo')} variant="danger" onPress={() => setConfirmReset(true)} />

      <Modal
        visible={confirmReset}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!resetting) {
            setConfirmReset(false);
          }
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t('resetDemoTitle')}</Text>
            <Text style={styles.confirmBody}>{t('resetDemoBody')}</Text>
            <Button
              label={t('resetDemo')}
              variant="danger"
              loading={resetting}
              onPress={() => void runReset()}
            />
            <Button
              label={t('cancel')}
              variant="ghost"
              disabled={resetting}
              onPress={() => setConfirmReset(false)}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.md,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  rowHint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  section: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: space.xs,
  },
  langs: {
    flexDirection: 'row',
    gap: space.sm,
  },
  langButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSelected: {
    borderColor: colors.receive,
    backgroundColor: '#DCEFE3',
  },
  langLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  langLabelSelected: {
    color: colors.receive,
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
  confirmCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  confirmTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  confirmBody: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: space.xs,
  },
});
