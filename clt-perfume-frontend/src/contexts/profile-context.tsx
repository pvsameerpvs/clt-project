"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { ProfileRecord, ProfileGender, ProfileFormState } from "@/components/profile/profile-types"
import { toDateInputValue } from "@/components/profile/profile-utils"

interface ProfileContextType {
  user: User | null
  profile: ProfileRecord | null
  initials: string
  fullName: string
  loading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    try {
      // Check session first (fast, local)
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user
      
      if (!currentUser) {
        setUser(null)
        setProfile(null)
        router.replace("/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name,last_name,phone,date_of_birth,gender")
        .eq("id", currentUser.id)
        .maybeSingle()

      setUser(currentUser)
      setProfile(profileData as ProfileRecord | null)
    } catch (err) {
      console.error("Profile load error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Standard practice for React 19 to avoid cascading render warnings 
    // during initial mount when calling async functions that might resolve quickly.
    queueMicrotask(() => {
      loadProfile()
    })
  }, [])

  const fullName = useMemo(() => {
    const fromProfile = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim()
    if (fromProfile) return fromProfile
    return user?.email?.split("@")[0] || "Client Account"
  }, [profile, user])

  const initials = useMemo(() => {
    const first = (profile?.first_name || user?.email || "C").charAt(0)
    const last = (profile?.last_name || "").charAt(0)
    return `${first}${last}`.toUpperCase()
  }, [profile, user])

  return (
    <ProfileContext.Provider value={{ 
      user, 
      profile, 
      initials, 
      fullName, 
      loading,
      refreshProfile: loadProfile 
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}
