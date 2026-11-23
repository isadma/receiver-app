import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale } from '../context/LocaleContext';
import { colors, space } from '../theme';

export function MenuButton() {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('menu')}
      hitSlop={12}
      onPress={() => router.push('/settings')}
      style={styles.button}
    >
      <Text style={styles.icon}>☰</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    marginLeft: 4,
  },
  icon: {
    fontSize: 28,
    lineHeight: 32,
    color: colors.text,
    fontWeight: '700',
  },
});
