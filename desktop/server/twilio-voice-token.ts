import twilio from "twilio";

import { getCallerAuth, twilioIdentityFromAuth } from "./auth-context";

export type VoiceTokenResult =
  | { ok: true; identity: string; token: string }
  | { ok: false; status: number; error: string };

/**
 * JWT de Twilio Voice (cliente Web) con API Key + Secret.
 * Identidad = `u_<uuid>` con JWT Supabase (misma regla que app móvil); mock cookie = legacy email.
 */
export async function issueTwilioVoiceAccessToken(
  req: Request,
  pushCredentialSid?: string | null,
): Promise<VoiceTokenResult> {
  const auth = await getCallerAuth(req);
  if (!auth) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioApiKey = process.env.TWILIO_API_KEY;
  const twilioApiSecret = process.env.TWILIO_API_SECRET;
  const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID;

  const identity = twilioIdentityFromAuth(auth);

  if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret || !outgoingApplicationSid) {
    return { ok: false, status: 500, error: "Missing Twilio environment variables" };
  }

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid,
    incomingAllow: true,
    pushCredentialSid: pushCredentialSid || undefined,
  });

  const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, { identity });
  token.addGrant(voiceGrant);

  return { ok: true, identity, token: token.toJwt() };
}
