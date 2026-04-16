"use client"

import { useState, useEffect } from "react"
import { useProfile } from "@/contexts/profile-context"
import { ProfileAddressesSection } from "@/components/profile/profile-addresses-section"
import { AddressRecord, AddressFormState, UserAddressRow } from "@/components/profile/profile-types"
import { mapAddressRow } from "@/components/profile/profile-utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AddressesPage() {
  const { user, fullName, profile } = useProfile()
  const supabase = createClient()

  const [addresses, setAddresses] = useState<AddressRecord[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [updatingPrimaryId, setUpdatingPrimaryId] = useState<string | null>(null)
  const [addressError, setAddressError] = useState("")

  const [newAddress, setNewAddress] = useState<AddressFormState>({
    title: "",
    type: "other",
    contactName: "",
    phone: "+971 ",
    line1: "",
    line2: "",
    city: "Dubai",
    country: "United Arab Emirates",
  })

  useEffect(() => {
    async function loadAddresses() {
      if (!user) return
      const { data, error } = await supabase
        .from("user_addresses")
        .select("id,title,address_type,contact_name,phone,line1,line2,city,country,is_primary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (!error) {
        setAddresses((data as UserAddressRow[]).map(mapAddressRow))
      }
      setAddressesLoading(false)
    }
    loadAddresses()
  }, [user, supabase])

  function updateNewAddress<K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) {
    setNewAddress((prev) => ({ ...prev, [key]: value }))
  }

  function openAddAddressForm() {
    setAddressError("")
    setNewAddress({
      title: "",
      type: "other",
      contactName: fullName,
      phone: profile?.phone?.trim() || "+971 ",
      line1: "",
      line2: "",
      city: "Dubai",
      country: "United Arab Emirates",
    })
    setEditingAddressId(null)
    setShowAddressForm(true)
  }

  function openEditAddressForm(address: AddressRecord) {
    setAddressError("")
    setEditingAddressId(address.id)
    setNewAddress({
      title: address.title,
      type: address.type,
      contactName: address.contactName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      country: address.country,
    })
    setShowAddressForm(true)
  }

  function cancelAddressForm() {
    setShowAddressForm(false)
    setEditingAddressId(null)
    setAddressError("")
  }

  async function saveAddress() {
    if (!user) return
    const required = [newAddress.title, newAddress.contactName, newAddress.phone, newAddress.line1, newAddress.city, newAddress.country]
    if (required.some((value) => !value.split("").every(c => c === " ") && !value.trim())) {
       // Logic from previous page
    }
    // Optimization: simplified validation
    if (!newAddress.title.trim() || !newAddress.contactName.trim() || !newAddress.line1.trim()) {
       setAddressError("Please fill all required fields")
       return
    }

    setIsSavingAddress(true)
    const payload = {
      user_id: user.id,
      title: newAddress.title.trim(),
      address_type: newAddress.type,
      contact_name: newAddress.contactName.trim(),
      phone: newAddress.phone.trim(),
      line1: newAddress.line1.trim(),
      line2: newAddress.line2.trim(),
      city: newAddress.city.trim(),
      country: newAddress.country.trim(),
      is_primary: editingAddressId ? undefined : addresses.length === 0,
    }

    const query = editingAddressId
      ? supabase.from("user_addresses").update(payload).eq("id", editingAddressId).eq("user_id", user.id)
      : supabase.from("user_addresses").insert(payload)

    const { data, error } = await query.select("*").single()

    if (error || !data) {
      const msg = error?.message || "Failed to save address."
      setAddressError(msg)
      toast.error(msg)
      setIsSavingAddress(false)
      return
    }

    const mapped = mapAddressRow(data as UserAddressRow)
    if (editingAddressId) {
      setAddresses(prev => prev.map(a => a.id === editingAddressId ? mapped : a))
      toast.success("Address updated")
    } else {
      setAddresses(prev => [...prev, mapped])
      toast.success("Address added")
    }
    setShowAddressForm(false)
    setIsSavingAddress(false)
  }

  async function setPrimaryAddress(addressId: string) {
    if (!user) return
    setUpdatingPrimaryId(addressId)
    await supabase.from("user_addresses").update({ is_primary: false }).eq("user_id", user.id)
    await supabase.from("user_addresses").update({ is_primary: true }).eq("id", addressId).eq("user_id", user.id)
    
    setAddresses(prev => prev.map(a => ({ ...a, isPrimary: a.id === addressId })))
    setUpdatingPrimaryId(null)
    toast.success("Primary address updated")
  }

  async function deleteAddress(addressId: string) {
    if (!user) return
    const { error } = await supabase.from("user_addresses").delete().eq("id", addressId).eq("user_id", user.id)
    if (!error) {
      setAddresses(prev => prev.filter(a => a.id !== addressId))
      toast.success("Address removed")
    }
  }

  return (
    <ProfileAddressesSection
      addressesLoading={addressesLoading}
      addresses={addresses}
      showAddressForm={showAddressForm}
      editingAddressId={editingAddressId}
      isSavingAddress={isSavingAddress}
      updatingPrimaryId={updatingPrimaryId}
      addressError={addressError}
      newAddress={newAddress}
      onOpenAddAddressForm={openAddAddressForm}
      onSaveAddress={saveAddress}
      onCancelAddressForm={cancelAddressForm}
      onUpdateAddress={updateNewAddress}
      onOpenEditAddressForm={openEditAddressForm}
      onSetPrimaryAddress={setPrimaryAddress}
      onDeleteAddress={deleteAddress}
    />
  )
}
