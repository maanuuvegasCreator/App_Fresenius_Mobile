import { loadTwilioVoiceEnv } from "./env.js";

/**
 * Mapa opcional: número Twilio llamado (E.164, p. ej. "+34900123456") → identidad Client
 * a la que Twilio debe enrutar la llamada entrante PSTN.
 *
 * JSON en una sola línea, p. ej.:
 * {"+34900123456":"u_abc...","+34900999888":"u_def..."}
 */
export function loadInboundToClientIdentityMap(): Map<string, string> {
  const raw = process.env.INBOUND_TO_CLIENT_IDENTITY_JSON?.trim();
  if (!raw) return new Map();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return new Map();
    }
    const m = new Map<string, string>();
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === "string" && typeof v === "string") {
        const key = k.trim();
        const val = v.trim();
        if (key && val) {
          m.set(key, val);
        }
      }
    }
    return m;
  } catch {
    return new Map();
  }
}

export function resolveInboundClientIdentity(
  calledNumber: string,
  inboundMap: Map<string, string>,
  fallback: string,
): string {
  const to = calledNumber.trim();
  if (!to) {
    return fallback;
  }
  if (inboundMap.has(to)) {
    return inboundMap.get(to)!;
  }
  const noSpace = to.replace(/\s+/g, "");
  if (inboundMap.has(noSpace)) {
    return inboundMap.get(noSpace)!;
  }
  return fallback;
}

export function loadVoiceDialEnv() {
  const twilio = loadTwilioVoiceEnv();
  return {
    ...twilio,
    callerId: process.env.TWILIO_CALLER_ID?.trim() ?? "",
    defaultInboundClientIdentity:
      process.env.DEFAULT_INBOUND_CLIENT_IDENTITY?.trim() || "pedro_castro",
  };
}
