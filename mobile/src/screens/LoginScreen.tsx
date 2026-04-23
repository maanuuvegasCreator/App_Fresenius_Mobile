import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { C } from '../theme/colors';

const ACCESS_MAIL =
  'mailto:soporte@fresenius.example?subject=Solicitud%20de%20acceso%20app';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!email.trim()) {
      setError('Introduce tu correo.');
      return;
    }
    if (!password) {
      setError('Introduce tu contraseña.');
      return;
    }
    setBusy(true);
    const { error: err } = await signIn(email, password);
    setBusy(false);
    if (err) {
      setError(err);
    }
  }

  if (!configured) {
    return (
      <View style={[styles.shell, { paddingTop: insets.top + 24, paddingHorizontal: 24 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Ionicons name="call" size={20} color={C.white} />
          </View>
          <Text style={styles.brand}>AI Contact Experience</Text>
        </View>
        <Text style={styles.title}>Configuración necesaria</Text>
        <Text style={styles.subtitle}>
          Edita{' '}
          <Text style={{ fontWeight: '600' }}>src/config/supabasePublic.ts</Text> y pega la URL
          del proyecto y la clave anon/public de Supabase (Dashboard → Settings → API). Activa el
          proveedor Email en Authentication → Providers y crea un usuario de prueba en Users.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 8}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
          },
        ]}>
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Ionicons name="call" size={20} color={C.white} />
            </View>
            <Text style={styles.brand}>AI Contact Experience</Text>
          </View>

          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>
            Ingresa tus credenciales para acceder a tu cuenta
          </Text>

          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@ejemplo.com"
            placeholderTextColor={C.loginMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!busy}
          />

          <View style={styles.passwordHeader}>
            <Text style={styles.label}>Contraseña</Text>
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Recuperar contraseña',
                  'Pide a tu administrador que te envíe un enlace de restablecimiento o que verifique tu cuenta en Supabase (Authentication → Users).',
                );
              }}
              hitSlop={8}>
              <Text style={styles.linkMuted}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={C.loginMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!busy}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
            onPress={() => void onSubmit()}
            disabled={busy}>
            {busy ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.footerWrap}
            onPress={() => {
              void Linking.openURL(ACCESS_MAIL);
            }}>
            <Text style={styles.footer}>
              ¿No tienes una cuenta?{' '}
              <Text style={styles.footerStrong}>Solicitar acceso</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.white },
  shell: { flex: 1, backgroundColor: C.white },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.loginCardBorder,
    backgroundColor: C.white,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.loginPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brand: {
    fontSize: 15,
    fontWeight: '700',
    color: C.loginPrimary,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: C.loginPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: C.loginMuted,
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: C.loginPrimary,
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  linkMuted: {
    fontSize: 13,
    color: C.loginPrimary,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  input: {
    backgroundColor: C.loginInputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: C.loginPrimary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: C.missed,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: C.loginPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footerWrap: { marginTop: 28, alignSelf: 'center' },
  footer: {
    fontSize: 14,
    color: C.loginMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerStrong: {
    fontWeight: '700',
    color: C.loginPrimary,
  },
});
