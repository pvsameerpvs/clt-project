"use client"

import { FormEvent } from "react"
import { SingleImageUpload } from "@/components/single-image-upload"
import { Category } from "@/lib/admin-api"

interface CategoryFormProps {
  form: Partial<Category>
  setForm: (form: any) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onClear: () => void
  saving: boolean
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function CategoryForm({ form, setForm, onSubmit, onClear, saving }: CategoryFormProps) {
  const isEditing = Boolean(form.id)
  const generatedSlug = slugify(form.name || "")

  return (
    <form className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm" onSubmit={onSubmit}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold">{isEditing ? "Edit Collection" : "New Collection"}</h2>
          <p className="text-xs text-neutral-500 mt-1">Organize your perfumes into logical groups.</p>
        </div>
        {isEditing && (
          <button onClick={onClear} type="button" className="text-xs font-bold text-neutral-400 hover:text-black">
            New
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Name</label>
          <input 
            className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black"
            value={form.name || ""}
            onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Arabic Collection"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Slug</label>
          <div className="flex gap-2">
            <input 
              className="w-full border rounded-xl p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-black"
              value={form.slug || ""}
              onChange={(e) => setForm((prev: any) => ({ ...prev, slug: e.target.value }))}
              placeholder="arabic-collection"
            />
            <button 
              type="button"
              className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-neutral-50"
              onClick={() => setForm((prev: any) => ({ ...prev, slug: generatedSlug }))}
              disabled={!generatedSlug}
            >
              Auto
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Description</label>
          <textarea 
            className="w-full border rounded-xl p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-black"
            value={form.description || ""}
            onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
            placeholder="Short summary of this collection..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Thumbnail</label>
          <SingleImageUpload 
            value={form.image_url || ""}
            onUpload={(url) => setForm((prev: any) => ({ ...prev, image_url: url }))}
            onRemove={() => setForm((prev: any) => ({ ...prev, image_url: "" }))}
          />
        </div>

        <button 
          className="w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-lg mt-4" 
          disabled={saving} 
          type="submit"
        >
          {saving ? "Saving..." : isEditing ? "Update Category" : "Save Category"}
        </button>
      </div>
    </form>
  )
}
