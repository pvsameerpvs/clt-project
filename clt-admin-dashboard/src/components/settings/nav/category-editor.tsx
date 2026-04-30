"use client"

import { Plus, Trash2 } from "lucide-react"
import { NavCategory } from "@/lib/admin-api"

interface CategoryEditorProps {
  category: NavCategory
  onUpdate: (patch: Partial<NavCategory>) => void
  onRemove: () => void
  slugify: (val: string) => string
}

export function CategoryEditor({
  category,
  onUpdate,
  onRemove,
  slugify,
}: CategoryEditorProps) {
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs outline-none focus:border-black"
          value={category.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Category Name"
        />
        <input
          className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs outline-none focus:border-black"
          value={category.slug}
          onChange={(e) => onUpdate({ slug: slugify(e.target.value) })}
          placeholder="category-slug"
        />
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50"
          onClick={onRemove}
          aria-label="Remove category"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Subcategories</p>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-700 hover:border-black hover:text-black"
            onClick={() =>
              onUpdate({
                subcategories: [...category.subcategories, "New Subcategory"],
              })
            }
          >
            <Plus className="h-3 w-3" />
            Add Sub
          </button>
        </div>
        <div className="space-y-1.5">
          {category.subcategories.length === 0 && (
            <p className="text-[11px] text-neutral-500">No subcategories yet.</p>
          )}
          {category.subcategories.map((subcategory, subcategoryIndex) => (
            <div key={`subcategory-${subcategoryIndex}`} className="flex items-center gap-2">
              <input
                className="h-8 flex-1 rounded-md border border-neutral-300 bg-white px-2 text-[11px] outline-none focus:border-black"
                value={subcategory}
                onChange={(e) => {
                  const next = [...category.subcategories]
                  next[subcategoryIndex] = e.target.value
                  onUpdate({ subcategories: next })
                }}
                placeholder="Subcategory name"
              />
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50"
                onClick={() => {
                  const next = category.subcategories.filter((_, idx) => idx !== subcategoryIndex)
                  onUpdate({ subcategories: next })
                }}
                aria-label="Remove subcategory"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-700 hover:border-black hover:text-black"
        onClick={() => onUpdate({ slug: slugify(category.name) })}
      >
        Auto-generate slug
      </button>
    </div>
  )
}
