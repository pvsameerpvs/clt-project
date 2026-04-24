import { useMemo, useState, useEffect } from "react"
import { SingleImageUpload } from "@/components/single-image-upload"
import { CollectionsPreview } from "@/components/preview/collections-preview"
import { OffersPreview } from "@/components/preview/offers-preview"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getAdminCategories, getAdminProducts, type Category, type AdminProduct } from "@/lib/admin-api"
import { Plus, Trash2, Palette, Link2 } from "lucide-react"

interface CuratedCollection {
  href: string
  image: string
  cover_image?: string
  subtitle: string
  title: string
  action: string
  product_slugs?: string[]
}

interface PromoOffer {
  title: string
  description: string
  action: string
  href: string
  badge?: string
  bgColor?: string
  product_slugs?: string[]
  discount_percentage?: number
  is_active?: boolean
  bundle_sizes?: number[]
  bundle_discounts?: Record<string, number>
}

interface CollectionsSettingsProps {
  collections: CuratedCollection[]
  offers: PromoOffer[]
  onCollectionsChange: (cols: CuratedCollection[]) => void
  onOffersChange: (offers: PromoOffer[]) => void
}

const PRESET_COLORS = [
  { name: 'Soft Sand', class: 'bg-[#F3F0EA]' },
  { name: 'Misty Blue', class: 'bg-[#EBEFF5]' },
  { name: 'Rose Cloud', class: 'bg-[#F5EBEB]' },
  { name: 'Sage Leaf', class: 'bg-[#F0F4F2]' },
  { name: 'Noir', class: 'bg-[#1A1A1A] text-white' },
]

