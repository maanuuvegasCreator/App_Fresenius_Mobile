import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, Platform } from 'react-native';
import { Voice } from '@twilio/voice-react-native-sdk';

import { getApiBaseUrl } from '../config/api';
import { VOICE_AGENT_IDENTITY } from '../config/voice';

function toE164(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('+')) return t;
  if (/^\d+$/.test(t)) return `+${t}`;
  return t;
}

type TwilioVoiceContextValue = {
  voice: Voice;
  identity: string;
  ready: boolean;
  error: string | null;
  connectPstn: (digits: string) => Promise<void>;
};

const TwilioVoiceContext = createContext<TwilioVoiceContextValue | null>(null);

export function TwilioVoiceProvider({ children }: { children: ReactNode }) {
  const voiceRef = useRef(new Voice());
  const tokenRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const voice = voiceRef.current;

    const onInvite = (invite: import('@twilio/voice-react-native-sdk').CallInvite) => {
      const from = invite.getFrom();
      Alert.alert('Llamada entrante', from || 'Desconocido', [
        { text: 'Rechazar', style: 'cancel', onPress: () => void invite.reject() },
        { text: 'Contestar', onPress: () => void invite.accept() },
      ]);
    };

    voice.on(Voice.Event.CallInvite, onInvite);
    voice.on(Voice.Event.Error, (e) => {
      setError('message' in e && typeof e.message === 'string' ? e.message : String(e));
    });

    let cancelled = false;

    async function bootstrap() {
      try {
        const qs = new URLSearchParams({
          identity: VOICE_AGENT_IDENTITY,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/get-token?${qs.toString()}`);
        if (!res.ok) {
          throw new Error(`Token HTTP ${res.status}`);
        }
        const data = (await res.json()) as { token: string; identity: string };
        if (cancelled) return;

        tokenRef.current = data.token;
        await voice.register(data.token);

        if (Platform.OS === 'ios') {
          try {
            await voice.initializePushRegistry();
          } catch {
            /* PushKit opcional si ya gestiona la app */
          }
        }

        const deviceToken = await voice.getDeviceToken().catch(() => null);
        if (deviceToken) {
          await fetch(`${base}/register-binding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identity: data.identity,
              bindingType: Platform.OS === 'ios' ? 'apn' : 'fcm',
              address: deviceToken,
            }),
          });
        }

        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      const t = tokenRef.current;
      if (t) {
        void voice.unregister(t).catch(() => undefined);
      }
    };
  }, []);

  const connectPstn = useCallback(async (digits: string) => {
    const token = tokenRef.current;
    if (!token) {
      throw new Error('Token de voz no disponible');
    }
    const To = toE164(digits);
    await voiceRef.current.connect(token, {
      params: { To },
      contactHandle: To,
      notificationDisplayName: To,
    });
  }, []);

  const value = useMemo<TwilioVoiceContextValue>(
    () => ({
      voice: voiceRef.current,
      identity: VOICE_AGENT_IDENTITY,
      ready,
      error,
      connectPstn,
    }),
    [ready, error, connectPstn],
  );

  return (
    <TwilioVoiceContext.Provider value={value}>{children}</TwilioVoiceContext.Provider>
  );
}

export function useTwilioVoice(): TwilioVoiceContextValue {
  const ctx = useContext(TwilioVoiceContext);
  if (!ctx) {
    throw new Error('useTwilioVoice debe usarse dentro de TwilioVoiceProvider');
  }
  return ctx;
}
