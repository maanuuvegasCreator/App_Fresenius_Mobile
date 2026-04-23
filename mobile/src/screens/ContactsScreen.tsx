import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAgents } from '../hooks/useAgents';
import { C } from '../theme/colors';

function dial(phone: string) {
  const n = phone.replace(/\s/g, '');
  void Linking.openURL(`tel:${n}`);
}

export function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const { contacts, loading, error } = useAgents();
  const count = contacts.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Contactos</Text>
        {count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        ) : null}
      </View>

      {loading && contacts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.blue} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay agentes en la base de datos.</Text>
              <Text style={styles.emptyHint}>
                Ejecuta en Supabase el script supabase-schema-app-data.sql
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.meta} numberOfLines={2}>
                {item.role} · {item.department}
              </Text>
              <Text style={styles.company}>{item.company}</Text>
            </View>
            <Pressable
              style={styles.callIcon}
              onPress={() => dial(item.phone)}
              accessibilityLabel={`Llamar a ${item.name}`}>
              <Ionicons name="call" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  centered: { paddingVertical: 40, alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: C.ink },
  badge: {
    height: 24,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: C.missed,
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: C.white },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: C.redBorder,
  },
  bannerText: { fontSize: 13, color: C.redText },
  empty: { paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: C.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontSize: 13, color: C.sub, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    marginRight: 12,
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90, 200, 250, 0.35)',
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: C.blue },
  body: { minWidth: 0, flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: C.ink },
  phone: { marginTop: 2, fontSize: 14, color: C.sub },
  meta: { marginTop: 2, fontSize: 12, color: C.ink, fontWeight: '500' },
  company: { marginTop: 2, fontSize: 11, color: C.sub },
  callIcon: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.teal,
  },
});
