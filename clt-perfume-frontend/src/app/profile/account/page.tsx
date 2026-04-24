"use client"

import { useState, useEffect } from "react"
import { useProfile } from "@/contexts/profile-context"
import { ProfileAccountSection } from "@/components/profile/profile-account-section"
import { ProfileFormState, ProfileGender } from "@/components/profile/profile-types"
import { toDateInputValue } from "@/components/profile/profile-utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

import { Loader2 } from "lucide-react"

export default function AccountPage() {
  const { user, profile, initials, loading, refreshProfile } = useProfile()
 
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState("")
 
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  })
 
  useEffect(() => {
    if (profile && !isEditingProfile) {
      queueMicrotask(() => {
        setProfileForm({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          phone: profile.phone || "",
          dateOfBirth: toDateInputValue(profile.date_of_birth),
          gender: (profile.gender || "") as ProfileGender,
        })
      })
    }
  }, [profile, isEditingProfile])

  if (loading && !profile) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4 rounded-3xl bg-neutral-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium tracking-widest text-neutral-400 uppercase">Synchronizing Account</p>
      </div>
    )
  }

  function updateProfileField<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    setProfileForm((prev) => ({ ...prev, [key]: value }))
  }

  function startProfileEdit() {
    setProfileError("")
    setIsEditingProfile(true)
  }

  function cancelProfileEdit() {
    setIsEditingProfile(false)
    setProfileError("")
    if (profile) {
       setProfileForm({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        phone: profile.phone || "",
        dateOfBirth: toDateInputValue(profile.date_of_birth),
        gender: (profile.gender || "") as ProfileGender,
      })
    }
  }

  async function saveProfileChanges() {
    if (!user) return

    setIsSavingProfile(true)
    setProfileError("")
    try {
      const supabase = createClient()
      const payload = {
        first_name: profileForm.firstName.trim(),
        last_name: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
        date_of_birth: profileForm.dateOfBirth || null,
        gender: (profileForm.gender || null) as ProfileGender | null,
      }

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)

      if (error) {
        setProfileError(error.message || "Failed to save profile.")
        return
      }

      await refreshProfile()
      setIsEditingProfile(false)
      toast.success("Profile updated")
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to save profile.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <ProfileAccountSection
      profile={profile}
      userEmail={user?.email || profile?.email || ""}
      initials={initials}
      profileForm={profileForm}
      isEditingProfile={isEditingProfile}
      isSavingProfile={isSavingProfile}
      profileError={profileError}
      onStartEdit={startProfileEdit}
      onCancelEdit={cancelProfileEdit}
      onSave={saveProfileChanges}
      onFieldChange={updateProfileField}
    />
  )
}
