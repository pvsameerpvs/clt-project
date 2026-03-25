"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CartItem as CartLineItem, getCartLineKey, useCart } from "@/contexts/cart-context"
import { CartItem } from "@/components/cart/cart-item"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Briefcase, Check, House, MapPin, Minus, Plus, PlusCircle, ShoppingBag, X } from "lucide-react"
import { createCashOnDeliveryOrder, validatePromoCode } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

function formatPrice(value: number) {
  return `AED ${Math.round(Number(value) || 0)}`
}

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

const CHECKOUT_ADDRESS_STORAGE_KEY = "cle_checkout_addresses"

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

function buildDefaultAddresses(contactName: string, phone: string): CheckoutAddress[] {
  return [
    {
      id: "addr-home-default",
      title: "Home Address",
      type: "home",
      contactName,
      phone,
      line1: "Jumeirah Village Circle, Building 08",
      line2: "Apartment 2403",
      city: "Dubai",
      state: "Dubai",
      country: "United Arab Emirates",
      isPrimary: true,
    },
    {
      id: "addr-office-default",
      title: "Office Address",
      type: "office",
      contactName,
      phone,
      line1: "Business Bay, Bay Square 5",
      line2: "Office 1207",
      city: "Dubai",
      state: "Dubai",
      country: "United Arab Emirates",
    },
  ]
}

function normalizeStoredAddresses(value: unknown): CheckoutAddress[] {
  if (!Array.isArray(value)) return []
  const normalized: CheckoutAddress[] = []

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue
    const source = entry as Partial<CheckoutAddress>
    if (!source.line1 || !source.city || !source.country) continue

    normalized.push({
      id: source.id || createAddressId(),
      title: source.title || "Address",
      type: source.type === "home" || source.type === "office" ? source.type : "other",
      contactName: source.contactName || "Client Account",
      phone: source.phone || "",
      line1: source.line1,
      line2: source.line2 || "",
      city: source.city,
      state: source.state || "",
      postalCode: source.postalCode || "",
      country: source.country,
      landmark: source.landmark || "",
      isPrimary: Boolean(source.isPrimary),
    })
  }

  return normalized
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

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartPageContent />
    </Suspense>
  )
}

