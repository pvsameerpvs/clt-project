"use client"

import { Category } from "@/lib/admin-api"

interface CategoryListProps {
  categories: Category[]
  loading: boolean
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}

export function CategoryList({ categories, loading, onEdit, onDelete }: CategoryListProps) {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))
  const sortedCategories = [...categories].sort((a, b) => {
    if (!a.parent_id && b.parent_id) return -1
    if (a.parent_id && !b.parent_id) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200">
      <h2 className="text-xl font-bold mb-6">Existing Collections</h2>
      
      {loading ? (
        <div className="py-20 text-center text-neutral-400">Loading collections...</div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center text-neutral-400 border-2 border-dashed rounded-2xl">
          No collections created yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map((cat) => (
            <div key={cat.id} className="group relative border rounded-2xl p-4 hover:border-black transition-all bg-neutral-50">
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-neutral-200">
                {cat.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">No Image</div>
                )}
              </div>
              
              <h3 className="font-bold text-sm tracking-tight">{cat.name}</h3>
              <p className="text-[11px] text-neutral-500 font-mono">/{cat.slug}</p>
              <p className="text-[11px] mt-1 text-neutral-500">
                {cat.parent_id
                  ? `Child of: ${categoryNameById.get(cat.parent_id) || "Unknown"}`
                  : "Top-level category"}
              </p>
              
              <div className="mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEdit(cat)}
                  className="text-xs font-bold text-neutral-900 border-b border-black pb-0.5"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(cat.id)}
                  className="text-xs font-bold text-red-600 border-b border-red-200 pb-0.5 hover:border-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
