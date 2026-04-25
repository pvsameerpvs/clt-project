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
  contactWhatsapp?: string
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
  onSaveAddress,
  contactWhatsapp
}: CheckoutAddressSectionProps) {
  return (
    <article className="rounded-2xl border border-neutral-100 bg-white p-5 md:p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h2 className="font-serif text-xl md:text-2xl text-neutral-900 flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white font-sans font-bold">2</span>
          Delivery Address
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">{shippingAddresses.length} saved</span>
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
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-neutral-900 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                  : "border-neutral-100 bg-neutral-50/50 hover:border-neutral-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${isSelected ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-400"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className={`text-[11px] uppercase tracking-widest font-bold ${isSelected ? "text-neutral-900" : "text-neutral-500"}`}>{address.title}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{address.contactName}</p>
                  </div>
                </div>
                {isSelected && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="mt-3 text-[11px] text-neutral-600 leading-relaxed pr-6">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.country}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-400">
                <span className="uppercase tracking-widest font-medium">Contact:</span>
                <span>{address.phone}</span>
              </div>
            </button>
          )
        })}
      </div>

      {!showAddressForm ? (
        <button
          type="button"
          onClick={() => {
            setAddressFormError("")
            // Sync current contact whatsapp to the address form before opening if it's currently empty
            if (!addressForm.phone || addressForm.phone === "+971 " || addressForm.phone === " ") {
              updateAddressField("phone", contactWhatsapp || "+971 ")
            }
            setShowAddressForm(true)
          }}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 transition-all hover:border-neutral-900 hover:text-neutral-900"
        >
          <PlusCircle className="h-4 w-4" />
          Add New Delivery Address
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Address Label</label>
              <input value={addressForm.title} onChange={(event) => updateAddressField("title", event.target.value)} placeholder="e.g. Home, Office, Parents House" className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Type</label>
              <select value={addressForm.type} onChange={(event) => updateAddressField("type", event.target.value as CheckoutAddressType)} className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black">
                <option value="home">Home</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Postal Code</label>
              <input value={addressForm.postalCode} onChange={(event) => updateAddressField("postalCode", event.target.value)} placeholder="00000" className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Receiver Name</label>
              <input value={addressForm.contactName} onChange={(event) => updateAddressField("contactName", event.target.value)} placeholder="Full Name" className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Receiver Phone</label>
              <input value={addressForm.phone} onChange={(event) => updateAddressField("phone", event.target.value)} placeholder="+971" className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Street Address</label>
              <input value={addressForm.line1} onChange={(event) => updateAddressField("line1", event.target.value)} placeholder="Building name, Street, Apartment..." className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Apartment / Suite (Optional)</label>
              <input value={addressForm.line2} onChange={(event) => updateAddressField("line2", event.target.value)} placeholder="Apt 101" className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">City</label>
              <input value={addressForm.city} onChange={(event) => updateAddressField("city", event.target.value)} placeholder="Dubai" className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Country</label>
              <input value={addressForm.country} onChange={(event) => updateAddressField("country", event.target.value)} placeholder="United Arab Emirates" className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black" />
            </div>
          </div>
          {addressFormError && <p className="mt-3 text-[10px] text-red-500 font-bold uppercase tracking-widest">{addressFormError}</p>}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onSaveAddress} disabled={isSavingAddress} className="h-12 flex-1 rounded-xl bg-neutral-900 px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-60">
              {isSavingAddress ? "Saving..." : "Save Address"}
            </button>
            <button type="button" onClick={() => { if (isSavingAddress) return; setShowAddressForm(false); setAddressFormError("") }} className="h-12 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-400 transition hover:border-neutral-900 hover:text-neutral-900">
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
