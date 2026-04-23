import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { Contact } from '../types/contact';
import { initialsFromName } from '../lib/initials';
import { getSupabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../config/supabasePublic';

type AgentRow = {
  id: string;
  full_name: string;
  phone: string;
  company: string | null;
  department: string | null;
  role: string | null;
};

export function useAgents(): {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contactsRef = useRef<Contact[]>([]);
  contactsRef.current = contacts;

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setContacts([]);
      setError('Supabase no configurado');
      setLoading(false);
      return;
    }
    if (contactsRef.current.length === 0) {
      setLoading(true);
    }
    setError(null);
    const { data, error: qErr } = await getSupabase()
      .from('agents')
      .select('id, full_name, phone, company, department, role')
      .order('sort_order', { ascending: true })
      .order('full_name', { ascending: true });

    if (qErr) {
      setError(qErr.message);
      setContacts([]);
    } else {
      const rows = (data ?? []) as AgentRow[];
      setContacts(
        rows.map((r) => ({
          id: r.id,
          initials: initialsFromName(r.full_name),
          name: r.full_name,
          phone: r.phone,
          company: r.company?.trim() || 'Fresenius Medical Care España',
          department: r.department?.trim() || '—',
          role: r.role?.trim() || '—',
        })),
      );
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { contacts, loading, error, refresh };
}
