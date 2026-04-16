import { Briefcase, Check, House, MapPin, PlusCircle } from "lucide-react"
import { CheckoutAddress, CheckoutAddressFormState, CheckoutAddressType } from "../checkout-types"

interface CheckoutAddressSectionProps {
  shippingAddresses: CheckoutAddress[]
  selectedAddressId: string
  setSelectedAddressId: (id: string) => void
  showAddressForm: boolean
  setShowAddressForm: (show: boolean) => void
  isSavingAddress: boolean
  addressFormError: string
  setAddressFormError: (error: string) => void
  addressForm: CheckoutAddressFormState
  updateAddressField: <K extends keyof CheckoutAddressFormState>(field: K, value: CheckoutAddressFormState[K]) => void
  onSaveAddress: () => void
}

export function CheckoutAddressSection({
  shippingAddresses,
  selectedAddressId,
  setSelectedAddressId,
  showAddressForm,
  setShowAddressForm,
  isSavingAddress,
  addressFormError,
  setAddressFormError,
  addressForm,
  updateAddressField,
  onSaveAddress
}: CheckoutAddressSectionProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-serif text-2xl text-neutral-900">2. Delivery Address</h2>
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
            <button type="button" onClick={onSaveAddress} disabled={isSavingAddress} className="h-10 flex-1 rounded-lg bg-black px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 disabled:opacity-60">
              {isSavingAddress ? "Saving..." : "Save Address"}
            </button>
            <button type="button" onClick={() => { if (isSavingAddress) return; setShowAddressForm(false); setAddressFormError("") }} className="h-10 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black hover:text-black">
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
