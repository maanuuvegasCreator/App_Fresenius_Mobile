/**
 * Identidad Twilio por usuario: implementación en `shared/twilioIdentity.ts` (re-export en lib).
 * El backend usa `DEFAULT_INBOUND_CLIENT_IDENTITY` solo como **reserva** si no hay mapa
 * `INBOUND_TO_CLIENT_IDENTITY_JSON` ni otro criterio de enrutado.
 */
export { twilioClientIdentityForUser } from '../lib/voiceIdentity';
