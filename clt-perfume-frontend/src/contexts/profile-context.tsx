"use client"

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"
import { ProfileRecord } from "@/components/profile/profile-types"
import { CheckoutAddress, UserAddressRow } from "@/app/checkout/checkout-types"
import { mapUserAddressRow } from "@/app/checkout/checkout-utils"

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
 
  const loadProfileData = useCallback(async (currentUser: User) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const [profileResult, addressResult] = await Promise.all([
        supabase.from("profiles").select("first_name,last_name,phone,date_of_birth,gender").eq("id", currentUser.id).maybeSingle(),
        supabase.from("user_addresses")
          .select("id,title,address_type,contact_name,phone,line1,line2,city,state,postal_code,country,landmark,is_primary")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: true })
      ])
 
      setUser(currentUser)
      setProfile(profileResult.data as ProfileRecord | null)
      
      if (addressResult.data) {
        setAddresses(addressResult.data.map((row: UserAddressRow) => mapUserAddressRow(row)))
      }
    } catch (err) {
      console.error("Profile load data error:", err)
    } finally {
      setLoading(false)
    }
  }, [])
 
  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (authUser) {
      loadProfileData(authUser)
    } else {
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
