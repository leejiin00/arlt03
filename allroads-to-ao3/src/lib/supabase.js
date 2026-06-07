import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function adminApi(action, payload = null, id = null) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non authentifié')

  const res = await fetch(
    `${supabaseUrl}/functions/v1/admin-fanfictions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ action, payload, id }),
    }
  )

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')
  return json
}
