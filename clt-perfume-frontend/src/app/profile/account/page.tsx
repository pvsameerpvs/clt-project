"use client"

import { useState, useEffect } from "react"
import { useProfile } from "@/contexts/profile-context"
import { ProfileAccountSection } from "@/components/profile/profile-account-section"
import { ProfileFormState, ProfileGender } from "@/components/profile/profile-types"
import { toDateInputValue } from "@/components/profile/profile-utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AccountPage() {
  const { user, profile, initials, refreshProfile } = useProfile()
  const supabase = createClient()

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
      setIsSavingProfile(false)
      return
    }

    await refreshProfile()
    setIsEditingProfile(false)
    setIsSavingProfile(false)
    toast.success("Profile updated")
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
