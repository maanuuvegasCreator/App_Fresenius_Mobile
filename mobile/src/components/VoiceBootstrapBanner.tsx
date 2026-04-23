import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { C } from '../theme/colors';
import { useTwilioVoice } from '../voice/TwilioVoiceContext';

export function VoiceBootstrapBanner() {
  const { error, ready } = useTwilioVoice();

  if (error) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={C.amberText} />
        <Text style={styles.loadingText}>Registrando voz Twilio…</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  errorBox: {
    borderBottomWidth: 1,
    borderBottomColor: C.redBorder,
    backgroundColor: C.redBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { textAlign: 'center', fontSize: 12, color: C.redText },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.amberBorder,
    backgroundColor: C.amberBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingText: { marginLeft: 8, fontSize: 12, color: C.amberText },
});
