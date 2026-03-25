"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, Check, CreditCard, House, MapPin, PlusCircle, ShoppingBag, Truck } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { createBankCheckoutSession, createCashOnDeliveryOrder, validatePromoCode } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type CheckoutAddressType = "home" | "office" | "other"

type CheckoutAddress = {
  id: string
  title: string
  type: CheckoutAddressType
  contactName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  landmark?: string
  isPrimary?: boolean
}

type UserAddressRow = {
  id: string
  title: string
  address_type: CheckoutAddressType
  contact_name: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postal_code?: string | null
  country: string
  landmark?: string | null
  is_primary?: boolean | null
}

type CheckoutAddressFormState = {
  title: string
  type: CheckoutAddressType
  contactName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  landmark: string
}

type PaymentMethod = "cod" | "bank"

function formatPrice(value: number) {
  return `AED ${Math.round(Number(value) || 0)}`
}

function createAddressId() {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createAddressFormState(contactName: string, phone: string): CheckoutAddressFormState {
  return {
    title: "",
    type: "other",
    contactName,
    phone,
    line1: "",
    line2: "",
    city: "Dubai",
    state: "Dubai",
    postalCode: "",
    country: "United Arab Emirates",
    landmark: "",
  }
}

function mapUserAddressRow(address: UserAddressRow): CheckoutAddress {
  return {
    id: address.id,
    title: address.title,
    type: address.address_type,
    contactName: address.contact_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || "",
    city: address.city,
    state: address.state || "",
    postalCode: address.postal_code || "",
    country: address.country,
    landmark: address.landmark || "",
    isPrimary: Boolean(address.is_primary),
  }
}

export default function CheckoutPage() {
  const {
    items,
    totalPrice,
    totalItems,
    clearCart,
    promo,
    setPromo,
    promoDiscountAmount,
    discountedTotal,
  } = useCart()
  const router = useRouter()

  const [promoInput, setPromoInput] = useState("")
  const [promoMessage, setPromoMessage] = useState("")
  const [promoError, setPromoError] = useState(false)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [shippingAddresses, setShippingAddresses] = useState<CheckoutAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressFormError, setAddressFormError] = useState("")
  const [addressForm, setAddressForm] = useState<CheckoutAddressFormState>(() =>
    createAddressFormState("Client Account", "+971 ")
  )

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [isAuthResolved, setIsAuthResolved] = useState(false)

  const selectedCheckoutAddress = useMemo(
    () => shippingAddresses.find((address) => address.id === selectedAddressId) || null,
    [selectedAddressId, shippingAddresses]
  )

  const promoInputValue = promo ? promo.code : promoInput
  const loginToCheckoutHref = `/login?next=${encodeURIComponent("/checkout")}&message=${encodeURIComponent(
    "Please login to continue checkout"
  )}`

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart")
    }
  }, [items.length, router])

  useEffect(() => {
    let mounted = true

    async function loadCheckoutAddresses() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!mounted) return

      if (!user) {
        setCurrentUserId(null)
        setShippingAddresses([])
        setSelectedAddressId("")
        setAddressForm(createAddressFormState("Client Account", "+971 "))
        setIsAuthResolved(true)
        return
      }

      setCurrentUserId(user.id)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name,last_name,phone")
        .eq("id", user.id)
        .maybeSingle()

      const contactName =
        [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ").trim() ||
        user.email?.split("@")[0] ||
        "Client Account"
      const phone = profileData?.phone?.trim() || "+971 "
      let addressData: UserAddressRow[] = []

      const detailedResult = await supabase
        .from("user_addresses")
        .select("id,title,address_type,contact_name,phone,line1,line2,city,state,postal_code,country,landmark,is_primary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (detailedResult.error) {
        const fallbackResult = await supabase
          .from("user_addresses")
          .select("id,title,address_type,contact_name,phone,line1,line2,city,country,is_primary")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })

        addressData = (fallbackResult.data || []) as UserAddressRow[]
      } else {
        addressData = (detailedResult.data || []) as UserAddressRow[]
      }

      const hydratedAddresses = addressData.map(mapUserAddressRow)

      setShippingAddresses(hydratedAddresses)
      setSelectedAddressId(hydratedAddresses.find((address) => address.isPrimary)?.id || hydratedAddresses[0]?.id || "")
      setAddressForm(createAddressFormState(contactName, phone))
      setIsAuthResolved(true)
    }

    loadCheckoutAddresses().catch(() => {
      if (!mounted) return
      setCurrentUserId(null)
      setShippingAddresses([])
      setSelectedAddressId("")
      setAddressForm(createAddressFormState("Client Account", "+971 "))
      setIsAuthResolved(true)
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (shippingAddresses.length === 0) return
    if (selectedAddressId && shippingAddresses.some((address) => address.id === selectedAddressId)) return
    setSelectedAddressId(shippingAddresses.find((address) => address.isPrimary)?.id || shippingAddresses[0]?.id || "")
  }, [selectedAddressId, shippingAddresses])

  const updateAddressField = <K extends keyof CheckoutAddressFormState>(field: K, value: CheckoutAddressFormState[K]) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }))
  }

  const addAddress = async () => {
    const requiredFields = [
      addressForm.title,
      addressForm.contactName,
      addressForm.phone,
      addressForm.line1,
      addressForm.city,
      addressForm.country,
    ]
    if (requiredFields.some((field) => !field.trim())) {
      setAddressFormError("Please fill title, contact name, phone, line 1, city, and country.")
      return
    }

    const nextAddressDraft: CheckoutAddress = {
      id: createAddressId(),
      title: addressForm.title.trim(),
      type: addressForm.type,
      contactName: addressForm.contactName.trim(),
      phone: addressForm.phone.trim(),
      line1: addressForm.line1.trim(),
      line2: addressForm.line2.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      postalCode: addressForm.postalCode.trim(),
      country: addressForm.country.trim(),
      landmark: addressForm.landmark.trim(),
    }

    if (!currentUserId) {
      router.push(loginToCheckoutHref)
      return
    }

    setIsSavingAddress(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("user_addresses")
      .insert({
        user_id: currentUserId,
        title: nextAddressDraft.title,
        address_type: nextAddressDraft.type,
        contact_name: nextAddressDraft.contactName,
        phone: nextAddressDraft.phone,
        line1: nextAddressDraft.line1,
        line2: nextAddressDraft.line2 || "",
        city: nextAddressDraft.city,
        state: nextAddressDraft.state || "",
        postal_code: nextAddressDraft.postalCode || "",
        country: nextAddressDraft.country,
        landmark: nextAddressDraft.landmark || "",
        is_primary: shippingAddresses.length === 0,
      })
      .select("id,title,address_type,contact_name,phone,line1,line2,city,state,postal_code,country,landmark,is_primary")
      .single()

    if (error || !data) {
      setAddressFormError(error?.message || "Failed to save address.")
      setIsSavingAddress(false)
      return
    }

    const savedAddress = mapUserAddressRow(data as UserAddressRow)
    setShippingAddresses((prev) => [...prev, savedAddress])
    setSelectedAddressId(savedAddress.id)
    setAddressFormError("")
    setShowAddressForm(false)
    setAddressForm(createAddressFormState(savedAddress.contactName, savedAddress.phone))
    setIsSavingAddress(false)
    toast.success("Address saved")
  }

  const applyPromo = async () => {
    const code = promoInput.trim()
    if (!code) {
      setPromoError(true)
      setPromoMessage("Enter promo code")
      return
    }
    if (totalPrice <= 0) {
      setPromoError(true)
      setPromoMessage("Add items before applying promo")
      return
    }

    setIsApplyingPromo(true)
    setPromoMessage("")
    setPromoError(false)

    const result = await validatePromoCode(code, totalPrice)
    if (!result.valid || !result.discountType) {
      setPromoError(true)
      setPromoMessage(result.message || "Invalid promo code")
      setIsApplyingPromo(false)
      return
    }

    setPromo({
      code: (result.code || code).toUpperCase(),
      discountType: result.discountType === "fixed" ? "fixed" : "percentage",
      discountValue: Number(result.discountValue || 0),
    })
    setPromoInput("")
    setPromoError(false)
    setPromoMessage(result.message || "Promo applied")
    setIsApplyingPromo(false)
  }

  const removePromo = () => {
    setPromo(null)
    setPromoInput("")
    setPromoError(false)
    setPromoMessage("Promo removed")
  }

  async function placeOrder() {
    if (items.length === 0) {
      toast.error("Your bag is empty.")
      return
    }
    if (!selectedCheckoutAddress) {
      toast.error("Please choose a delivery address.")
      return
    }

    setIsPlacingOrder(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.push(loginToCheckoutHref)
        return
      }

      const payload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: Number(item.product.price),
          original_unit_price: Number(item.originalUnitPrice ?? item.product.price),
        })),
        promo: promo
          ? {
              code: promo.code,
              discountType: promo.discountType,
              discountValue: promo.discountValue,
            }
          : null,
        shipping_address: {
          id: selectedCheckoutAddress.id,
          title: selectedCheckoutAddress.title,
          type: selectedCheckoutAddress.type,
          contact_name: selectedCheckoutAddress.contactName,
          phone: selectedCheckoutAddress.phone,
          line1: selectedCheckoutAddress.line1,
          line2: selectedCheckoutAddress.line2 || "",
          city: selectedCheckoutAddress.city,
          state: selectedCheckoutAddress.state || "",
          postal_code: selectedCheckoutAddress.postalCode || "",
          country: selectedCheckoutAddress.country,
          landmark: selectedCheckoutAddress.landmark || "",
        },
      }

      if (paymentMethod === "cod") {
        const order = await createCashOnDeliveryOrder(session.access_token, payload)
        clearCart()
        toast.success(`Order ${order.order_number || order.id} placed successfully`)
        router.push(`/profile?section=orders&order=${encodeURIComponent(order.order_number || order.id)}`)
        return
      }

      const checkoutSession = await createBankCheckoutSession(session.access_token, payload)
      if (!checkoutSession.url) {
        throw new Error("Unable to start bank payment checkout")
      }

      window.location.href = checkoutSession.url
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place order"
      toast.error(message)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="h-24 w-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-neutral-300" />
        </div>
        <h1 className="text-3xl font-serif text-neutral-900 mb-4">Your Bag is Empty</h1>
        <p className="text-neutral-500 font-light mb-8 max-w-sm text-center">Add products to continue checkout.</p>
        <Link href="/cart">
          <Button className="h-12 px-8 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium">
            Back to Cart
          </Button>
        </Link>
      </div>
    )
  }

  if (!isAuthResolved) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="h-24 w-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6 animate-pulse" />
        <h1 className="text-3xl font-serif text-neutral-900 mb-4">Preparing Checkout</h1>
        <p className="text-neutral-500 font-light max-w-sm text-center">Checking your account before loading delivery details.</p>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="h-24 w-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-neutral-300" />
        </div>
        <h1 className="text-3xl font-serif text-neutral-900 mb-4">Login Required</h1>
        <p className="text-neutral-500 font-light mb-8 max-w-md text-center">
          Please sign in to continue checkout, choose your address, and place your order securely.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href={loginToCheckoutHref}>
            <Button className="h-12 px-8 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium">
              Login to Continue
            </Button>
          </Link>
          <Link href="/cart" className="h-12 inline-flex items-center justify-center rounded-xl border border-neutral-300 px-8 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 transition hover:border-black hover:text-black">
            Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Secure Checkout</p>
            <h1 className="mt-1 font-serif text-3xl text-neutral-900 md:text-4xl">Delivery & Payment</h1>
          </div>
          <Link href="/cart" className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 transition hover:border-black hover:text-black">
            Back to Cart
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
          <section className="space-y-6">
            <article className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-serif text-2xl text-neutral-900">1. Delivery Address</h2>
                <span className="text-xs text-neutral-500">{shippingAddresses.length} saved</span>
              </div>

              <div className="space-y-2">
                {shippingAddresses.map((address) => {
                  const isSelected = selectedAddressId === address.id
                  const Icon = address.type === "home" ? House : address.type === "office" ? Briefcase : MapPin

                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-black bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{address.title}</p>
                            <p className="text-xs text-neutral-500">{address.contactName}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-neutral-600">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.country}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">{address.phone}</p>
                    </button>
                  )
                })}
              </div>

              {!showAddressForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddressFormError("")
                    setShowAddressForm(true)
                  }}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black hover:text-black"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add New Address
                </button>
              ) : (
                <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input value={addressForm.title} onChange={(event) => updateAddressField("title", event.target.value)} placeholder="Address Title (Home, Office...)" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black sm:col-span-2" />
                    <select value={addressForm.type} onChange={(event) => updateAddressField("type", event.target.value as CheckoutAddressType)} className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black">
                      <option value="home">Home</option>
                      <option value="office">Office</option>
                      <option value="other">Other</option>
                    </select>
                    <input value={addressForm.postalCode} onChange={(event) => updateAddressField("postalCode", event.target.value)} placeholder="Postal Code" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black" />
                    <input value={addressForm.contactName} onChange={(event) => updateAddressField("contactName", event.target.value)} placeholder="Contact Name" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black" />
                    <input value={addressForm.phone} onChange={(event) => updateAddressField("phone", event.target.value)} placeholder="Phone Number" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black" />
                    <input value={addressForm.line1} onChange={(event) => updateAddressField("line1", event.target.value)} placeholder="Address Line 1" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black sm:col-span-2" />
                    <input value={addressForm.line2} onChange={(event) => updateAddressField("line2", event.target.value)} placeholder="Address Line 2 (Optional)" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black sm:col-span-2" />
                    <input value={addressForm.city} onChange={(event) => updateAddressField("city", event.target.value)} placeholder="City" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black" />
                    <input value={addressForm.state} onChange={(event) => updateAddressField("state", event.target.value)} placeholder="State" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black" />
                    <input value={addressForm.country} onChange={(event) => updateAddressField("country", event.target.value)} placeholder="Country" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black" />
                    <input value={addressForm.landmark} onChange={(event) => updateAddressField("landmark", event.target.value)} placeholder="Landmark (Optional)" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black" />
                  </div>
                  {addressFormError && <p className="mt-2 text-xs text-red-600">{addressFormError}</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={addAddress} disabled={isSavingAddress} className="h-10 flex-1 rounded-lg bg-black px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 disabled:opacity-60">
                      {isSavingAddress ? "Saving..." : "Save Address"}
                    </button>
                    <button type="button" onClick={() => { if (isSavingAddress) return; setShowAddressForm(false); setAddressFormError("") }} className="h-10 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black hover:text-black">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
              <h2 className="mb-4 font-serif text-2xl text-neutral-900">2. Payment Method</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`rounded-xl border p-4 text-left transition ${paymentMethod === "cod" ? "border-black bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
                >
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <p className="text-sm font-semibold">Cash On Delivery</p>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">Pay when your order arrives.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`rounded-xl border p-4 text-left transition ${paymentMethod === "bank" ? "border-black bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <p className="text-sm font-semibold">Bank / Card Payment</p>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">Secure card checkout powered by Stripe.</p>
                </button>
              </div>
            </article>
          </section>

          <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 border-b border-neutral-100 pb-3 font-serif text-2xl text-neutral-900">3. Review Order</h2>

            <div className="mb-4 space-y-2">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.bundle?.id || "single"}`} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-2">
                  <div className="relative h-12 w-12 overflow-hidden rounded-md bg-neutral-100">
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{item.product.name}</p>
                    <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-800">{formatPrice(Number(item.product.price) * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">Promo Code</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={promoInputValue}
                  onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  disabled={Boolean(promo)}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-black sm:h-11"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={isApplyingPromo || Boolean(promo)}
                  className="h-10 w-full rounded-lg bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 sm:h-11 sm:w-auto sm:min-w-[110px]"
                >
                  {promo ? "Applied" : isApplyingPromo ? "Applying" : "Apply"}
                </button>
              </div>
              {promo && (
                <div className="mt-2 flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
                  <span className="break-all">
                    {promo.code} ({promo.discountType === "percentage" ? `${promo.discountValue}%` : `AED ${promo.discountValue}`})
                  </span>
                  <button type="button" onClick={removePromo} className="self-start font-semibold hover:text-black sm:self-auto">
                    Remove
                  </button>
                </div>
              )}
              {promoMessage && <p className={`mt-2 text-xs ${promoError ? "text-red-600" : "text-emerald-700"}`}>{promoMessage}</p>}
            </div>

            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex justify-between"><span>Items ({totalItems})</span><span className="font-medium text-black">{formatPrice(totalPrice)}</span></div>
              {promo && promoDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700"><span>Promo Discount</span><span>- {formatPrice(promoDiscountAmount)}</span></div>
              )}
              <div className="flex justify-between"><span>Shipping</span><span className="font-medium text-green-700">FREE</span></div>
            </div>

            <div className="mt-5 flex items-end justify-between border-t border-neutral-100 pt-5">
              <span className="font-serif text-lg">Total</span>
              <span className="font-serif text-2xl">{formatPrice(discountedTotal)}</span>
            </div>

            <Button
              onClick={placeOrder}
              disabled={isPlacingOrder}
              className="mt-6 h-14 w-full rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-[0.14em] text-xs font-semibold disabled:opacity-60"
            >
              {isPlacingOrder
                ? "Processing..."
                : paymentMethod === "cod"
                  ? "Place COD Order"
                  : "Pay Securely"}
            </Button>

            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              {paymentMethod === "cod" ? "Cash on delivery selected" : "You will be redirected to secure bank payment"}
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
