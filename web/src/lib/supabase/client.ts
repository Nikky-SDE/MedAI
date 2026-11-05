import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

let supabaseBrowserClient: SupabaseClient | undefined

export function createClient() {
  if (supabaseBrowserClient) return supabaseBrowserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Anon Key is missing from client environment.')
  }

  supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseKey)
  
  return supabaseBrowserClient
}
