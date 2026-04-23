function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadTwilioVoiceEnv() {
  return {
    accountSid: requireEnv("TWILIO_ACCOUNT_SID"),
    apiKeySid: requireEnv("TWILIO_API_KEY"),
    apiKeySecret: requireEnv("TWILIO_API_SECRET"),
    twimlAppSid: requireEnv("TWILIO_TWIML_APP_SID"),
    pushCredentialSidIos: process.env.TWILIO_PUSH_CREDENTIAL_SID_IOS?.trim() || "",
    pushCredentialSidAndroid:
      process.env.TWILIO_PUSH_CREDENTIAL_SID_ANDROID?.trim() || "",
  };
}

export function getPort(): number {
  const raw = process.env.PORT;
  if (!raw) return 3000;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 3000;
}
