import { useEffect, useState } from "react"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { supabase } from "@/services/supabase"

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        error,
      })
    })

    // Escutar mudanças na auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setAuthState((prev) => ({ ...prev, error }))
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthState((prev) => ({ ...prev, error }))
    }
  }

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!authState.user,
  }
}
