import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPER_ADMIN_EMAIL = "choyjiez07@gmail.com";

const buildTimeUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const buildTimeKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

let activeClient: SupabaseClient | null =
  buildTimeUrl && buildTimeKey
    ? createClient(buildTimeUrl, buildTimeKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

let activeUrl = buildTimeUrl;

export function getSupabaseClient(): SupabaseClient | null {
  return activeClient;
}

export function getSupabaseProjectLabel(): string {
  if (!activeUrl) return "Supabase (Pending Env Vars)";
  try {
    return new URL(activeUrl).hostname;
  } catch {
    return activeUrl;
  }
}

export async function ensureSupabaseClient(): Promise<SupabaseClient | null> {
  if (activeClient) return activeClient;

  try {
    const res = await fetch("/api/supabase-config");
    if (!res.ok) return null;
    const data = (await res.json()) as {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    };
    const url = (data.supabaseUrl || "").trim();
    const key = (data.supabaseAnonKey || "").trim();
    if (url && key) {
      activeUrl = url;
      activeClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return activeClient;
    }
  } catch (error) {
    console.warn("Runtime Supabase config fetch skipped:", error);
  }
  return null;
}

export interface AppAuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  isAnonymous?: boolean;
}
