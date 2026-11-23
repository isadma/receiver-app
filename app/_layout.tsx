import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuButton } from '../src/components/MenuButton';
import { ApiProvider } from '../src/context/ApiContext';
import { LocaleProvider, useLocale } from '../src/context/LocaleContext';
import { SettingsProvider } from '../src/context/SettingsContext';
import { colors } from '../src/theme';

function AppStack() {
  const { t } = useLocale();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('homeTitle'),
          headerLeft: () => <MenuButton />,
        }}
      />
      <Stack.Screen name="receive" options={{ title: t('receiveTitle') }} />
      <Stack.Screen name="data" options={{ title: t('dataTitle') }} />
      <Stack.Screen name="settings" options={{ title: t('settingsTitle') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocaleProvider>
        <SettingsProvider>
          <ApiProvider>
            <StatusBar style="dark" />
            <AppStack />
          </ApiProvider>
        </SettingsProvider>
      </LocaleProvider>
    </GestureHandlerRootView>
  );
}
