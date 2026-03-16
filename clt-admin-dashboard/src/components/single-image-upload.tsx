"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"

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

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath)

      onUpload(publicUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error uploading. Ensure 'product-images' bucket exists and is public.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="single-upload">
      {label && <label className="upload-label">{label}</label>}
      
      <div className="upload-box">
        {value ? (
          <div className="preview-container">
            <img src={value} alt="Preview" className="preview-img" />
            <button type="button" className="remove-overlay" onClick={onRemove}>
              <X size={20} />
              <span>Remove</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="placeholder-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <ImageIcon size={20} />
                <span>Upload Image</span>
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
        style={{ display: "none" }}
      />

      <style jsx>{`
        .single-upload {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        .upload-label {
          font-size: 11px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .upload-box {
          position: relative;
          width: 100%;
          min-height: 100px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          overflow: hidden;
        }
        .preview-container {
          position: relative;
          width: 100%;
          height: 120px;
        }
        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
          border: none;
          cursor: pointer;
        }
        .preview-container:hover .remove-overlay {
          opacity: 1;
        }
        .remove-overlay span {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .placeholder-btn {
          width: 100%;
          height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          transition: all 0.2s;
        }
        .placeholder-btn:hover {
          color: #4b5563;
          background: #f3f4f6;
        }
        .placeholder-btn span {
          font-size: 12px;
          font-weight: 500;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
