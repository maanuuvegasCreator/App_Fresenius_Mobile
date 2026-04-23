import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import type { CallRecord } from '../types/call';
import { C } from '../theme/colors';

type Props = { item: CallRecord };

function iconFor(direction: CallRecord['direction']): {
  name: 'call-made' | 'call-received' | 'call-missed';
  color: string;
} {
  switch (direction) {
    case 'outgoing':
      return { name: 'call-made', color: C.outgoing };
    case 'incoming':
      return { name: 'call-received', color: C.incoming };
    case 'missed':
      return { name: 'call-missed', color: C.missed };
  }
}

export function CallListItem({ item }: Props) {
  const icon = iconFor(item.direction);
  const sub =
    item.direction === 'missed'
      ? item.number
      : [item.number, item.durationLabel].filter(Boolean).join(' • ');

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon.name} size={26} color={icon.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Text style={styles.time}>{item.timeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    marginRight: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { minWidth: 0, flex: 1, paddingRight: 8 },
  name: { fontSize: 16, fontWeight: '600', color: C.ink },
  sub: { marginTop: 2, fontSize: 14, color: C.sub },
  time: { fontSize: 11, color: C.sub },
});
