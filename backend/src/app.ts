import cors from "cors";
import express, { type Express } from "express";

import { loadTwilioVoiceEnv } from "./config/env.js";
import { registerTestRingRoutes } from "./routes/testRing.js";
import { registerVoiceRoutes } from "./routes/voice.js";
import { createVoiceAccessToken } from "./services/createVoiceAccessToken.js";

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  /** Vercel y navegador abren GET /; sin esto Express responde "Cannot GET /". */
  app.get("/", (_req, res) => {
    res.status(200).json({
      name: "fresenius-softphone-api",
      ok: true,
      hint: "API Twilio Voice: las rutas útiles no son la raíz.",
      routes: {
        health: "GET /health",
        voiceWebhook: "POST /voice",
        accessToken:
          "GET /get-token?identity=u_<uuid_hex_sin_guiones>&platform=android",
        ringMobileTest:
          "POST /test/ring-mobile (JSON: { \"secret\": \"...\", \"clientIdentity\": \"opcional\" })",
        twimlAfterAnswer: "GET|POST /twilio/call-answered-say",
      },
    });
  });

  registerVoiceRoutes(app);
  registerTestRingRoutes(app);

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  /**
   * GET /get-token?identity=agente1&platform=ios|android
   */
  app.get("/get-token", (req, res) => {
    try {
      const identityRaw = req.query.identity;
      if (typeof identityRaw !== "string" || identityRaw.trim() === "") {
        res.status(400).json({ error: "Query param 'identity' is required." });
        return;
      }

      const identity = identityRaw.trim();
      if (identity.length > 128) {
        res.status(400).json({ error: "Identity is too long (max 128)." });
        return;
      }

      const env = loadTwilioVoiceEnv();

      const platform =
        typeof req.query.platform === "string"
          ? req.query.platform.toLowerCase()
          : "";

      const pushFromQuery =
        typeof req.query.push_credential_sid === "string"
          ? req.query.push_credential_sid.trim()
          : "";

      let pushCredentialSid = pushFromQuery;
      if (!pushCredentialSid) {
        if (platform === "ios") pushCredentialSid = env.pushCredentialSidIos;
        else if (platform === "android")
          pushCredentialSid = env.pushCredentialSidAndroid;
      }

      const token = createVoiceAccessToken({
        accountSid: env.accountSid,
        apiKeySid: env.apiKeySid,
        apiKeySecret: env.apiKeySecret,
        twimlAppSid: env.twimlAppSid,
        identity,
        ...(pushCredentialSid ? { pushCredentialSid } : {}),
      });

      res.status(200).json({
        token,
        identity,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  return app;
}

/** Vercel usa `src/app.ts` como handler Express (ver .vc-config handler). */
export default createApp();
