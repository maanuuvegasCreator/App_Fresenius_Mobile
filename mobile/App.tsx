import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { VoiceBootstrapBanner } from './src/components/VoiceBootstrapBanner';
import { twilioClientIdentityForUser } from './src/lib/voiceIdentity';
import { MainTabs } from './src/navigation/MainTabs';
import { LoginScreen } from './src/screens/LoginScreen';
import { C } from './src/theme/colors';
import { TwilioVoiceProvider } from './src/voice/TwilioVoiceContext';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

function AppShell() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: C.white,
        }}>
        <ActivityIndicator size="large" color={C.loginPrimary} />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />
        <LoginScreen />
      </>
    );
  }

  const voiceIdentity = twilioClientIdentityForUser(session.user.id);

  return (
    <TwilioVoiceProvider voiceIdentity={voiceIdentity}>
      <NavigationContainer theme={navTheme}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={{ flex: 1 }}>
          <VoiceBootstrapBanner />
          <View style={{ flex: 1 }}>
            <MainTabs />
          </View>
        </View>
      </NavigationContainer>
    </TwilioVoiceProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
