/**
 * Si es `true`, en modo desarrollo (`__DEV__`) la app usa `PUBLIC_API_BASE_URL` (p. ej. Vercel)
 * en lugar de `http://<PC>:3000`. Actívalo para probar Twilio desde un APK debug en el móvil
 * sin tener el backend local. Pon `false` si usas `npm run dev` en el PC con el API en :3000.
 */
export const DEV_USE_VERCEL_FOR_API = true;
