import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, space } from '../theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'characters';
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  autoFocus = false,
  autoCapitalize = 'none',
}: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoFocus={autoFocus}
        clearButtonMode="while-editing"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    minHeight: 56,
    paddingHorizontal: space.md,
    fontSize: 18,
    color: colors.text,
  },
});
