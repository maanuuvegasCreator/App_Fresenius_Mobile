import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../auth/AuthContext';
import { initialsFromName } from '../lib/initials';
import { getSupabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../config/supabasePublic';

export type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  department: string | null;
  role: string | null;
  status: string | null;
};

export function useProfileRow(): {
  profile: ProfileRow | null;
  displayName: string;
  initials: string;
  email: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hadProfileRef = useRef(false);

  useEffect(() => {
    hadProfileRef.current = false;
    setProfile(null);
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured()) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (!hadProfileRef.current) {
      setLoading(true);
    }
    setError(null);
    const { data, error: qErr } = await getSupabase()
      .from('profiles')
      .select('full_name, phone, department, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (qErr) {
      setError(qErr.message);
      setProfile(null);
    } else {
      const row = data as ProfileRow | null;
      setProfile(row);
      if (row) {
        hadProfileRef.current = true;
      }
    }
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const email = user?.email ?? null;
  const fromEmail =
    email !== null && email !== ''
      ? (email.split('@')[0] ?? '').replace(/\./g, ' ')
      : '';
  const displayName =
    profile?.full_name?.trim() || fromEmail || 'Usuario';
  const initials = initialsFromName(displayName);

  return {
    profile,
    displayName,
    initials,
    email,
    loading,
    error,
    refresh,
  };
}
