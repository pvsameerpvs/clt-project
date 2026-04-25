"use client"

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"
import { ProfileRecord } from "@/components/profile/profile-types"
import { CheckoutAddress, UserAddressRow } from "@/app/checkout/checkout-types"
import { mapUserAddressRow } from "@/app/checkout/checkout-utils"

const PROFILE_QUERY_TIMEOUT_MS = 3000

interface SupabaseResponse<T = unknown> {
  data: T | null
  error: unknown
}

async function withProfileQueryTimeout<T extends object>(
  query: PromiseLike<T>,
  label: string
): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  try {
    return await Promise.race([
      Promise.resolve(query),
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn(`[Profile] ${label} timed out after ${PROFILE_QUERY_TIMEOUT_MS}ms`)
          resolve(null)
        }, PROFILE_QUERY_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

interface ProfileContextType {
  user: User | null
  profile: ProfileRecord | null
  addresses: CheckoutAddress[]
  initials: string
  fullName: string
  loading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)
 
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isLoading: authLoading } = useAuth()
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([])
  const [loading, setLoading] = useState(true)
  const requestIdRef = useRef(0)
 
  const loadProfileData = useCallback(async (currentUser: User) => {
    const requestId = ++requestIdRef.current

    try {
      setUser(currentUser)
      setProfile(null)
      setAddresses([])
      setLoading(true)

      const supabase = createClient()

      const [profileResult, addressResult] = await Promise.all([
        withProfileQueryTimeout(
          supabase
            .from("profiles")
            .select("first_name,last_name,phone,date_of_birth,gender")
            .eq("id", currentUser.id)
            .maybeSingle(),
          "Profile query"
        ),
        withProfileQueryTimeout(
          supabase
            .from("user_addresses")
            .select("id,title,address_type,contact_name,phone,line1,line2,city,state,postal_code,country,landmark,is_primary")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: true }),
          "Address query"
        )
      ])

      if (requestId !== requestIdRef.current) return

      const pRes = profileResult as SupabaseResponse<ProfileRecord> | null
      if (pRes?.error) {
        console.error("Profile load error:", pRes.error)
      } else if (pRes?.data) {
        setProfile(pRes.data)
      }

      const aRes = addressResult as SupabaseResponse<UserAddressRow[]> | null
      if (aRes?.error) {
        console.error("Address load error:", aRes.error)
      } else if (aRes?.data) {
        setAddresses(aRes.data.map((row: UserAddressRow) => mapUserAddressRow(row)))
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      console.error("Profile load data error:", err)
    } finally {
      if (requestId !== requestIdRef.current) return
      setLoading(false)
    }
  }, [])
 
  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (authUser) {
      void loadProfileData(authUser)
    } else {
      requestIdRef.current += 1
      setUser(null)
      setProfile(null)
      setAddresses([])
      setLoading(false)
    }
  }, [authUser, authLoading, loadProfileData])

  const refreshProfile = async () => {
    if (authUser) {
      await loadProfileData(authUser)
    }
  }

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
      addresses,
      initials, 
      fullName, 
      loading,
      refreshProfile
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
