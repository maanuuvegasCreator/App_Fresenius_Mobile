/**
 * Identidad Twilio por usuario: `twilioClientIdentityForUser` en `src/lib/voiceIdentity.ts`.
 * El backend usa `DEFAULT_INBOUND_CLIENT_IDENTITY` solo como **reserva** si no hay mapa
 * `INBOUND_TO_CLIENT_IDENTITY_JSON` ni otro criterio de enrutado.
 */
export { twilioClientIdentityForUser } from '../lib/voiceIdentity';
