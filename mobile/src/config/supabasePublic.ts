/**
 * Supabase (Auth + Postgres en la nube).
 * Authentication → Providers: activa Email si aún no está.
 *
 * SQL opcional para perfiles: ver `supabase-setup.sql` en la raíz del repo.
 */
export const SUPABASE_URL = 'https://aojeexvcmbpdawresunx.supabase.co';

/** Clave anon (solo cliente; nunca uses service_role aquí). */
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvamVleHZjbWJwZGF3cmVzdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzI2MzcsImV4cCI6MjA5MjQ0ODYzN30.VRsxVkX6aed5x4WMgCkxITQXcEo-n-MkDBps8L2l1LY';

export function isSupabaseConfigured(): boolean {
  const u = SUPABASE_URL.trim();
  const k = SUPABASE_ANON_KEY.trim();
  return (
    u.startsWith('https://') &&
    u.includes('supabase') &&
    k.length >= 32
  );
}
