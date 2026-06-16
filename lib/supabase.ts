import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service_role key.
// IMPORTANT: never import this from a client component — the service_role key
// must never reach the browser. This module is server-only.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isValidHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

const urlIsValid = isValidHttpUrl(url);
if (url && !urlIsValid) {
  // Common mistake: pasting an API key into the URL slot. Fail loudly but
  // don't crash the request — the route degrades to persisted:false.
  console.error(
    `NEXT_PUBLIC_SUPABASE_URL is set but not a valid http(s) URL ("${url.slice(0, 12)}…"). ` +
      "Expected something like https://<project-ref>.supabase.co"
  );
}

export const isSupabaseConfigured = Boolean(urlIsValid && serviceRoleKey);

let client: SupabaseClient | null = null;

// Returns a singleton server client, or null when env vars aren't set yet
// (lets the POC run locally before Supabase is provisioned).
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
