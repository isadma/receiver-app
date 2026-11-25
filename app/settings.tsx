import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { useLocale } from '../src/context/LocaleContext';
import { useSettings } from '../src/context/SettingsContext';
import type { Locale } from '../src/i18n/translations';
import { colors, radius, space } from '../src/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useLocale();
  const { allowSameLotScan, setAllowSameLotScan } = useSettings();

  const languages: { id: Locale; label: string }[] = [
    { id: 'ru', label: t('russian') },
    { id: 'en', label: t('english') },
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <Button
        label={t('changeBoxShop')}
        variant="receive"
        onPress={() => router.push('/change-box-shop')}
      />
      <Button
        label={t('boxContents')}
        variant="data"
        onPress={() => router.push('/box-contents')}
      />

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
});
