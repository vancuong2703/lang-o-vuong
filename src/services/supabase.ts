import { createClient } from '@supabase/supabase-js'

// The publishable key is safe to ship to browsers: RLS + RPC checks protect the data.
// NEVER put a secret / service_role key here.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY trong .env.local')
}

export const supabase = createClient(url, key)
