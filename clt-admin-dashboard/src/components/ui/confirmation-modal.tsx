"use client"

import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes, Deactivate",
  cancelText = "No, Keep it",
  variant = "danger"
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        <div className="p-8 pt-10 text-center">
          <div className={cn(
            "h-20 w-20 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce",
            variant === "danger" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
          )}>
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-2xl font-serif text-neutral-900 mb-2">{title}</h3>
          <p className="text-sm text-neutral-500 font-light leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-6 bg-neutral-50 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-14 rounded-2xl border-neutral-200 text-xs font-black uppercase tracking-widest hover:bg-white"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className={cn(
              "flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95",
              variant === "danger" ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200" : "bg-black hover:bg-neutral-800 text-white shadow-black/10"
            )}
          >
            {confirmText}
          </Button>
        </div>

        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-neutral-300 hover:text-black transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
