import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const refreshProfile = useCallback(async () => {
    if (!supabase) return null
    const { data: userData, error: uErr } = await supabase.auth.getUser()
    if (uErr || !userData?.user) {
      setProfile(null)
      return null
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single()
    setProfile(data || null)
    return data
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        if (!data.session) setLoading(false)
      })
      .catch(() => setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      refreshProfile().finally(() => setLoading(false))
    }
  }, [session, refreshProfile])

  const isAdmin = profile?.role === 'admin'

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured. Add your credentials to .env first.')
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    try {
      await supabase?.auth.signOut()
    } finally {
      setProfile(null)
      setSession(null)
    }
  }

  return (
    <AuthCtx.Provider value={{ session, profile, loading, isAdmin, signIn, signOut, refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
