
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** True when both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. */
export const isSupabaseConfigured = Boolean(url && key)

/**
 * Central Supabase client. Null until the project is configured via .env.
 * All database / auth / storage access in the app goes through this client.
 */
export const supabase = isSupabaseConfigured ? createClient(url, key) : null

/** Storage buckets created by supabase/03-storage.sql */
export const BUCKETS = {
  public: 'public-media',
  documents: 'admission-documents',
}

/** Throws a friendly error when Supabase credentials are missing. */
export function sb() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
    )
  }
  return supabase
}
