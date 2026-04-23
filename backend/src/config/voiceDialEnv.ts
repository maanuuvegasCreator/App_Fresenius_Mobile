import { loadTwilioVoiceEnv } from "./env.js";

export function loadVoiceDialEnv() {
  const twilio = loadTwilioVoiceEnv();
  return {
    ...twilio,
    callerId: process.env.TWILIO_CALLER_ID?.trim() ?? "",
    defaultInboundClientIdentity:
      process.env.DEFAULT_INBOUND_CLIENT_IDENTITY?.trim() || "pedro_castro",
  };
}
