/**
 * Identidad estable en Twilio Voice **por cuenta** (auth.users.id).
 * Así varias personas pueden usar el mismo móvil: al cerrar sesión y entrar otra,
 * el SDK se registra con otra identidad y las llamadas van al usuario activo.
 *
 * Formato: `u_` + UUID sin guiones (solo hex, válido como Client identity).
 */
export function twilioClientIdentityForUser(userId: string): string {
  const hex = userId.replace(/-/g, '').toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(hex)) {
    throw new Error('twilioClientIdentityForUser: userId no es un UUID esperado');
  }
  return `u_${hex}`;
}
