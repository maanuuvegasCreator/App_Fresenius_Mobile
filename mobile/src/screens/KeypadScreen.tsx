import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { C } from '../theme/colors';
import { useTwilioVoice } from '../voice/TwilioVoiceContext';

type KeyDef = { digit: string; letters?: string };

const ROWS: KeyDef[][] = [
  [
    { digit: '1' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
  ],
  [
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
  ],
  [
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
  ],
  [{ digit: '*' }, { digit: '0', letters: '+' }, { digit: '#' }],
];

export function KeypadScreen() {
  const insets = useSafeAreaInsets();
  const { ready, connectPstn } = useTwilioVoice();
  const [digits, setDigits] = useState('');
  const [calling, setCalling] = useState(false);

  const canPlace = digits.length > 0 && ready && !calling;
  const showCallActive = digits.length > 0 && ready;

  const append = (d: string) => {
    setDigits((prev) => prev + d);
  };

  const backspace = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  const display = useMemo(() => {
    if (!digits) return ' ';
    return digits;
  }, [digits]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.dotRow}>
        <View style={styles.statusDot} />
      </View>

      <Text style={styles.prompt}>Introduce un número</Text>

      <Text style={styles.display}>{display}</Text>

      <View style={styles.padWrap}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((k) => (
              <Pressable
                key={k.digit}
                onPress={() => append(k.digit)}
                style={({ pressed }) => [styles.keyCell, pressed && styles.keyCellPressed]}>
                <Text style={styles.keyDigit}>{k.digit}</Text>
                {k.letters ? <Text style={styles.keyLetters}>{k.letters}</Text> : null}
              </Pressable>
            ))}
          </View>
        ))}

        <View style={styles.dialRow}>
          <Pressable
            onPress={backspace}
            disabled={!digits}
            style={styles.sideBtn}>
            <Text style={[styles.backspace, !digits && styles.backspaceDisabled]}>⌫</Text>
          </Pressable>

          <Pressable
            disabled={!canPlace}
            onPress={async () => {
              try {
                setCalling(true);
                await connectPstn(digits);
              } catch (e) {
                Alert.alert(
                  'Llamada',
                  e instanceof Error ? e.message : 'No se pudo iniciar la llamada',
                );
              } finally {
                setCalling(false);
              }
            }}
            style={[
              styles.callBtn,
              { backgroundColor: showCallActive ? C.outgoing : C.line },
            ]}>
            {calling ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="call" size={30} color="#FFFFFF" />
            )}
          </Pressable>

          <View style={styles.sideBtn} />
        </View>
      </View>

      <View style={{ height: insets.bottom + 72 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  dotRow: { alignItems: 'center', paddingTop: 8 },
  statusDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: C.missed },
  prompt: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '200',
    color: C.blueMuted,
  },
  display: {
    marginTop: 24,
    minHeight: 40,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 4,
    color: C.ink,
  },
  padWrap: { marginTop: 16, flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  keyRow: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyCell: {
    height: 80,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  keyCellPressed: { backgroundColor: C.card },
  keyDigit: { fontSize: 28, fontWeight: '300', color: C.ink },
  keyLetters: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    color: C.sub,
    textTransform: 'uppercase',
  },
  dialRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  sideBtn: { height: 56, width: 56, alignItems: 'center', justifyContent: 'center' },
  backspace: { fontSize: 22, color: C.ink },
  backspaceDisabled: { color: C.line },
  callBtn: {
    height: 64,
    width: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
