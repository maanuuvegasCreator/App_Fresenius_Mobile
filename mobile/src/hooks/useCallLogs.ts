import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { CallRecord } from '../types/call';
import { useAuth } from '../auth/AuthContext';
import { getSupabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../config/supabasePublic';

type CallLogRow = {
  id: string;
  peer_name: string;
  phone: string;
  direction: 'outgoing' | 'incoming' | 'missed';
  occurred_at: string;
  duration_label: string | null;
};

function formatTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'Ayer';
  if (!sameDay) {
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
  return d.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' });
}

export function useCallLogs(): {
  calls: CallRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const callsRef = useRef<CallRecord[]>([]);
  callsRef.current = calls;

  const refresh = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured()) {
      setCalls([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (callsRef.current.length === 0) {
      setLoading(true);
    }
    setError(null);
    const { data, error: qErr } = await getSupabase()
      .from('call_logs')
      .select('id, peer_name, phone, direction, occurred_at, duration_label')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(100);

    if (qErr) {
      setError(qErr.message);
      setCalls([]);
    } else {
      const rows = (data ?? []) as CallLogRow[];
      setCalls(
        rows.map((r) => ({
          id: r.id,
          name: r.peer_name,
          number: r.phone,
          direction: r.direction,
          timeLabel: formatTimeLabel(r.occurred_at),
          durationLabel: r.duration_label ?? undefined,
        })),
      );
    }
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { calls, loading, error, refresh };
}
