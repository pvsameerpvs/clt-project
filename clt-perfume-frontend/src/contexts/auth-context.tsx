"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  session: Session | null
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true
    let unsubscribe = () => {}
    let loadingFallback: ReturnType<typeof setTimeout> | null = null
    let supabase: ReturnType<typeof createClient> | null = null

    try {
      supabase = createClient()
    } catch (error) {
      console.error('Error creating auth client:', error)
      queueMicrotask(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })
      return
    }

    if (!supabase) {
      queueMicrotask(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })
      return
    }

    const finishLoading = () => {
      if (!isActive) return
      if (loadingFallback) {
        clearTimeout(loadingFallback)
        loadingFallback = null
      }
      setIsLoading(false)
    }

    const syncAdminRole = async (nextUser: User | null) => {
      if (!isActive) return

      if (!nextUser) {
        setIsAdmin(false)
        return
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', nextUser.id)
          .maybeSingle()
        if (!isActive) return
        setIsAdmin(profile?.role === 'admin')
      } catch (error) {
        if (!isActive) return
        console.error('Error loading admin role:', error)
        setIsAdmin(false)
      }
    }

    loadingFallback = setTimeout(() => {
      finishLoading()
    }, 3000)

    const bootstrapSession = async () => {
      try {
        const sessionResult = await supabase.auth.getSession()
        const session: Session | null = sessionResult.data.session ?? null

        if (!isActive) return
        setSession(session)
        finishLoading()
        void syncAdminRole(session?.user ?? null)
      } catch (error: unknown) {
        if (!isActive) return
        console.error('Error checking auth state:', error)
        finishLoading()
      }
    }

    void bootstrapSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!isActive) return

      setSession(session)
      finishLoading()
      void syncAdminRole(session?.user ?? null)
    })

    unsubscribe = () => {
      subscription.unsubscribe()
    }

    return () => {
      isActive = false
      if (loadingFallback) {
        clearTimeout(loadingFallback)
      }
      unsubscribe()
    }
  }, [])

  const user = session?.user ?? null
  const accessToken = session?.access_token ?? null

  return (
    <AuthContext.Provider value={{ session, user, accessToken, isLoading, isAdmin }}>
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
