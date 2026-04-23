import { twilioClientIdentityForUser } from "../../shared/twilioIdentity";

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
}

function supabaseAnon() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
}

export type CallerAuth =
  | { kind: "supabase"; userId: string; email: string | null }
  | { kind: "mock_email"; email: string };

/** Usuario GoTrue a partir del JWT (REST). */
async function getUserFromAccessToken(
  accessToken: string,
): Promise<{ id: string; email: string | null } | null> {
  const url = supabaseUrl();
  const anon = supabaseAnon();
  if (!url || !anon) return null;
  const base = url.replace(/\/$/, "");
  const res = await fetch(`${base}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anon,
    },
  });
  if (!res.ok) return null;
  try {
    const body = (await res.json()) as { id?: string; email?: string | null };
    if (typeof body.id !== "string" || !body.id) return null;
    return { id: body.id, email: body.email ?? null };
  } catch {
    return null;
  }
}

/**
 * Identidad Twilio Client alineada con la app móvil (`u_<uuid>`) si hay JWT Supabase.
 * Modo cookie `mock_agent_email` mantiene identidad legacy por email (solo desarrollo).
 */
export async function getCallerAuth(req: Request): Promise<CallerAuth | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7);
    const user = await getUserFromAccessToken(bearerToken);
    if (!user) return null;
    return { kind: "supabase", userId: user.id, email: user.email };
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)mock_agent_email=([^;]+)/);
  if (match?.[1]) {
    return { kind: "mock_email", email: decodeURIComponent(match[1]) };
  }
  return null;
}

export function twilioIdentityFromAuth(auth: CallerAuth): string {
  if (auth.kind === "supabase") {
    return twilioClientIdentityForUser(auth.userId);
  }
  return auth.email.replace(/[^a-zA-Z0-9-_]/g, "_");
}

/** Email del usuario autenticado (Bearer JWT) o cookie mock_agent_email. */
export async function getCallerEmailFromRequest(req: Request): Promise<string | null> {
  const auth = await getCallerAuth(req);
  if (!auth) return null;
  if (auth.kind === "supabase") return auth.email;
  return auth.email;
}
