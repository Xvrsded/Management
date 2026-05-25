import { supabase } from '@/lib/supabaseClient'

export const auth = {
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  }
}
