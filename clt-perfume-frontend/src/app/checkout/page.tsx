"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingBag, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useProfile } from "@/contexts/profile-context"
import { createBankCheckoutSession, createCashOnDeliveryOrder, validatePromoCode } from "@/lib/api"
import { verifyEmailAbstract } from "@/app/auth/actions"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckoutContactInfo } from "./parts/checkout-contact-info"
import { CheckoutAddressSection } from "./parts/checkout-address-section"
import { CheckoutPaymentMethods } from "./parts/checkout-payment-methods"
import { CheckoutOrderReview } from "./parts/checkout-order-review"
import {
  createCheckoutSuccessSnapshot,
  storeCheckoutSuccessSnapshot,
} from "./checkout-success-storage"
import { useForm } from "react-hook-form"
import { 
  CheckoutAddress, 
  CheckoutAddressFormState, 
  PaymentMethod, 
  UserAddressRow 
} from "./checkout-types"
import { 
  createAddressFormState, 
  createAddressId, 
  mapUserAddressRow 
} from "./checkout-utils"
 
export default function CheckoutPage() {
  const {
    items,
    totalPrice,
    totalItems,
    promo,
    setPromo,
    promoDiscountAmount,
    discountedTotal,
  } = useCart()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { addresses: globalAddresses, profile, loading: isProfileLoading } = useProfile()
  const router = useRouter()
 
  const { control, formState: { errors }, watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      email: "",
      whatsapp: "+971 "
    }
  })
 
  const contactWhatsapp = watch("whatsapp")
 
  const [promoInput, setPromoInput] = useState("")
  const [promoMessage, setPromoMessage] = useState("")
  const [promoError, setPromoError] = useState(false)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
 
  const [shippingAddresses, setShippingAddresses] = useState<CheckoutAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressFormError, setAddressFormError] = useState("")
  const [addressForm, setAddressForm] = useState<CheckoutAddressFormState>(() =>
    createAddressFormState("Client Account", contactWhatsapp || "+971 ")
  )
 
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const currentUserId = user?.id || null
 
  // Sync global pre-fetched addresses to local state
  useEffect(() => {
    if (globalAddresses.length > 0) {
      setShippingAddresses(globalAddresses)
      // Only auto-select if nothing is selected or if current selection is invalid
      if (!selectedAddressId || !globalAddresses.some(a => a.id === selectedAddressId)) {
        const primary = globalAddresses.find(a => a.isPrimary) || globalAddresses[0]
        setSelectedAddressId(primary.id)
      }
    }
  }, [globalAddresses, selectedAddressId])
 
  // Initial form values from profile
  useEffect(() => {
    if (profile) {
      const contactName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || (user?.email?.split("@")[0] || "Client Account")
      const phone = profile.phone?.trim() || "+971 "
      setAddressForm(createAddressFormState(contactName, phone))
      setValue("whatsapp", phone)
    }
  }, [profile, user?.email, setValue])
 
  useEffect(() => {
    if (user?.email) {
      setValue("email", user.email)
    }
  }, [user?.email, setValue])
 
  const selectedCheckoutAddress = useMemo(
    () => shippingAddresses.find((address) => address.id === selectedAddressId) || null,
    [selectedAddressId, shippingAddresses]
  )
 
  const promoInputValue = promo ? promo.code : promoInput
 
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart")
    }
  }, [items.length, router])
 
  // Final layout check...

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
      setShippingAddresses([nextAddressDraft])
      setSelectedAddressId(nextAddressDraft.id)
      setAddressFormError("")
      setShowAddressForm(false)
      setAddressForm(createAddressFormState(nextAddressDraft.contactName, nextAddressDraft.phone))
      toast.success("Guest address saved")
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

  interface CheckoutFormData {
    email: string
    whatsapp: string
  }

  async function placeOrder(formData: CheckoutFormData) {
    const contactEmail = String(formData.email || "").trim()
    const contactWhatsapp = String(formData.whatsapp || "").trim()

    if (items.length === 0) {
      toast.error("Your bag is empty.")
      return
    }
    if (!currentUserId && !contactEmail.trim()) {
      toast.error("Please provide an email address for order updates.")
      return
    }
    if (!contactWhatsapp.trim()) {
      toast.error("Please provide a WhatsApp or contact number.")
      return
    }
    if (!selectedCheckoutAddress) {
      toast.error("Please choose a delivery address.")
      return
    }

    // Validate guest email using Abstract API (same as signup)
    if (!currentUserId && contactEmail.trim()) {
      setIsPlacingOrder(true)
      try {
        const emailCheck = await verifyEmailAbstract(contactEmail.trim())
        if (!emailCheck.success) {
          toast.error(emailCheck.message || "Please provide a valid, deliverable email address.")
          setIsPlacingOrder(false)
          return
        }
      } catch (err) {
        console.error("Email verification service error:", err)
        // If the checking service fails, we continue anyway to avoid losing a sale
      }
    }

    setIsPlacingOrder(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const payload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        promo: promo
          ? {
              code: promo.code,
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
          contact_email: contactEmail.trim() || user?.email || "",
          contact_whatsapp: contactWhatsapp.trim(),
        },
      }

      const baseSuccessSnapshot = createCheckoutSuccessSnapshot({
        items,
        paymentMethod,
        subtotal: totalPrice,
        discount: promoDiscountAmount,
        total: discountedTotal,
        email: contactEmail.trim() || user?.email || "",
        whatsapp: contactWhatsapp.trim(),
        address: selectedCheckoutAddress,
      })

      const token = session?.access_token || null

      if (paymentMethod === "cod") {
        const order = await createCashOnDeliveryOrder(token, payload)
        storeCheckoutSuccessSnapshot({
          ...baseSuccessSnapshot,
          orderId: order.id,
          orderNumber: order.order_number || order.id,
          paymentMethod: "cod",
        })
        toast.success(`Order ${order.order_number || order.id} placed successfully`)
        router.push(
          `/checkout/success?order_id=${encodeURIComponent(order.id)}&order_number=${encodeURIComponent(order.order_number || order.id)}&payment=cod`
        )
        return
      }

      const checkoutSession = await createBankCheckoutSession(token, payload)
      if (!checkoutSession.url) {
        throw new Error("Unable to start bank payment checkout")
      }

      storeCheckoutSuccessSnapshot({
        ...baseSuccessSnapshot,
        orderId: checkoutSession.orderId,
        paymentMethod: "bank",
      })
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

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-600" />
        </div>
        <h1 className="text-2xl font-serif text-neutral-900 mb-2">Securing Checkout</h1>
        <p className="text-neutral-500 font-light max-w-sm text-center">Verifying account access and loading your delivery details.</p>
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
            <CheckoutContactInfo 
              currentUserId={currentUserId}
              control={control}
              errors={errors}
            />

            <CheckoutAddressSection 
              shippingAddresses={shippingAddresses}
              selectedAddressId={selectedAddressId}
              setSelectedAddressId={setSelectedAddressId}
              showAddressForm={showAddressForm}
              setShowAddressForm={setShowAddressForm}
              isSavingAddress={isSavingAddress}
              addressFormError={addressFormError}
              setAddressFormError={setAddressFormError}
              addressForm={addressForm}
              updateAddressField={updateAddressField}
              onSaveAddress={addAddress}
              contactWhatsapp={contactWhatsapp}
            />

            <CheckoutPaymentMethods 
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          </section>

          <CheckoutOrderReview 
            items={items}
            currentUserId={currentUserId}
            promoInputValue={promoInputValue}
            onPromoInputChange={setPromoInput}
            onApplyPromo={applyPromo}
            promo={promo}
            isApplyingPromo={isApplyingPromo}
            removePromo={removePromo}
            promoMessage={promoMessage}
            promoError={promoError}
            totalItems={totalItems}
            totalPrice={totalPrice}
            promoDiscountAmount={promoDiscountAmount}
            discountedTotal={discountedTotal}
            onPlaceOrder={handleSubmit(placeOrder)}
            isPlacingOrder={isPlacingOrder}
            paymentMethod={paymentMethod}
          />
        </div>
      </div>
    </div>
  )
}
