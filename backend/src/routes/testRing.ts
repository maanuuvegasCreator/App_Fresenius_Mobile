import type { Express, Request, Response } from "express";
import twilio from "twilio";

import { loadTwilioVoiceEnv } from "../config/env.js";
import { loadVoiceDialEnv } from "../config/voiceDialEnv.js";

/**
 * URL pública del propio API (Vercel envía x-forwarded-*).
 */
function publicBaseUrl(req: Request): string {
  const proto = (
    req.get("x-forwarded-proto") ||
    req.protocol ||
    "https"
  ).split(",")[0]!.trim();
  const host = (
    req.get("x-forwarded-host") ||
    req.get("host") ||
    ""
  ).split(",")[0]!.trim();
  if (!host) {
    return "";
  }
  return `${proto}://${host}`;
}

/**
 * TwiML cuando el cliente (app móvil) descuelga la llamada de prueba.
 */
export function registerTestRingRoutes(app: Express): void {
  app.post("/twilio/call-answered-say", (_req: Request, res: Response) => {
    const vr = new twilio.twiml.VoiceResponse();
    vr.say(
      { language: "es-ES" },
      "Prueba de llamada entrante. Puedes colgar cuando quieras.",
    );
    res.type("text/xml").status(200).send(vr.toString());
  });

  app.get("/twilio/call-answered-say", (_req: Request, res: Response) => {
    const vr = new twilio.twiml.VoiceResponse();
    vr.say(
      { language: "es-ES" },
      "Prueba de llamada entrante. Puedes colgar cuando quieras.",
    );
    res.type("text/xml").status(200).send(vr.toString());
  });

  /**
   * Hace que Twilio llame a la app móvil (Client) — útil para probar sin marcar el número Twilio.
   * Requiere RING_TEST_SECRET en el servidor y el mismo valor en body.secret o ?secret=
   *
   * curl -X POST "https://TU-API.vercel.app/test/ring-mobile" \
   *   -H "Content-Type: application/json" \
   *   -d "{\"secret\":\"TU_RING_TEST_SECRET\"}"
   */
  app.post("/test/ring-mobile", async (req: Request, res: Response) => {
    try {
      const expected = process.env.RING_TEST_SECRET?.trim();
      if (!expected) {
        res.status(503).json({
          error:
            "Configura RING_TEST_SECRET en .env / Vercel para usar esta prueba.",
        });
        return;
      }

      const fromBody =
        typeof req.body?.secret === "string" ? req.body.secret.trim() : "";
      const fromQuery =
        typeof req.query.secret === "string"
          ? String(req.query.secret).trim()
          : "";
      if (fromBody !== expected && fromQuery !== expected) {
        res.status(401).json({ error: "secret incorrecto o ausente." });
        return;
      }

      const env = loadTwilioVoiceEnv();
      const dial = loadVoiceDialEnv();
      if (!dial.callerId) {
        res.status(500).json({ error: "TWILIO_CALLER_ID no configurado." });
        return;
      }

      const base = publicBaseUrl(req);
      if (!base) {
        res.status(500).json({ error: "No se pudo determinar la URL pública del host." });
        return;
      }

      const twimlUrl = `${base}/twilio/call-answered-say`;
      const rawTarget =
        typeof req.body?.clientIdentity === "string"
          ? req.body.clientIdentity.trim()
          : "";
      const identity =
        /^[\w.-]{1,128}$/.test(rawTarget) && rawTarget.length <= 128
          ? rawTarget
          : dial.defaultInboundClientIdentity;
      const toClient = `client:${identity}`;

      const client = twilio(env.apiKeySid, env.apiKeySecret, {
        accountSid: env.accountSid,
      });

      const call = await client.calls.create({
        to: toClient,
        from: dial.callerId,
        url: twimlUrl,
        method: "POST",
      });

      res.status(200).json({
        ok: true,
        message:
          "Twilio está llamando a la app. Debe sonar en el móvil si hay sesión con esa identidad.",
        callSid: call.sid,
        dialed: toClient,
        clientIdentity: identity,
        twimlUrl,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("/test/ring-mobile", err);
      res.status(500).json({ error: message });
    }
  });
}
