import twilio from "twilio";

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

export type VoiceTokenParams = {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
  twimlAppSid: string;
  identity: string;
  pushCredentialSid?: string;
};

export function createVoiceAccessToken(params: VoiceTokenParams): string {
  const token = new AccessToken(
    params.accountSid,
    params.apiKeySid,
    params.apiKeySecret,
    { identity: params.identity, ttl: 3600 },
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: params.twimlAppSid,
    incomingAllow: true,
    ...(params.pushCredentialSid
      ? { pushCredentialSid: params.pushCredentialSid }
      : {}),
  });

  token.addGrant(voiceGrant);
  return token.toJwt();
}
