import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkAdmin = async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false)
      return false
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch user role:', error.message)
      setIsAdmin(false)
      return false
    }

    const admin = data?.role === 'admin'
    setIsAdmin(admin)
    return admin
  }

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)
      await checkAdmin(currentUser)
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      void checkAdmin(currentUser)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshAdminStatus = async () => checkAdmin(user)

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signUp, signIn, signOut, refreshAdminStatus }}>
      {children}
    </AuthContext.Provider>
  )
}
