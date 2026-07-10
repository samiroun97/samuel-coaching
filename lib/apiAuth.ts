import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vérifie le jeton Supabase envoyé par le client (header Authorization).
// Sans ça, les routes IA seraient appelables par n'importe qui sur internet
// et consommeraient la clé Anthropic.
export async function requireUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) return null;
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supa.auth.getUser(token);
  return error ? null : data.user;
}
