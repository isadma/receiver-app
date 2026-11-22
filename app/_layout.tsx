import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ApiProvider } from '../src/context/ApiContext';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApiProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '800', fontSize: 20 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Receiver' }} />
          <Stack.Screen name="receive" options={{ title: 'Receive' }} />
          <Stack.Screen name="data" options={{ title: 'Data' }} />
        </Stack>
      </ApiProvider>
    </GestureHandlerRootView>
  );
}
