import "dotenv/config";

import app from "./app.js";
import { getPort } from "./config/env.js";

/** En Vercel la plataforma enruta al handler; en local arrancamos el servidor. */
if (process.env.VERCEL !== "1") {
  const port = getPort();
  app.listen(port, () => {
    console.log(`Fresenius softphone API listening on http://localhost:${port}`);
  });
}

export default app;
