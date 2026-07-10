import { supabase } from "@/lib/supabase";

// POST vers nos routes /api/* avec le jeton de session Supabase.
export async function apiPost(url: string, body: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
