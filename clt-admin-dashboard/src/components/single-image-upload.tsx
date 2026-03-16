"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ImageIcon, Loader2, X } from "lucide-react"

interface SingleImageUploadProps {
  onUpload: (url: string) => void
  onRemove: () => void
  value?: string
  label?: string
}

export function SingleImageUpload({ onUpload, onRemove, value, label }: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `site/${fileName}`

      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file)
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath)

      onUpload(publicUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error uploading. Ensure 'product-images' bucket exists and is public.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
          {label}
        </label>
      )}

      <div className="relative min-h-[110px] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
        {value ? (
          <div className="group relative h-[130px] w-full">
            <Image src={value} alt="Preview" fill className="object-cover" />
            <button
              type="button"
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
              onClick={onRemove}
            >
              <X size={18} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">Remove</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex h-[110px] w-full flex-col items-center justify-center gap-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImageIcon size={20} />
                <span className="text-xs font-medium">Upload Image</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}
