import type { Express, Request, Response } from "express";
import twilio from "twilio";

import { loadVoiceDialEnv } from "../config/voiceDialEnv.js";

type BindingRecord = {
  bindingType: string;
  address: string;
  updatedAt: string;
};

const bindings = new Map<string, BindingRecord>();

/**
 * Twilio Voice URL webhook (TwiML App → POST /voice).
 * - Outbound from mobile: From starts with "client:" → Dial PSTN (To).
 * - Inbound PSTN: Dial Twilio Client (DEFAULT_INBOUND_CLIENT_IDENTITY).
 */
export function registerVoiceRoutes(app: Express): void {
  app.post("/voice", (req: Request, res: Response) => {
    try {
      const env = loadVoiceDialEnv();
      const from = String(req.body?.From ?? "");
      const to = String(req.body?.To ?? "").trim();

      const vr = new twilio.twiml.VoiceResponse();

      if (from.startsWith("client:")) {
        if (!env.callerId) {
          vr.say(
            { language: "es-ES" },
            "Caller ID no configurado en el servidor.",
          );
          res.type("text/xml").status(500).send(vr.toString());
          return;
        }
        if (!to) {
          vr.say({ language: "es-ES" }, "Número de destino no válido.");
          res.type("text/xml").status(200).send(vr.toString());
          return;
        }

        const dial = vr.dial({ callerId: env.callerId });
        if (to.startsWith("client:")) {
          dial.client(to.replace(/^client:/, ""));
        } else {
          dial.number(to);
        }
      } else {
        const dial = vr.dial();
        dial.client(env.defaultInboundClientIdentity);
      }

      res.type("text/xml").status(200).send(vr.toString());
    } catch (err) {
      console.error("/voice error", err);
      const vr = new twilio.twiml.VoiceResponse();
      vr.say({ language: "es-ES" }, "Error del servidor.");
      res.type("text/xml").status(500).send(vr.toString());
    }
  });

  app.post("/register-binding", (req: Request, res: Response) => {
    try {
      const identity =
        typeof req.body?.identity === "string" ? req.body.identity.trim() : "";
      const bindingType =
        typeof req.body?.bindingType === "string"
          ? req.body.bindingType.trim()
          : "";
      const address =
        typeof req.body?.address === "string" ? req.body.address.trim() : "";

      if (!identity || !bindingType || !address) {
        res.status(400).json({
          error: "Campos requeridos: identity, bindingType, address.",
        });
        return;
      }

      bindings.set(identity, {
        bindingType,
        address,
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });
}
