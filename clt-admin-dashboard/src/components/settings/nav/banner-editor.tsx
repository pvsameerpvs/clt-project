"use client"

import { Trash2 } from "lucide-react"
import { SingleImageUpload } from "@/components/single-image-upload"

interface Banner {
  title: string
  image: string
  href?: string
  product_slugs?: string[]
}

interface BannerEditorProps {
  banner: Banner
  productOptions: { slug: string; name: string }[]
  onUpdate: (patch: Partial<Banner>) => void
  onRemove: () => void
  getProductSelection: (item: { href?: string; product_slugs?: string[] }) => string[]
  toMultiProductHref: (slugs: string[]) => string
}

export function BannerEditor({
  banner,
  productOptions,
  onUpdate,
  onRemove,
  getProductSelection,
  toMultiProductHref,
}: BannerEditorProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <input
          className="h-9 flex-1 rounded-lg border border-neutral-200 px-3 text-xs font-semibold uppercase tracking-wide outline-none focus:border-black"
          value={banner.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Banner Title"
        />
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <select
        className="mb-3 min-h-[100px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-black"
        multiple
        value={getProductSelection(banner)}
        onChange={(e) => {
          const selectedSlugs = Array.from(e.target.selectedOptions).map((o) => o.value)
          onUpdate({
            product_slugs: selectedSlugs,
            href: toMultiProductHref(selectedSlugs),
          })
        }}
      >
        {productOptions.map((product) => (
          <option key={`banner-${product.slug}`} value={product.slug}>
            {product.name}
          </option>
        ))}
      </select>

      <input
        className="mb-3 h-9 w-full rounded-lg border border-neutral-200 px-3 text-[10px] font-mono outline-none focus:border-black"
        value={banner.href || ""}
        onChange={(e) => onUpdate({ href: e.target.value })}
        placeholder="/collections/..."
      />

      <SingleImageUpload
        value={banner.image}
        onUpload={(url) => onUpdate({ image: url })}
        onRemove={() => onUpdate({ image: "" })}
      />
    </div>
  )
}
