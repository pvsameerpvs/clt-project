"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, X } from "lucide-react"

interface ImageUploadProps {
  onUpload: (url: string) => void
  onRemove: (url: string) => void
  images: string[]
}

export function ImageUpload({ onUpload, onRemove, images }: ImageUploadProps) {
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
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath)

      onUpload(publicUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error uploading image. Make sure 'product-images' bucket is created and public in Supabase.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="image-upload-container">
      <div className="image-grid">
        {images.map((url, index) => (
          <div key={index} className="image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Product ${index + 1}`} />
            <button
              type="button"
              className="remove-btn"
              onClick={() => onRemove(url)}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          type="button"
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <Upload size={24} />
              <span>Upload</span>
            </>
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      <style jsx>{`
        .image-upload-container {
          display: grid;
          gap: 8px;
        }
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 12px;
        }
        .image-preview {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e5e7eb;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ef4444;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .upload-btn {
          aspect-ratio: 1;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .upload-btn:hover {
          border-color: #9ca3af;
          background: #f9fafb;
          color: #374151;
        }
        .upload-btn span {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
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