function CartPageContent() {
  const {
    items,
    totalPrice,
    totalItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    promo,
    setPromo,
    promoDiscountAmount,
    discountedTotal,
  } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bundleName = searchParams.get("bundle")?.trim() || ""
  const [promoInput, setPromoInput] = useState("")
  const [promoMessage, setPromoMessage] = useState("")
  const [promoError, setPromoError] = useState(false)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [shippingAddresses, setShippingAddresses] = useState<CheckoutAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressFormError, setAddressFormError] = useState("")
  const [addressForm, setAddressForm] = useState<CheckoutAddressFormState>(() =>
    createAddressFormState("Client Account", "+971 ")
  )
  const promoInputValue = promo ? promo.code : promoInput

  const { standaloneItems, bundleGroups } = useMemo(() => {
    const bundleMap = new Map<
      string,
      {
        id: string
        name: string
        discountPercent: number
        size: number
        items: CartLineItem[]
        originalTotal: number
        offerTotal: number
      }
    >()

    const singles: CartLineItem[] = []

    for (const item of items) {
      const bundle = item.bundle
      if (!bundle?.id) {
        singles.push(item)
        continue
      }

      const existing = bundleMap.get(bundle.id)
      const originalUnitPrice = Number(item.originalUnitPrice || item.product.price)
      const offerUnitPrice = Number(item.product.price)

      if (!existing) {
        bundleMap.set(bundle.id, {
          id: bundle.id,
          name: bundle.name,
          discountPercent: bundle.discountPercent,
          size: bundle.size,
          items: [item],
          originalTotal: originalUnitPrice * item.quantity,
          offerTotal: offerUnitPrice * item.quantity,
        })
        continue
      }

      existing.items.push(item)
      existing.originalTotal += originalUnitPrice * item.quantity
      existing.offerTotal += offerUnitPrice * item.quantity
    }

    return {
      standaloneItems: singles,
      bundleGroups: Array.from(bundleMap.values()),
    }
  }, [items])
  const hasBundleFromQueryInCart = useMemo(() => {
    if (!bundleName) return false
    return items.some((item) => item.bundle?.name === bundleName)
  }, [items, bundleName])

  const getBundleSetQuantity = (bundleGroup: (typeof bundleGroups)[number]) =>
    Math.max(
      1,
      Math.min(...bundleGroup.items.map((item) => Math.max(1, Number(item.quantity) || 1)))
    )

  const updateBundleSetQuantity = (bundleGroup: (typeof bundleGroups)[number], nextSetQuantity: number) => {
    const currentSetQuantity = getBundleSetQuantity(bundleGroup)
    const safeNext = Math.max(1, nextSetQuantity)
    const delta = safeNext - currentSetQuantity
    if (delta === 0) return

    bundleGroup.items.forEach((item) => {
      const lineKey = getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)
      const currentItemQty = Math.max(1, Number(item.quantity) || 1)
      updateQuantity(lineKey, currentItemQty + delta)
    })
  }

  const orderSummaryLines = useMemo(() => {
    const bundleLines = bundleGroups.map((bundleGroup) => ({
      key: `bundle-line-${bundleGroup.id}`,
      label: `${bundleGroup.size} Bundle`,
      quantity: Math.max(1, Math.min(...bundleGroup.items.map((item) => Math.max(1, Number(item.quantity) || 1)))),
      value: bundleGroup.offerTotal,
    }))

    const singleLines = standaloneItems.map((item) => ({
      key: `single-line-${getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)}`,
      label: item.product.name,
      quantity: item.quantity,
      value: Number(item.product.price) * item.quantity,
    }))

    return [...bundleLines, ...singleLines]
  }, [bundleGroups, standaloneItems])

  const selectedCheckoutAddress = useMemo(
    () => shippingAddresses.find((address) => address.id === selectedAddressId) || null,
    [selectedAddressId, shippingAddresses]
  )

  useEffect(() => {
    let mounted = true

    async function loadCheckoutAddresses() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!mounted) return
      setCurrentUserId(user?.id || null)

      const { data: profileData } = user
        ? await supabase
            .from("profiles")
            .select("first_name,last_name,phone")
            .eq("id", user.id)
            .maybeSingle()
        : { data: null }

      const contactName =
        [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ").trim() ||
        user?.email?.split("@")[0] ||
        "Client Account"
      const phone = profileData?.phone?.trim() || "+971 "
      let hydratedAddresses: CheckoutAddress[] = []

      if (user) {
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

          addressData = ((fallbackResult.data || []) as UserAddressRow[])
        } else {
          addressData = ((detailedResult.data || []) as UserAddressRow[])
        }

        hydratedAddresses = addressData.map(mapUserAddressRow)
      } else {
        const defaultAddresses = buildDefaultAddresses(contactName, phone)
        hydratedAddresses = defaultAddresses

        if (typeof window !== "undefined") {
          const saved = window.localStorage.getItem(CHECKOUT_ADDRESS_STORAGE_KEY)
          const parsed = normalizeStoredAddresses(saved ? JSON.parse(saved) : null)
          if (parsed.length > 0) {
            hydratedAddresses = parsed
          }
        }
      }

      setShippingAddresses(hydratedAddresses)
      setSelectedAddressId(hydratedAddresses.find((address) => address.isPrimary)?.id || hydratedAddresses[0]?.id || "")
      setAddressForm(createAddressFormState(contactName, phone))
    }

    loadCheckoutAddresses().catch(() => {
      if (!mounted) return
      setCurrentUserId(null)
      const fallback = buildDefaultAddresses("Client Account", "+971 ")
      setShippingAddresses(fallback)
      setSelectedAddressId(fallback[0]?.id || "")
      setAddressForm(createAddressFormState("Client Account", "+971 "))
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (currentUserId) return
    if (shippingAddresses.length === 0 || typeof window === "undefined") return
    window.localStorage.setItem(CHECKOUT_ADDRESS_STORAGE_KEY, JSON.stringify(shippingAddresses))
  }, [currentUserId, shippingAddresses])

  useEffect(() => {
    if (shippingAddresses.length === 0) return
    if (selectedAddressId && shippingAddresses.some((address) => address.id === selectedAddressId)) return
    setSelectedAddressId(shippingAddresses.find((address) => address.isPrimary)?.id || shippingAddresses[0]?.id || "")
  }, [selectedAddressId, shippingAddresses])

  const updateAddressField = <K extends keyof CheckoutAddressFormState>(
    field: K,
    value: CheckoutAddressFormState[K]
  ) => {
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
    const hasMissingRequired = requiredFields.some((field) => !field.trim())
    if (hasMissingRequired) {
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

    if (currentUserId) {
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
      return
    }

    setShippingAddresses((prev) => [...prev, nextAddressDraft])
    setSelectedAddressId(nextAddressDraft.id)
    setAddressFormError("")
    setShowAddressForm(false)
    setAddressForm(createAddressFormState(nextAddressDraft.contactName, nextAddressDraft.phone))
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

  const handleCashOnDeliveryCheckout = async () => {
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
        router.push("/login?message=Please%20login%20to%20checkout")
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

      const order = await createCashOnDeliveryOrder(session.access_token, payload)

      clearCart()
      setPromoInput("")
      setPromoMessage("")
      setPromoError(false)

      toast.success(`Order ${order.order_number || order.id} placed successfully`)
      router.push(`/profile?section=orders&order=${encodeURIComponent(order.order_number || order.id)}`)
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
        <p className="text-neutral-500 font-light mb-8 max-w-sm text-center">
          Discover our exclusive collections and find the perfect signature scent.
        </p>
        <Link href="/">
          <Button className="h-14 px-8 rounded-none bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all">
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="h-10 w-10 bg-white shadow-sm flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-4xl font-serif text-neutral-900">Your Shopping Bag</h1>
          <span className="text-sm text-neutral-500 font-light mt-2 ml-2">
            ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
        </div>

        {bundleName && hasBundleFromQueryInCart && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">Bundle:</span> {bundleName}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-neutral-100 h-fit">
            <div className="space-y-2">
              {bundleGroups.map((bundleGroup) => {
                const itemCount = bundleGroup.items.reduce((sum, item) => sum + item.quantity, 0)
                const savings = Math.max(0, bundleGroup.originalTotal - bundleGroup.offerTotal)
                const bundleSetQty = getBundleSetQuantity(bundleGroup)

                return (
                  <div key={bundleGroup.id} className="border border-neutral-200 rounded-2xl p-5 md:p-6 mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700 font-semibold">Bundle Offer</p>
                        <h3 className="text-xl font-serif text-neutral-900 mt-1">{bundleGroup.name}</h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          {itemCount} items selected • {bundleGroup.discountPercent}% OFF
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          bundleGroup.items.forEach((item) =>
                            removeFromCart(
                              getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)
                            )
                          )
                        }
                        className="text-neutral-400 hover:text-black transition-colors"
                        aria-label={`Remove ${bundleGroup.name}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                  

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {bundleGroup.items.map((item) => (
                        <div key={getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)} className="rounded-xl border border-neutral-100 bg-neutral-50 p-2">
                          <div className="relative h-20 w-full rounded-lg overflow-hidden bg-white">
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-xs text-neutral-700 mt-2 line-clamp-1">{item.product.name}</p>
                        </div>
                      ))}
                    </div>
  <div className="mt-3 inline-flex items-center rounded-full border border-neutral-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateBundleSetQuantity(bundleGroup, bundleSetQty - 1)}
                        disabled={bundleSetQty <= 1}
                        className="h-8 w-8 inline-flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label={`Decrease ${bundleGroup.name} quantity`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="h-8 min-w-8 px-2 inline-flex items-center justify-center text-sm font-medium border-x border-neutral-300">
                        {bundleSetQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateBundleSetQuantity(bundleGroup, bundleSetQty + 1)}
                        className="h-8 w-8 inline-flex items-center justify-center hover:bg-neutral-50 transition-colors"
                        aria-label={`Increase ${bundleGroup.name} quantity`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-sm">
                      <div>
                        <span className="text-neutral-500 line-through mr-2">AED {Math.round(bundleGroup.originalTotal)}</span>
                        <span className="font-semibold text-neutral-900">AED {Math.round(bundleGroup.offerTotal)}</span>
                      </div>
                      <span className="text-green-700 font-medium">You save AED {Math.round(savings)}</span>
                    </div>
                    
                  </div>
                )
              })}

              {standaloneItems.map((item) => (
                <CartItem
                  key={getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)}
                  item={item}
                />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 sticky top-24">
              <h2 className="text-xl font-serif mb-6 border-b border-neutral-100 pb-4">Order Summary</h2>

              <div className="space-y-2 mb-6">
                {orderSummaryLines.map((line) => (
                  <div key={line.key} className="flex justify-between items-center text-sm">
                    <span className="text-neutral-700">
                      {line.label}
                      <span className="text-neutral-500"> x{line.quantity}</span>
                    </span>
                    <span className="font-medium text-neutral-900">{formatPrice(line.value)}</span>
                  </div>
                ))}
              </div>

              <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">
                    Delivery Address
                  </p>
                  <span className="text-[11px] text-neutral-500">{shippingAddresses.length} saved</span>
                </div>
                {currentUserId && (
                  <p className="mb-2 text-[11px] text-neutral-500">
                    Synced from your profile addresses.
                  </p>
                )}

                <div className="space-y-2">
                  {shippingAddresses.map((address) => {
                    const isSelected = selectedAddressId === address.id
                    const Icon = address.type === "home" ? House : address.type === "office" ? Briefcase : MapPin

                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition ${
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
                      <input
                        value={addressForm.title}
                        onChange={(event) => updateAddressField("title", event.target.value)}
                        placeholder="Address Title (Home, Office...)"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black sm:col-span-2"
                      />
                      <select
                        value={addressForm.type}
                        onChange={(event) => updateAddressField("type", event.target.value as CheckoutAddressType)}
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
                      >
                        <option value="home">Home</option>
                        <option value="office">Office</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        value={addressForm.postalCode}
                        onChange={(event) => updateAddressField("postalCode", event.target.value)}
                        placeholder="Postal Code"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
                      />
                      <input
                        value={addressForm.contactName}
                        onChange={(event) => updateAddressField("contactName", event.target.value)}
                        placeholder="Contact Name"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
                      />
                      <input
                        value={addressForm.phone}
                        onChange={(event) => updateAddressField("phone", event.target.value)}
                        placeholder="Phone Number"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
                      />
                      <input
                        value={addressForm.line1}
                        onChange={(event) => updateAddressField("line1", event.target.value)}
                        placeholder="Address Line 1"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black sm:col-span-2"
                      />
                      <input
                        value={addressForm.line2}
                        onChange={(event) => updateAddressField("line2", event.target.value)}
                        placeholder="Address Line 2 (Optional)"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black sm:col-span-2"
                      />
                      <input
                        value={addressForm.city}
                        onChange={(event) => updateAddressField("city", event.target.value)}
                        placeholder="City"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
                      />
                      <input
                        value={addressForm.state}
                        onChange={(event) => updateAddressField("state", event.target.value)}
                        placeholder="State"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
                      />
                      <input
                        value={addressForm.country}
                        onChange={(event) => updateAddressField("country", event.target.value)}
                        placeholder="Country"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
                      />
                      <input
                        value={addressForm.landmark}
                        onChange={(event) => updateAddressField("landmark", event.target.value)}
                        placeholder="Landmark (Optional)"
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
                      />
                    </div>
                    {addressFormError && <p className="mt-2 text-xs text-red-600">{addressFormError}</p>}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={addAddress}
                        disabled={isSavingAddress}
                        className="h-10 flex-1 rounded-lg bg-black px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 disabled:opacity-60"
                      >
                        {isSavingAddress ? "Saving..." : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isSavingAddress) return
                          setShowAddressForm(false)
                          setAddressFormError("")
                        }}
                        className="h-10 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black hover:text-black"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {selectedCheckoutAddress && (
                  <p className="mt-3 text-xs text-neutral-500">
                    Selected: <span className="font-medium text-neutral-700">{selectedCheckoutAddress.title}</span>
                  </p>
                )}
              </div>

              <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">
                  Promo Code
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={promoInputValue}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
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
                    <button
                      type="button"
                      onClick={removePromo}
                      className="self-start font-semibold hover:text-black sm:self-auto"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {promoMessage && (
                  <p
                    className={`mt-2 text-xs leading-relaxed ${promoError ? "text-red-600" : "text-emerald-700"}`}
                  >
                    {promoMessage}
                  </p>
                )}
              </div>
              
              <div className="space-y-4 text-sm font-light text-neutral-600 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-black">{formatPrice(totalPrice)}</span>
                </div>
                {promo && promoDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promo Discount</span>
                    <span>- {formatPrice(promoDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium tracking-wide">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-neutral-100 pt-6 mb-8 text-neutral-900">
                <span className="font-serif">Total</span>
                <span className="text-2xl font-serif">{formatPrice(discountedTotal)}</span>
              </div>

              <Button
                onClick={handleCashOnDeliveryCheckout}
                disabled={isPlacingOrder}
                className="w-full h-14 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all shadow-lg shadow-black/10 disabled:opacity-60"
              >
                {isPlacingOrder ? "Placing Order..." : "Proceed to Checkout"}
              </Button>

              <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-center text-[11px] uppercase tracking-[0.12em] text-neutral-600">
                Cash On Delivery Only
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-neutral-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 9H19L21 21H3L5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-medium">Secure Order Placement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
