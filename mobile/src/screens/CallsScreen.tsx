import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CallListItem } from '../components/CallListItem';
import { useCallLogs } from '../hooks/useCallLogs';
import { C } from '../theme/colors';

export function CallsScreen() {
  const insets = useSafeAreaInsets();
  const { calls, loading, error } = useCallLogs();
  const [filter, setFilter] = useState<'all' | 'missed'>('all');

  const missedCount = useMemo(
    () => calls.filter((c) => c.direction === 'missed').length,
    [calls],
  );

  const data = useMemo(
    () =>
      filter === 'missed'
        ? calls.filter((c) => c.direction === 'missed')
        : calls,
    [filter, calls],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Llamadas</Text>
          {missedCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {missedCount > 9 ? '9+' : missedCount}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.segment}>
          <Pressable
            onPress={() => setFilter('all')}
            style={[styles.segmentBtn, filter === 'all' && styles.segmentBtnActive]}>
            <Text style={[styles.segmentLabel, filter === 'all' && styles.segmentLabelActive]}>
              Todas
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('missed')}
            style={[styles.segmentBtn, filter === 'missed' && styles.segmentBtnActive]}>
            <Text
              style={[
                styles.segmentLabel,
                filter === 'missed' && styles.segmentLabelActive,
              ]}>
              Perdidas
            </Text>
            {missedCount > 0 ? (
              <View style={styles.missedBadge}>
                <Text style={styles.missedBadgeText}>{missedCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      {loading && calls.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.blue} />
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CallListItem item={item} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay llamadas registradas.</Text>
              <Text style={styles.emptyHint}>
                El historial se guardará aquí cuando conectemos el registro de llamadas con
                Supabase.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  header: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '700', color: C.ink },
  badge: {
    marginLeft: 4,
    marginTop: -4,
    minWidth: 18,
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: C.missed,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: C.white, lineHeight: 12 },
  segment: {
    marginTop: 16,
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: C.card,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 8,
    gap: 4,
  },
  segmentBtnActive: { backgroundColor: C.ink },
  segmentLabel: { fontSize: 14, fontWeight: '600', color: C.ink },
  segmentLabelActive: { color: C.white },
  missedBadge: {
    minWidth: 22,
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: C.missed,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  missedBadgeText: { fontSize: 12, fontWeight: '700', color: C.white },
  centered: { paddingVertical: 32, alignItems: 'center' },
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
  empty: { paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: C.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontSize: 13, color: C.sub, textAlign: 'center' },
});
