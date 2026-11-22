import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ApiProvider } from '../src/context/ApiContext';
import { LocaleProvider, useLocale } from '../src/context/LocaleContext';
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
      <Stack.Screen name="index" options={{ title: t('homeTitle') }} />
      <Stack.Screen name="receive" options={{ title: t('receiveTitle') }} />
      <Stack.Screen name="data" options={{ title: t('dataTitle') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocaleProvider>
        <ApiProvider>
          <StatusBar style="dark" />
          <AppStack />
        </ApiProvider>
      </LocaleProvider>
    </GestureHandlerRootView>
  );
}