const OFFER_BUNDLE_SIZES = [2, 3, 4, 5] as const
type OfferBundleSize = typeof OFFER_BUNDLE_SIZES[number]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function extractCollectionSlug(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  const match = value.match(/^\/collections\/([^/?#]+)/i)
  return match?.[1] ? decodeURIComponent(match[1]) : ""
}

function toCollectionHref(slug: string) {
  const normalized = slugify(slug)
  return normalized ? `/collections/${encodeURIComponent(normalized)}` : ""
}

function toProductHref(slug: string) {
  const normalized = slugify(slug)
  return normalized ? `/product/${encodeURIComponent(normalized)}` : ""
}

function normalizeProductSlugs(input: unknown) {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const values: string[] = []
  for (const token of input) {
    if (typeof token !== "string") continue
    const value = slugify(token)
    if (!value || seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }
  return values
}

function extractProductSlugsFromHref(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  if (!value) return []

  const directMatch = value.match(/^\/product\/([^/?#]+)/i)
  if (directMatch?.[1]) return [slugify(decodeURIComponent(directMatch[1]))]

  const query = value.split("?")[1] || ""
  const params = new URLSearchParams(query)
  const products = params.get("products")
  if (!products) return []

  return products
    .split(",")
    .map((slug) => slugify(decodeURIComponent(slug)))
    .filter(Boolean)
}

function getCollectionProductSlugs(collection: CuratedCollection) {
  const fromArray = normalizeProductSlugs(collection.product_slugs)
  if (fromArray.length > 0) return fromArray
  return extractProductSlugsFromHref(collection.href)
}

function toProductsHref(productSlugs: string[]) {
  const slugs = normalizeProductSlugs(productSlugs)
  if (slugs.length === 0) return ""
  if (slugs.length === 1) return toProductHref(slugs[0])
  return `/collections/all?products=${slugs.map((slug) => encodeURIComponent(slug)).join(",")}`
}

function hasProductHref(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  if (!value) return false
  if (/^\/product\/[^/?#]+/i.test(value)) return true
  return extractProductSlugsFromHref(value).length > 0
}

function extractOfferSlug(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  const match = value.match(/^\/offers\/([^/?#]+)/i)
  return match?.[1] ? decodeURIComponent(match[1]) : ""
}

function toOfferHref(value: string) {
  const normalized = slugify(value)
  return normalized ? `/offers/${encodeURIComponent(normalized)}` : ""
}

function getOfferProductSlugs(offer: PromoOffer) {
  return normalizeProductSlugs(offer.product_slugs)
}

function getOfferBundleSizes(offer: PromoOffer) {
  const source = Array.isArray(offer.bundle_sizes) ? offer.bundle_sizes : []
  const normalized = source
    .map((item) => Number(item))
    .filter((item): item is OfferBundleSize => OFFER_BUNDLE_SIZES.includes(item as OfferBundleSize))
  if (normalized.length === 0) return [...OFFER_BUNDLE_SIZES]
  return OFFER_BUNDLE_SIZES.filter((size) => normalized.includes(size))
}

function getOfferBundleDiscount(offer: PromoOffer, size: OfferBundleSize) {
  const source = offer.bundle_discounts
  if (!source || typeof source !== "object") return undefined
  const candidate = source[String(size)]
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) return undefined
  return Math.min(100, Math.max(0, Math.round(candidate)))
}

export function CollectionsSettings({ collections, offers, onCollectionsChange, onOffersChange }: CollectionsSettingsProps) {
  const [activeModal, setActiveModal] = useState<'collections' | 'offers' | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [collectionProductPicker, setCollectionProductPicker] = useState<Record<number, string>>({})
  const [offerProductPicker, setOfferProductPicker] = useState<Record<number, string>>({})
  const [linkFieldsLocked, setLinkFieldsLocked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        const [cats, prods] = await Promise.all([getAdminCategories(), getAdminProducts()])
        setCategories(cats)
        setProducts(prods)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      }
    }
    fetchData()
  }, [])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  )
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  )
  const productNameBySlug = useMemo(
    () =>
      sortedProducts.reduce<Record<string, string>>((acc, product) => {
        const slug = slugify(product.slug)
        const ml = typeof product.ml === "string" ? product.ml.trim() : ""
        if (slug) {
          acc[slug] = ml ? `${product.name} (${ml} ML)` : product.name
        }
        return acc
      }, {}),
    [sortedProducts]
  )

  const updateCol = (idx: number, field: keyof CuratedCollection, value: string) => {
    const next = [...collections]
    next[idx] = { ...next[idx], [field]: value }
    onCollectionsChange(next)
  }

  const patchCol = (idx: number, patch: Partial<CuratedCollection>) => {
    const next = [...collections]
    next[idx] = { ...next[idx], ...patch }
    onCollectionsChange(next)
  }

  const addCollectionProduct = (idx: number) => {
    const selectedSlug = slugify(collectionProductPicker[idx] || "")
    if (!selectedSlug) return

    const existing = getCollectionProductSlugs(collections[idx])
    if (existing.includes(selectedSlug)) return

    const nextProductSlugs = [...existing, selectedSlug]
    patchCol(idx, {
      product_slugs: nextProductSlugs,
      href: toProductsHref(nextProductSlugs),
    })
    setCollectionProductPicker((prev) => ({ ...prev, [idx]: "" }))
  }

  const removeCollectionProduct = (idx: number, slug: string) => {
    const nextProductSlugs = getCollectionProductSlugs(collections[idx]).filter((item) => item !== slug)
    patchCol(idx, {
      product_slugs: nextProductSlugs,
      href: toProductsHref(nextProductSlugs),
    })
  }

  const isLinkLocked = (idx: number) => linkFieldsLocked[idx] ?? true

  const toggleLinkLock = (idx: number) => {
    setLinkFieldsLocked((prev) => ({
      ...prev,
      [idx]: !(prev[idx] ?? true),
    }))
  }

  const patchOffer = (idx: number, patch: Partial<PromoOffer>) => {
    const next = [...offers]
    next[idx] = { ...next[idx], ...patch }
    onOffersChange(next)
  }

  const updateOffer = <K extends keyof PromoOffer>(idx: number, field: K, value: PromoOffer[K]) => {
    const current = offers[idx]
    const patch: Partial<PromoOffer> = { [field]: value } as Partial<PromoOffer>
    if (field === "title") {
      const existingHref = current?.href?.trim() || ""
      const shouldAutoGenerateSlug = !existingHref || Boolean(extractOfferSlug(existingHref))
      if (shouldAutoGenerateSlug) {
        patch.href = toOfferHref(String(value))
      }
    }
    patchOffer(idx, patch)
  }

  const addOfferProduct = (idx: number) => {
    const selectedSlug = slugify(offerProductPicker[idx] || "")
    if (!selectedSlug) return

    const existing = getOfferProductSlugs(offers[idx])
    if (existing.includes(selectedSlug)) return

    patchOffer(idx, { product_slugs: [...existing, selectedSlug] })
    setOfferProductPicker((prev) => ({ ...prev, [idx]: "" }))
  }

  const removeOfferProduct = (idx: number, slug: string) => {
    patchOffer(idx, {
      product_slugs: getOfferProductSlugs(offers[idx]).filter((item) => item !== slug),
    })
  }

  const toggleOfferActive = (idx: number) => {
    const current = offers[idx]
    patchOffer(idx, { is_active: !(current?.is_active ?? true) })
  }

  const toggleOfferBundleSize = (idx: number, size: OfferBundleSize) => {
    const currentSizes = getOfferBundleSizes(offers[idx])
    const hasSize = currentSizes.includes(size)
    if (hasSize && currentSizes.length === 1) return

    const nextSizes = hasSize
      ? currentSizes.filter((item) => item !== size)
      : [...currentSizes, size].sort((a, b) => a - b)
    patchOffer(idx, { bundle_sizes: nextSizes })
  }

  const updateOfferBundleDiscount = (idx: number, size: OfferBundleSize, rawValue: string) => {
    const current = offers[idx]
    const nextDiscounts: Record<string, number> = {
      ...(current.bundle_discounts || {}),
    }
    const trimmed = rawValue.trim()
    if (!trimmed) {
      delete nextDiscounts[String(size)]
      patchOffer(idx, { bundle_discounts: nextDiscounts })
      return
    }

    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) return
    nextDiscounts[String(size)] = Math.min(100, Math.max(0, Math.round(parsed)))
    patchOffer(idx, { bundle_discounts: nextDiscounts })
  }

  const addOffer = () => {
    const title = "New Offer"
    onOffersChange([
      ...offers,
      {
        title,
        description: "Special promotion details here...",
        action: "Shop Now",
        href: toOfferHref(title),
        badge: "",
        bgColor: "bg-[#F3F0EA]",
        product_slugs: [],
        is_active: true,
        bundle_sizes: [...OFFER_BUNDLE_SIZES],
        bundle_discounts: {},
      },
    ])
  }

  const removeOffer = (idx: number) => {
    onOffersChange(offers.filter((_, i) => i !== idx))
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-neutral-900">Curated Selections Preview</h2>
            <p className="mt-1 text-sm text-neutral-500">Main collection banners on your home page.</p>
          </div>
          <Button onClick={() => setActiveModal('collections')} variant="outline" className="rounded-full">
            Edit Collections
          </Button>
        </div>

        <CollectionsPreview
          collections={collections}
          productNameBySlug={productNameBySlug}
          onEditClick={() => setActiveModal('collections')}
        />
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-neutral-900">Promo Offers Preview</h2>
            <p className="mt-1 text-sm text-neutral-500">Promotional cards with quick links.</p>
          </div>
          <Button onClick={() => setActiveModal('offers')} variant="outline" className="rounded-full">
            Manage Offers
          </Button>
        </div>

        <OffersPreview offers={offers} onEditClick={() => setActiveModal('offers')} />
      </section>

      {/* Collections Modal */}
      <Dialog open={activeModal === 'collections'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Edit Curated Selections</DialogTitle>
            <DialogDescription>Change the titles, images, and links for your three main collection cards.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 mt-6 md:grid-cols-3">
            {collections.map((col, idx) => (
              <div key={idx} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex items-center gap-2">
                   <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold">{idx + 1}</span>
                   <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Card {idx + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleLinkLock(idx)}
                  className={`w-full rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    isLinkLocked(idx)
                      ? "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400"
                      : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                  }`}
                >
                  {isLinkLocked(idx) ? "Unlock Link Fields" : "Lock Link Fields"}
                </button>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Card Image</label>
                  <SingleImageUpload 
                    value={col.image} 
                    onUpload={(url) => updateCol(idx, 'image', url)} 
                    onRemove={() => updateCol(idx, 'image', "")}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Cover Image (Collection Hero)</label>
                  <SingleImageUpload
                    value={col.cover_image || ""}
                    onUpload={(url) => updateCol(idx, 'cover_image', url)}
                    onRemove={() => updateCol(idx, 'cover_image', "")}
                  />
                </div>

                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Subtitle</label>
                      <input
                        className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs"
                        value={col.subtitle}
                        onChange={(e) => {
                          const locked = isLinkLocked(idx)
                          const nextSubtitle = e.target.value
                          const productSelection = getCollectionProductSlugs(col)
                          const canAutoGenerate =
                            !locked &&
                            productSelection.length === 0 &&
                            !hasProductHref(col.href) &&
                            (!col.href || Boolean(extractCollectionSlug(col.href)))

                          patchCol(idx, {
                            subtitle: nextSubtitle,
                            ...(canAutoGenerate ? { href: toCollectionHref(nextSubtitle) } : {}),
                          })
                        }}
                      />
                      <div className="flex items-center justify-between gap-2 px-1">
                        <p className="text-[10px] text-neutral-500">
                          Slug preview:{" "}
                          <span className="font-mono">
                            {toCollectionHref(col.subtitle) || "/collections/your-slug"}
                          </span>
                        </p>
                        <button
                          type="button"
                          disabled={isLinkLocked(idx)}
                          onClick={() =>
                            patchCol(idx, {
                              href: toCollectionHref(col.subtitle),
                              product_slugs: [],
                            })
                          }
                          className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-700 hover:border-black hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Generate Slug
                        </button>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Title (HTML)</label>
                      <input className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs font-bold" value={col.title} onChange={(e) => updateCol(idx, 'title', e.target.value)} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-1"><Link2 className="h-2 w-2"/> Pick Category</label>
                      <select 
                        className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                        value={extractCollectionSlug(col.href)}
                        disabled={isLinkLocked(idx)}
                        onChange={(e) =>
                          patchCol(idx, {
                            href: toCollectionHref(e.target.value),
                            product_slugs: [],
                          })
                        }
                      >
                        <option value="">Select a category...</option>
                        {sortedCategories.map((cat) => (
                          <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                   </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-1"><Link2 className="h-2 w-2"/> Pick Related Product</label>
                      {(() => {
                        const selectedProductSlugs = new Set(getCollectionProductSlugs(col))
                        const pickerSlug = slugify(collectionProductPicker[idx] || "")
                        const isDuplicateSelection = pickerSlug ? selectedProductSlugs.has(pickerSlug) : false

                        return (
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <select
                          className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer"
                          value={collectionProductPicker[idx] || ""}
                          onChange={(e) =>
                            setCollectionProductPicker((prev) => ({ ...prev, [idx]: e.target.value }))
                          }
                        >
                          <option value="">Select product...</option>
                          {sortedProducts.map((prod) => (
                            <option
                              key={prod.id}
                              value={prod.slug}
                              disabled={selectedProductSlugs.has(slugify(prod.slug))}
                            >
                              {prod.name} {prod.ml ? `(${prod.ml} ML)` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => addCollectionProduct(idx)}
                          disabled={!collectionProductPicker[idx] || isDuplicateSelection}
                          className="rounded-xl border border-neutral-300 bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-700 hover:border-black hover:text-black disabled:opacity-40"
                        >
                          Add
                        </button>
                      </div>
                        )
                      })()}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {getCollectionProductSlugs(col).map((slug) => (
                          <span
                            key={`${idx}-${slug}`}
                            className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-medium text-neutral-700"
                          >
                            {productNameBySlug[slug] || slug}
                            <button
                              type="button"
                              className="text-neutral-500 hover:text-red-500"
                              onClick={() => removeCollectionProduct(idx, slug)}
                              aria-label="Remove selected product"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {getCollectionProductSlugs(col).length === 0 && (
                          <p className="text-[10px] text-neutral-500">No products selected.</p>
                        )}
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Create New Collection Slug</label>
                      <input
                        className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                        value={extractCollectionSlug(col.href)}
                        disabled={isLinkLocked(idx)}
                        onChange={(e) =>
                          patchCol(idx, {
                            href: toCollectionHref(e.target.value),
                            product_slugs: [],
                          })
                        }
                        placeholder="new-collection-slug"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Deep Link / Slug</label>
                      <input
                        className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                        value={col.href}
                        disabled={isLinkLocked(idx)}
                        onChange={(e) =>
                          patchCol(idx, {
                            href: e.target.value,
                            product_slugs: extractProductSlugsFromHref(e.target.value),
                          })
                        }
                      />
                   </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <Button onClick={() => setActiveModal(null)} variant="secondary" className="px-8 rounded-full">
              Finish Layout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PROMO OFFERS MODAL (ENHANCED) */}
      <Dialog open={activeModal === 'offers'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between w-full pr-12">
              <div>
                <DialogTitle className="text-3xl font-serif">Promo Offers Studio</DialogTitle>
                <DialogDescription>Create and manage your promotional cards with standard slugs.</DialogDescription>
              </div>
              <Button onClick={addOffer} className="rounded-full gap-2">
                <Plus className="h-4 w-4" /> Add New Offer
              </Button>
            </div>
          </DialogHeader>

	          <div className="grid gap-6 mt-2 md:grid-cols-2 lg:grid-cols-3">
	            {offers.map((offer, idx) => (
	              <div key={idx} className="group relative p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-5">
                 {/* Delete Button */}
                 <button 
                   onClick={() => removeOffer(idx)}
                   className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                 >
                   <Trash2 className="h-4 w-4" />
                 </button>

	                 <div className="flex items-center justify-between border-b pb-3">
	                   <div className="flex items-center gap-2">
	                     <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
	                     <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">Card Configuration</span>
	                   </div>
                    <button
                      type="button"
                      onClick={() => toggleOfferActive(idx)}
                      className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                        offer.is_active === false
                          ? "border-neutral-300 bg-neutral-100 text-neutral-500"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {offer.is_active === false ? "Inactive" : "Active"}
                    </button>
	                 </div>
	                
	                <div className="space-y-4">
	                   <div className="space-y-1.5">
	                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Offer Title</label>
	                      <input className="w-full border border-neutral-200 bg-neutral-50 rounded-xl p-3 text-sm font-serif italic" value={offer.title} onChange={(e) => updateOffer(idx, 'title', e.target.value)} />
                        <div className="flex items-center justify-between gap-2 px-1">
                          <p className="text-[10px] text-neutral-500">
                            Slug preview:{" "}
                            <span className="font-mono">{toOfferHref(offer.title) || "/offers/your-offer-slug"}</span>
                          </p>
                          <button
                            type="button"
                            className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-700 hover:border-black hover:text-black"
                            onClick={() => patchOffer(idx, { href: toOfferHref(offer.title) })}
                          >
                            Use Title Slug
                          </button>
                        </div>
	                   </div>
	                   
	                   <div className="grid grid-cols-2 gap-3">
	                      <div className="space-y-1.5">
	                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Badge (Text)</label>
	                        <input placeholder="e.g. New" className="w-full border border-neutral-200 bg-white rounded-xl p-2.5 text-xs text-center font-bold" value={offer.badge || ""} onChange={(e) => updateOffer(idx, 'badge', e.target.value)} />
	                      </div>
	                      <div className="space-y-1.5">
	                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Action Text</label>
	                        <input placeholder="Shop Now" className="w-full border border-neutral-200 bg-white rounded-xl p-2.5 text-xs text-center" value={offer.action || ""} onChange={(e) => updateOffer(idx, 'action', e.target.value)} />
	                      </div>
	                   </div>

                    <div className="space-y-1">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">Offer Slug</label>
                        <input
                          className="w-full border border-neutral-200 bg-white rounded-xl px-3 py-2 text-[10px] font-mono"
                          value={extractOfferSlug(offer.href)}
                          onChange={(e) => patchOffer(idx, { href: toOfferHref(e.target.value) })}
                          placeholder="signature-sets"
                        />
                      </div>
                    </div>

	                   <div className="space-y-1.5">
	                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Description</label>
	                      <textarea className="w-full border border-neutral-200 bg-neutral-50 rounded-xl p-3 text-xs h-20 resize-none font-light" value={offer.description} onChange={(e) => updateOffer(idx, 'description', e.target.value)} />
	                   </div>

	                   <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-1.5"><Palette className="h-3 w-3"/> Card Theme</label>
                        <div className="flex flex-wrap gap-2 px-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color.name}
                              className={`w-8 h-8 rounded-full border-2 ${color.class} ${offer.bgColor === color.class ? 'border-black scale-110' : 'border-transparent'} transition-all`}
                              onClick={() => updateOffer(idx, 'bgColor', color.class)}
                              title={color.name}
                            />
                          ))}
	                        </div>
	                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Bundle Size Options</label>
                        <div className="flex flex-wrap gap-2 px-1">
                          {OFFER_BUNDLE_SIZES.map((size) => {
                            const selected = getOfferBundleSizes(offer).includes(size)
                            return (
                              <button
                                key={`${idx}-bundle-size-${size}`}
                                type="button"
                                onClick={() => toggleOfferBundleSize(idx, size)}
                                className={`rounded-lg border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                                  selected
                                    ? "border-black bg-black text-white"
                                    : "border-neutral-300 bg-white text-neutral-700 hover:border-black"
                                }`}
                              >
                                {size} Items
                              </button>
                            )
                          })}
                        </div>
                        <p className="px-1 text-[10px] text-neutral-500">At least one size must stay selected.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Discount Per Bundle Size %</label>
                        <div className="grid grid-cols-2 gap-2">
                          {OFFER_BUNDLE_SIZES.map((size) => {
                            const selected = getOfferBundleSizes(offer).includes(size)
                            return (
                              <div key={`${idx}-bundle-discount-${size}`} className="space-y-1">
                                <label className="px-1 text-[9px] font-bold uppercase tracking-[0.1em] text-neutral-400">{size} Items</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  disabled={!selected}
                                  className="w-full border border-neutral-200 bg-white rounded-xl px-3 py-2 text-[10px] text-center font-semibold disabled:bg-neutral-100 disabled:text-neutral-400"
                                  value={selected ? (getOfferBundleDiscount(offer, size) ?? "") : ""}
                                  onChange={(e) => updateOfferBundleDiscount(idx, size, e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1 flex items-center gap-1">
                          <Link2 className="h-2 w-2" /> Bundle Products
                        </label>
                        {(() => {
                          const selectedProductSlugs = new Set(getOfferProductSlugs(offer))
                          const pickerSlug = slugify(offerProductPicker[idx] || "")
                          const isDuplicateSelection = pickerSlug ? selectedProductSlugs.has(pickerSlug) : false

                          return (
                            <>
                              <div className="grid grid-cols-[1fr_auto] gap-2">
                                <select
                                  className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer"
                                  value={offerProductPicker[idx] || ""}
                                  onChange={(e) =>
                                    setOfferProductPicker((prev) => ({ ...prev, [idx]: e.target.value }))
                                  }
                                >
                                  <option value="">Select product...</option>
                                  {sortedProducts.map((prod) => (
                                    <option
                                      key={prod.id}
                                      value={prod.slug}
                                      disabled={selectedProductSlugs.has(slugify(prod.slug))}
                                    >
                                      {prod.name} {prod.ml ? `(${prod.ml} ML)` : ""}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => addOfferProduct(idx)}
                                  disabled={!offerProductPicker[idx] || isDuplicateSelection}
                                  className="rounded-xl border border-neutral-300 bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-700 hover:border-black hover:text-black disabled:opacity-40"
                                >
                                  Add
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {getOfferProductSlugs(offer).map((slug) => (
                                  <span
                                    key={`${idx}-${slug}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-medium text-neutral-700"
                                  >
                                    {productNameBySlug[slug] || slug}
                                    <button
                                      type="button"
                                      className="text-neutral-500 hover:text-red-500"
                                      onClick={() => removeOfferProduct(idx, slug)}
                                      aria-label="Remove bundle product"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                {getOfferProductSlugs(offer).length === 0 && (
                                  <p className="text-[10px] text-neutral-500">No products selected.</p>
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </div>

	                      <div className="space-y-1">
	                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">Manual Deep Link</label>
	                        <input className="w-full border border-neutral-200 bg-white rounded-xl px-3 py-2 text-[10px] font-mono" value={offer.href} onChange={(e) => updateOffer(idx, 'href', e.target.value)} />
	                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-y mt-8 bg-white/50 backdrop-blur-md sticky bottom-0 -mx-6 px-6 pb-6 rounded-b-[2rem] z-20">
            <Button onClick={() => setActiveModal(null)} variant="secondary" className="px-12 py-6 rounded-full font-black tracking-[0.2em] text-xs">
              SAVE ALL OFFERS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
