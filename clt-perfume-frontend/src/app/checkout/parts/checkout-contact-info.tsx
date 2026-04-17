import { Control, Controller, FieldValues, FieldErrors, Path, PathValue } from "react-hook-form"
import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"

interface ContactFields extends FieldValues {
  email?: string
  whatsapp: string
}

interface CheckoutContactInfoProps<T extends ContactFields> {
  currentUserId: string | null | undefined
  control: Control<T>
  errors: FieldErrors<T>
}

export function CheckoutContactInfo<T extends ContactFields>({ 
  currentUserId, 
  control,
  errors
}: CheckoutContactInfoProps<T>) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      <h2 className="mb-4 font-serif text-2xl text-neutral-900">1. Contact Information</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {!currentUserId && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Email Address *</label>
            <Controller
              name={"email" as Path<T>}
              control={control}
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  placeholder="you@example.com"
                  className={`h-11 w-full rounded-lg border px-3 text-sm outline-none transition ${
                    errors.email ? "border-red-500 focus:border-red-500" : "border-neutral-300 focus:border-black"
                  }`}
                />
              )}
            />
            {errors.email && (
              <p className="text-[10px] text-red-500">
                {(errors.email.message as string) || "Invalid email"}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-1.5 overflow-visible">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">WhatsApp Number *</label>
          <div className="whatsapp-phone-input">
            <Controller
              name={"whatsapp" as Path<T>}
              control={control}
              rules={{ 
                required: "WhatsApp number is required",
                validate: (val) => {
                  if (val.length < 8) return "Incomplete number"
                  return true
                }
              }}
              render={({ field: { onChange, value } }) => (
                <PhoneInput
                  defaultCountry="ae"
                  value={value}
                  onChange={(phone, meta) => {
                    const { country } = meta
                    const dialCode = "+" + country.dialCode
                    
                    // 1. Lock the dial code - prevent backspacing it
                    if (!phone.startsWith(dialCode)) {
                      onChange(dialCode as PathValue<T, Path<T>>)
                      return
                    }

                    // 2. Standard Way: Calculate max digits based on country format
                    const formatStr = String(country.format || "................")
                    const matchResult = formatStr.match(/\./g)
                    const maxDigits = (matchResult ? matchResult.length : 15)
                    
                    const digitsOnly = phone.replace(/\D/g, "").slice(country.dialCode.length)
                    
                    if (digitsOnly.length <= maxDigits) {
                      onChange(phone as PathValue<T, Path<T>>)
                    }
                  }}
                  className="w-full"
                  inputStyle={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    border: errors.whatsapp ? '1px solid #ef4444' : '1px solid #d1d5db',
                    paddingLeft: '12px'
                  }}
                  countrySelectorStyleProps={{
                    buttonStyle: {
                      height: '44px',
                      borderRadius: '8px 0 0 8px',
                      borderTop: errors.whatsapp ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderBottom: errors.whatsapp ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderLeft: errors.whatsapp ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRight: 'none',
                      backgroundColor: '#f9fafb'
                    }
                  }}
                />
              )}
            />
          </div>
          {errors.whatsapp && (
            <p className="text-[10px] text-red-500">
              {(errors.whatsapp.message as string) || "Invalid number"}
            </p>
          )}
          <p className="text-[10px] text-neutral-400 mt-1">International standard validation applied.</p>
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
