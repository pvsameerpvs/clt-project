"use client"

import { Dispatch, FormEvent, SetStateAction } from "react"
import { SingleImageUpload } from "@/components/single-image-upload"
import { Category } from "@/lib/admin-api"
import { Plus, Trash2 } from "lucide-react"

interface CategoryFormProps {
  form: Partial<Category>
  setForm: Dispatch<SetStateAction<Partial<Category>>>
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onClear: () => void
  saving: boolean
  categories: Category[]
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function CategoryForm({ form, setForm, onSubmit, onClear, saving, categories }: CategoryFormProps) {
  const isEditing = Boolean(form.id)
  const generatedSlug = slugify(form.name || "")
  const parentCandidates = categories.filter((category) => category.id !== form.id)

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
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Arabic Collection"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Slug</label>
          <div className="flex gap-2">
            <input 
              className="w-full border rounded-xl p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-black"
              value={form.slug || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="arabic-collection"
            />
            <button 
              type="button"
              className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-neutral-50"
              onClick={() => setForm((prev) => ({ ...prev, slug: generatedSlug }))}
              disabled={!generatedSlug}
            >
              Auto
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Parent Category (Optional)</label>
          <select
            className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black bg-white"
            value={form.parent_id || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, parent_id: e.target.value || null }))}
          >
            <option value="">No parent (Top-level)</option>
            {parentCandidates.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.slug})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-500">
            Example: Parent = <span className="font-mono">mens</span>, Child = <span className="font-mono">best-seller-for-men</span>.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Description</label>
          <textarea 
            className="w-full border rounded-xl p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-black"
            value={form.description || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Short summary of this collection..."
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Collection Scent Identity</label>
          <div className="flex flex-wrap gap-2.5">
            {(form.scent_notes || []).map((note, index) => (
              <div key={index} className="flex items-center gap-2 bg-neutral-900 text-white pl-4 pr-1.5 py-1.5 rounded-full shadow-lg shadow-black/10 animate-in fade-in zoom-in-95">
                <span className="text-[11px] font-bold tracking-wide">{note}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(form.scent_notes || [])]
                    next.splice(index, 1)
                    setForm(prev => ({ ...prev, scent_notes: next }))
                  }}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <input 
              id="new-scent-note"
              className="flex-1 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-black transition-all bg-neutral-50/50"
              placeholder="e.g. Damascus Rose"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const val = (e.currentTarget as HTMLInputElement).value.trim()
                  if (val) {
                    setForm(prev => ({ ...prev, scent_notes: [...(prev.scent_notes || []), val] }))
                    e.currentTarget.value = ""
                  }
                }
              }}
            />
            <button 
              type="button"
              className="px-6 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-3 shadow-xl shadow-black/10 hover:scale-105"
              onClick={() => {
                const input = document.getElementById('new-scent-note') as HTMLInputElement
                const val = input.value.trim()
                if (val) {
                  setForm(prev => ({ ...prev, scent_notes: [...(prev.scent_notes || []), val] }))
                  input.value = ""
                }
              }}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 italic">Define unique notes that will appear as dropdown options in the Product Studio.</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Thumbnail</label>
          <SingleImageUpload 
            value={form.image_url || ""}
            onUpload={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
            onRemove={() => setForm((prev) => ({ ...prev, image_url: "" }))}
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
