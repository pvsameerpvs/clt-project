import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"

interface CheckoutContactInfoProps {
  currentUserId: string | null | undefined
  contactEmail: string
  setContactEmail: (email: string) => void
  contactWhatsapp: string
  setContactWhatsapp: (whatsapp: string) => void
}

export function CheckoutContactInfo({ 
  currentUserId, 
  contactEmail, 
  setContactEmail, 
  contactWhatsapp, 
  setContactWhatsapp 
}: CheckoutContactInfoProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      <h2 className="mb-4 font-serif text-2xl text-neutral-900">1. Contact Information</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {!currentUserId && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Email Address *</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-black"
            />
          </div>
        )}
        <div className="space-y-1.5 overflow-visible">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">WhatsApp Number *</label>
          <div className="whatsapp-phone-input">
            <PhoneInput
              defaultCountry="ae"
              value={contactWhatsapp}
              onChange={(phone) => setContactWhatsapp(phone)}
              className="w-full"
              inputStyle={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                paddingLeft: '12px'
              }}
              countrySelectorStyleProps={{
                buttonStyle: {
                  height: '44px',
                  borderRadius: '8px 0 0 8px',
                  border: '1px solid #d1d5db',
                  borderRight: 'none',
                  backgroundColor: '#f9fafb'
                }
              }}
            />
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Used for order updates and tracking.</p>
        </div>
      </div>

      <style jsx global>{`
        .whatsapp-phone-input .react-international-phone-input-container {
          width: 100% !important;
        }
        .whatsapp-phone-input .react-international-phone-input {
          flex: 1 !important;
        }
        .whatsapp-phone-input .react-international-phone-country-selector-button {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
      `}</style>
    </article>
  )
}
