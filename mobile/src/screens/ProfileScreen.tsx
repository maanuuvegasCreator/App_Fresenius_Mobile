import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { useProfileRow } from '../hooks/useProfileRow';
import { C } from '../theme/colors';

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { profile, displayName, initials, email, loading, error } = useProfileRow();

  const phone = profile?.phone?.trim() || '—';
  const status = profile?.status?.trim() || '—';
  const department = profile?.department?.trim() || '—';
  const role = profile?.role?.trim() || '—';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 100,
      }}>
      <Text style={styles.screenTitle}>Mi perfil</Text>

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      {loading && !profile ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={C.blue} />
        </View>
      ) : null}

      <View style={styles.identity}>
        <View style={styles.bigAvatar}>
          <Text style={styles.bigAvatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileMeta}>{email ?? '—'}</Text>
        <Text style={styles.profileMeta}>{phone}</Text>
      </View>

      <View style={styles.cards}>
        <InfoCard label="Estado" value={status} />
        <InfoCard label="Departamento" value={department} />
        <InfoCard label="Rol" value={role} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}
        onPress={() => void signOut()}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.white },
  screenTitle: { fontSize: 28, fontWeight: '700', color: C.ink },
  banner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: C.redBorder,
  },
  bannerText: { fontSize: 13, color: C.redText },
  loader: { marginTop: 24, alignItems: 'center' },
  identity: { marginTop: 32, alignItems: 'center' },
  bigAvatar: {
    height: 112,
    width: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  bigAvatarText: { fontSize: 28, fontWeight: '600', color: C.blue },
  profileName: { marginTop: 16, fontSize: 20, fontWeight: '700', color: C.ink },
  profileMeta: { marginTop: 4, fontSize: 14, color: C.sub },
  cards: { marginTop: 40 },
  card: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardLabel: { fontSize: 14, color: C.sub },
  cardValue: { marginTop: 4, fontSize: 16, fontWeight: '500', color: C.ink },
  signOut: {
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: C.missed },
});
