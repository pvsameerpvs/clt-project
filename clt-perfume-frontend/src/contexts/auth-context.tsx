"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true
    let unsubscribe = () => {}
    let supabase: ReturnType<typeof createClient> | null = null
    try {
      supabase = createClient()
    } catch (error) {
      console.error('Error creating auth client:', error)
      setIsLoading(false)
      return
    }

    if (!supabase) {
      setIsLoading(false)
      return
    }

    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!isActive) return
        setUser(user)
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (!isActive) return
          setIsAdmin(profile?.role === 'admin')
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        if (!isActive) return
        console.error('Error checking auth state:', error)
      } finally {
        if (!isActive) return
        setIsLoading(false)
      }
    }

    void checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (!isActive) return
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (!isActive) return
        setIsAdmin(profile?.role === 'admin')
      } else {
        setIsAdmin(false)
      }
      setIsLoading(false)
    })

    unsubscribe = () => {
      subscription.unsubscribe()
    }

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
