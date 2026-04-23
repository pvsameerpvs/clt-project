"use client"

import { useForm } from "react-hook-form"
import { Loader2, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type ReturnRequestModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  orderNumber: string
  isLoading: boolean
}

type ReturnFormValues = {
  reason: string
}

export function ReturnRequestModal({
  isOpen,
  onClose,
  onSubmit,
  orderNumber,
  isLoading,
}: ReturnRequestModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReturnFormValues>()

  if (!isOpen) return null

  const handleFormSubmit = async (data: ReturnFormValues) => {
    await onSubmit(data.reason)
    reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 p-5 md:p-6">
          <div>
            <h3 className="font-serif text-xl text-neutral-900">Request Return</h3>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-0.5">Order #{orderNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-100 p-4 flex gap-3">
             <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
             <div className="text-xs text-amber-800 leading-relaxed font-medium">
                Are you sure you want to return this order? Once submitted, our team will review your request within 24 hours.
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 ml-1">
                Reason for Return <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="reason"
                {...register("reason", { 
                  required: "Please provide a reason for your return request",
                  minLength: { value: 10, message: "Please provide a more detailed reason (min 10 characters)" }
                })}
                placeholder="e.g., Product arrived damaged, incorrect item received..."
                className={cn(
                  "flex min-h-[100px] w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm transition-all focus:border-black focus:outline-none focus:ring-0 resize-none",
                  errors.reason && "border-red-500 bg-red-50/50"
                )}
              />
              {errors.reason && (
                <p className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors.reason.message}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-neutral-200 text-xs uppercase tracking-widest font-bold hover:bg-neutral-50"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs uppercase tracking-widest font-bold shadow-lg shadow-black/10 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm Return"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
