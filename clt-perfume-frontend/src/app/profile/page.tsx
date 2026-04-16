"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { signOut } from "@/app/auth/actions"
import {
  cancelMyOrder,
  getMyOrders,
  getMyReturnRequests,
  requestOrderReturn,
  type ReturnRequestRecord,
} from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ProfileAccountSection } from "@/components/profile/profile-account-section"
import { ProfileAddressesSection } from "@/components/profile/profile-addresses-section"
import { ProfileOrdersSection } from "@/components/profile/profile-orders-section"
import { ProfileReturnsSection } from "@/components/profile/profile-returns-section"
import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import type {
  AddressFormState,
  AddressRecord,
  ProfileFormState,
  ProfileGender,
  ProfileRecord,
  ProfileSection,
  OrderRecord,
  UserAddressRow,
} from "@/components/profile/profile-types"
import {
  mapAddressRow,
  normalizeReturnRequestStatus,
  toDateInputValue,
} from "@/components/profile/profile-utils"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [activeSection, setActiveSection] = useState<ProfileSection>("account")
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [returnRequests, setReturnRequests] = useState<ReturnRequestRecord[]>([])
  const [addresses, setAddresses] = useState<AddressRecord[]>([])

  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [returnsLoading, setReturnsLoading] = useState(true)

  const [orderActionLoadingId, setOrderActionLoadingId] = useState<string | null>(null)
  const [returnReasonByOrder, setReturnReasonByOrder] = useState<Record<string, string>>({})

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
    let mounted = true

    async function loadProfileData() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push("/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name,last_name,phone,date_of_birth,gender")
        .eq("id", currentUser.id)
        .maybeSingle()

      if (!mounted) return

      setUser(currentUser)
      setProfile((profileData || null) as ProfileRecord | null)
      setProfileForm({
        firstName: profileData?.first_name || "",
        lastName: profileData?.last_name || "",
        phone: profileData?.phone || "",
        dateOfBirth: toDateInputValue(profileData?.date_of_birth),
        gender: (profileData?.gender || "") as ProfileGender,
      })
      setLoading(false)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token || ""
      const [orderResult, addressResult, returnRequestsResult] = await Promise.allSettled([
        accessToken ? getMyOrders(accessToken) : Promise.resolve([] as OrderRecord[]),
        supabase
          .from("user_addresses")
          .select("id,title,address_type,contact_name,phone,line1,line2,city,country,is_primary")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: true }),
        accessToken ? getMyReturnRequests(accessToken) : Promise.resolve([] as ReturnRequestRecord[]),
      ])

      if (!mounted) return

      if (orderResult.status === "fulfilled") {
        setOrders(orderResult.value || [])
      } else {
        setOrders([])
      }

      if (addressResult.status === "fulfilled") {
        setAddresses(((addressResult.value.data || []) as UserAddressRow[]).map(mapAddressRow))
      } else {
        setAddresses([])
      }

      if (returnRequestsResult.status === "fulfilled") {
        setReturnRequests(returnRequestsResult.value || [])
      } else {
        setReturnRequests([])
      }

      setOrdersLoading(false)
      setAddressesLoading(false)
      setReturnsLoading(false)
    }

    loadProfileData().catch(() => {
      if (!mounted) return
      setLoading(false)
      setOrdersLoading(false)
      setAddressesLoading(false)
      setReturnsLoading(false)
    })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fullName = useMemo(() => {
    const fromProfile = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim()
    if (fromProfile) return fromProfile
    return user?.email?.split("@")[0] || "Client Account"
  }, [profile?.first_name, profile?.last_name, user?.email])

  const initials = useMemo(() => {
    const first = (profile?.first_name || user?.email || "C").charAt(0)
    const last = (profile?.last_name || "").charAt(0)
    return `${first}${last}`.toUpperCase()
  }, [profile?.first_name, profile?.last_name, user?.email])

  function updateProfileField<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    setProfileForm((prev) => ({ ...prev, [key]: value }))
  }

  function startProfileEdit() {
    setProfileError("")
    setProfileForm({
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      phone: profile?.phone || "",
      dateOfBirth: toDateInputValue(profile?.date_of_birth),
      gender: (profile?.gender || "") as ProfileGender,
    })
    setIsEditingProfile(true)
  }

  function cancelProfileEdit() {
    setIsEditingProfile(false)
    setProfileError("")
    setProfileForm({
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      phone: profile?.phone || "",
      dateOfBirth: toDateInputValue(profile?.date_of_birth),
      gender: (profile?.gender || "") as ProfileGender,
    })
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

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select("first_name,last_name,phone,date_of_birth,gender")
      .single()

    if (error || !data) {
      setProfileError(error?.message || "Failed to save profile.")
      setIsSavingProfile(false)
      return
    }

    setProfile((prev) => ({ ...(prev || {}), ...data }))
    setProfileForm({
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      phone: data.phone || "",
      dateOfBirth: toDateInputValue(data.date_of_birth),
      gender: (data.gender || "") as ProfileGender,
    })
    setIsEditingProfile(false)
    setIsSavingProfile(false)
    toast.success("Profile updated")
  }

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
    if (required.some((value) => !value.trim())) {
      setAddressError("Please fill all required address fields.")
      return
    }

    setIsSavingAddress(true)
    setAddressError("")

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
      ? supabase
          .from("user_addresses")
          .update({
            title: payload.title,
            address_type: payload.address_type,
            contact_name: payload.contact_name,
            phone: payload.phone,
            line1: payload.line1,
            line2: payload.line2,
            city: payload.city,
            country: payload.country,
          })
          .eq("id", editingAddressId)
          .eq("user_id", user.id)
      : supabase.from("user_addresses").insert(payload)

    const { data, error } = await query
      .select("id,title,address_type,contact_name,phone,line1,line2,city,country,is_primary")
      .single()

    if (error || !data) {
      setAddressError(error?.message || "Failed to save address.")
      setIsSavingAddress(false)
      return
    }

    const mapped = mapAddressRow(data as UserAddressRow)
    if (editingAddressId) {
      setAddresses((prev) => prev.map((address) => (address.id === editingAddressId ? mapped : address)))
      toast.success("Address updated")
    } else {
      setAddresses((prev) => [...prev, mapped])
      toast.success("Address added")
    }

    setEditingAddressId(null)
    setShowAddressForm(false)
    setIsSavingAddress(false)
  }

  async function setPrimaryAddress(addressId: string) {
    if (!user) return
    setUpdatingPrimaryId(addressId)

    const clearPrimary = await supabase
      .from("user_addresses")
      .update({ is_primary: false })
      .eq("user_id", user.id)

    if (clearPrimary.error) {
      setUpdatingPrimaryId(null)
      toast.error(clearPrimary.error.message)
      return
    }

    const setPrimary = await supabase
      .from("user_addresses")
      .update({ is_primary: true })
      .eq("id", addressId)
      .eq("user_id", user.id)

    if (setPrimary.error) {
      setUpdatingPrimaryId(null)
      toast.error(setPrimary.error.message)
      return
    }

    setAddresses((prev) =>
      prev.map((address) => ({
        ...address,
        isPrimary: address.id === addressId,
      }))
    )
    setUpdatingPrimaryId(null)
    toast.success("Primary address updated")
  }

  async function deleteAddress(addressId: string) {
    if (!user) return

    const target = addresses.find((address) => address.id === addressId)
    const nextPrimaryId = target?.isPrimary ? addresses.find((address) => address.id !== addressId)?.id || null : null

    const { error } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id)

    if (error) {
      toast.error(error.message)
      return
    }

    setAddresses((prev) => prev.filter((address) => address.id !== addressId))
    if (editingAddressId === addressId) {
      setShowAddressForm(false)
      setEditingAddressId(null)
    }
    toast.success("Address removed")

    if (nextPrimaryId) {
      await setPrimaryAddress(nextPrimaryId)
    }
  }

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error("Please login again.")
    }

    return session.access_token
  }

  function hasOpenReturnRequest(orderId: string) {
    return returnRequests.some((request) => {
      if (request.order_id !== orderId) return false
      const status = normalizeReturnRequestStatus(request.status)
      return status === "pending" || status === "approved"
    })
  }

  function setOrderReturnReason(orderId: string, reason: string) {
    setReturnReasonByOrder((prev) => ({ ...prev, [orderId]: reason }))
  }

  async function handleCancelOrder(orderId: string) {
    try {
      setOrderActionLoadingId(orderId)
      const token = await getAccessToken()
      const result = await cancelMyOrder(token, orderId)
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: result.status } : order)))
      toast.success("Order cancelled")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel order")
    } finally {
      setOrderActionLoadingId(null)
    }
  }

  async function handleRequestReturn(orderId: string) {
    try {
      setOrderActionLoadingId(orderId)
      const token = await getAccessToken()
      const reason = (returnReasonByOrder[orderId] || "").trim()
      const created = await requestOrderReturn(token, orderId, { reason })
      setReturnRequests((prev) => [created, ...prev])
      setReturnReasonByOrder((prev) => ({ ...prev, [orderId]: "" }))
      toast.success("Return request submitted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit return request")
    } finally {
      setOrderActionLoadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-neutral-200" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <div className="h-[520px] rounded-2xl bg-neutral-200" />
            <div className="h-[520px] rounded-2xl bg-neutral-200" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-serif text-3xl text-neutral-900 md:text-4xl">Profile</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <ProfileSidebar
            initials={initials}
            fullName={fullName}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          <main className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-7">
            {activeSection === "account" && (
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
            )}

            {activeSection === "orders" && (
              <ProfileOrdersSection
                ordersLoading={ordersLoading}
                orders={orders}
                orderActionLoadingId={orderActionLoadingId}
                returnReasonByOrder={returnReasonByOrder}
                onReturnReasonChange={setOrderReturnReason}
                onCancelOrder={handleCancelOrder}
                onRequestReturn={handleRequestReturn}
                hasOpenReturnRequest={hasOpenReturnRequest}
              />
            )}

            {activeSection === "addresses" && (
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
            )}

            {activeSection === "returns" && (
              <ProfileReturnsSection
                ordersLoading={ordersLoading}
                returnsLoading={returnsLoading}
                orders={orders}
                returnRequests={returnRequests}
                orderActionLoadingId={orderActionLoadingId}
                returnReasonByOrder={returnReasonByOrder}
                onReturnReasonChange={setOrderReturnReason}
                onCancelOrder={handleCancelOrder}
                onRequestReturn={handleRequestReturn}
                hasOpenReturnRequest={hasOpenReturnRequest}
              />
            )}


            {activeSection === "wishlist" && (
              <section>
                <h2 className="mb-3 font-serif text-2xl text-neutral-900">My Wishlist</h2>
                <p className="mb-4 text-sm text-neutral-600">Open your saved wishlist products.</p>
                <Link href="/wishlist" className="text-sm font-semibold text-black underline underline-offset-4">
                  Go to Wishlist
                </Link>
              </section>
            )}

            {activeSection === "payment" && (
              <section>
                <h2 className="mb-3 font-serif text-2xl text-neutral-900">Payment</h2>
                <p className="text-sm text-neutral-600">Saved payment methods can be managed here.</p>
              </section>
            )}

            {activeSection === "password" && (
              <section>
                <h2 className="mb-3 font-serif text-2xl text-neutral-900">Change Password</h2>
                <p className="mb-5 text-sm text-neutral-600">Use secure credentials and update regularly.</p>
                <form action={signOut}>
                  <button className="rounded-xl border border-black bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black">
                    Sign Out
                  </button>
                </form>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
