"use client"

import { Category } from "@/lib/admin-api"
import { buildCategoryHierarchyOptions, getDirectChildrenCount } from "@/lib/category-hierarchy"

interface CategoryListProps {
  categories: Category[]
  loading: boolean
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}

export function CategoryList({ categories, loading, onEdit, onDelete }: CategoryListProps) {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))
  const hierarchy = buildCategoryHierarchyOptions(categories)
  const directChildrenCount = getDirectChildrenCount(categories)

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
        <div className="space-y-3">
          {hierarchy.map((entry) => {
            const cat = entry.category
            const levelLabel = entry.depth === 0 ? "Top-level" : `Level ${entry.depth + 1}`
            const childCount = directChildrenCount.get(cat.id) || 0

            return (
              <div key={cat.id} className="group relative rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4 transition-colors hover:border-black">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start" style={{ paddingLeft: `${Math.min(entry.depth, 5) * 16}px` }}>
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                    {cat.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-500">{entry.path}</p>
                    <h3 className="mt-0.5 text-sm font-bold tracking-tight text-neutral-900">{cat.name}</h3>
                    <p className="text-[11px] font-mono text-neutral-500">/{cat.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
                      <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-neutral-600">{levelLabel}</span>
                      <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-neutral-600">
                        Children: {childCount}
                      </span>
                      <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-neutral-600">
                        {entry.isLeaf ? "Leaf" : "Branch"}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-500">
                      {cat.parent_id ? `Parent: ${categoryNameById.get(cat.parent_id) || "Unknown"}` : "No parent (navbar level)"}
                    </p>
                  </div>

                  <div className="flex gap-3 self-start sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
