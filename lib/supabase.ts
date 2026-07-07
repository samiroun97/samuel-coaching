import { createClient } from "@supabase/supabase-js";

function makeClient() {
  try {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } catch {
    return createClient(
      "https://placeholder.supabase.co",
      "placeholder-anon-key"
    );
  }
}

export const supabase = makeClient();
