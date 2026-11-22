import { forwardRef, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

type SearchInput = ComponentRef<typeof TextInput>;
import { colors, radius, space } from '../theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'characters';
};

export const SearchField = forwardRef<SearchInput, Props>(function SearchField(
  {
    value,
    onChangeText,
    placeholder,
    autoFocus = false,
    autoCapitalize = 'none',
  },
  ref,
) {
  return (
    <View style={styles.wrap}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoFocus={autoFocus}
        showSoftInputOnFocus
        returnKeyType="search"
        blurOnSubmit
        clearButtonMode="while-editing"
        style={styles.input}
      />
    </View>
  );
});

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
