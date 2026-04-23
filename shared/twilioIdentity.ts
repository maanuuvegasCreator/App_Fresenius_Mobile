/**
 * Identidad Twilio Voice **por cuenta Supabase** (auth.users.id).
 * Compartido entre app móvil (React Native) y escritorio (Twilio Voice JS).
 *
 * Formato: `u_` + UUID sin guiones (hex minúsculas).
 */
export function twilioClientIdentityForUser(userId: string): string {
  const hex = userId.replace(/-/g, "").toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(hex)) {
    throw new Error("twilioClientIdentityForUser: userId no es un UUID esperado");
  }
  return `u_${hex}`;
}
