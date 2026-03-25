import { Briefcase, Crown, Edit3, House, MapPin, Plus, Trash2 } from "lucide-react"
import type { AddressFormState, AddressRecord, AddressType } from "./profile-types"

type ProfileAddressesSectionProps = {
  addressesLoading: boolean
  addresses: AddressRecord[]
  showAddressForm: boolean
  editingAddressId: string | null
  isSavingAddress: boolean
  updatingPrimaryId: string | null
  addressError: string
  newAddress: AddressFormState
  onOpenAddAddressForm: () => void
  onSaveAddress: () => void
  onCancelAddressForm: () => void
  onUpdateAddress: <K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) => void
  onOpenEditAddressForm: (address: AddressRecord) => void
  onSetPrimaryAddress: (addressId: string) => void
  onDeleteAddress: (addressId: string) => void
}

export function ProfileAddressesSection({
  addressesLoading,
  addresses,
  showAddressForm,
  editingAddressId,
  isSavingAddress,
  updatingPrimaryId,
  addressError,
  newAddress,
  onOpenAddAddressForm,
  onSaveAddress,
  onCancelAddressForm,
  onUpdateAddress,
  onOpenEditAddressForm,
  onSetPrimaryAddress,
  onDeleteAddress,
}: ProfileAddressesSectionProps) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <h2 className="font-serif text-2xl text-neutral-900">My Addresses</h2>
        <button
          onClick={onOpenAddAddressForm}
          className="inline-flex items-center gap-2 rounded-xl border border-black bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black"
        >
          <Plus className="h-4 w-4" />
          Add More Address
        </button>
      </div>

      {showAddressForm && (
        <div className="mb-5 rounded-2xl border border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {editingAddressId ? "Edit Address" : "New Address"}
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={newAddress.title}
              onChange={(event) => onUpdateAddress("title", event.target.value)}
              placeholder="Address title"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black md:col-span-2"
            />
            <select
              value={newAddress.type}
              onChange={(event) => onUpdateAddress("type", event.target.value as AddressType)}
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black"
            >
              <option value="home">Home</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
            <input
              value={newAddress.phone}
              onChange={(event) => onUpdateAddress("phone", event.target.value)}
              placeholder="Phone number"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black"
            />
            <input
              value={newAddress.contactName}
              onChange={(event) => onUpdateAddress("contactName", event.target.value)}
              placeholder="Contact name"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black"
            />
            <input
              value={newAddress.city}
              onChange={(event) => onUpdateAddress("city", event.target.value)}
              placeholder="City"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black"
            />
            <input
              value={newAddress.country}
              onChange={(event) => onUpdateAddress("country", event.target.value)}
              placeholder="Country"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black"
            />
            <input
              value={newAddress.line1}
              onChange={(event) => onUpdateAddress("line1", event.target.value)}
              placeholder="Address line 1"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black md:col-span-2"
            />
            <input
              value={newAddress.line2}
              onChange={(event) => onUpdateAddress("line2", event.target.value)}
              placeholder="Address line 2 (optional)"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black md:col-span-2"
            />
          </div>
          {addressError && <p className="mt-2 text-xs text-red-600">{addressError}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={onSaveAddress}
              disabled={isSavingAddress}
              className="rounded-xl border border-black bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:opacity-60"
            >
              {isSavingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
            </button>
            <button
              onClick={onCancelAddressForm}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-black hover:text-black"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {addressesLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
          No saved addresses yet. Add your first address.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((address) => {
            const Icon = address.type === "home" ? House : address.type === "office" ? Briefcase : MapPin

            return (
              <article key={address.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">{address.title}</h3>
                      {address.isPrimary && (
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">Primary Address</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!address.isPrimary && (
                      <button
                        type="button"
                        onClick={() => onSetPrimaryAddress(address.id)}
                        disabled={updatingPrimaryId === address.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:border-amber-300 disabled:opacity-60"
                      >
                        <Crown className="h-3.5 w-3.5" />
                        {updatingPrimaryId === address.id ? "..." : "Primary"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenEditAddressForm(address)}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 transition hover:border-black hover:text-black"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAddress(address.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:border-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-neutral-700">
                  <p className="font-medium text-neutral-900">{address.contactName}</p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.country}
                  </p>
                  <p className="pt-1 text-neutral-600">{address.phone}</p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
