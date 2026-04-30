"use client"

import { useMemo, useState } from "react"
import { AdminProduct, Category, NavCategory, NavSection } from "@/lib/admin-api"
import { Plus } from "lucide-react"

// Specialized Components
import { NoteEditor } from "./nav/note-editor"
import { BannerEditor } from "./nav/banner-editor"
import { CategoryEditor } from "./nav/category-editor"
import { NavSectionEditor } from "./nav/nav-section-editor"

interface NavSettingsProps {
  navigation: Record<string, NavSection>
  onUpdate: (
    sectionKey: string,
    field: keyof NavSection,
    value: NavSection[keyof NavSection]
  ) => void
  catalogCategories?: Category[]
  catalogProducts?: AdminProduct[]
  showCategoryControls?: boolean
  sections?: string[]
  compact?: boolean
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function getProductCategoryName(product: AdminProduct) {
  const category = Array.isArray(product.category) ? product.category[0] : product.category
  if (category?.name && typeof category.name === "string" && category.name.trim()) {
    return category.name.trim()
  }
  return "Uncategorized"
}

function getProductSlugFromHref(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  if (!value) return ""
  const match = value.match(/^\/product\/([^/?#]+)/i)
  return match?.[1] ? decodeURIComponent(match[1]) : ""
}

function toMultiProductHref(slugs: string[]) {
  const tokens = slugs
    .map((slug) => slug.trim())
    .filter(Boolean)
    .map((slug) => encodeURIComponent(slug))

  if (tokens.length === 0) return ""
  if (tokens.length === 1) return `/product/${tokens[0]}`
  return `/collections/all?products=${tokens.join(",")}`
}

function normalizeProductSlugs(input: unknown) {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const values: string[] = []

  for (const token of input) {
    if (typeof token !== "string") continue
    const value = token.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }

  return values
}

function getProductSelection(item: { href?: string; product_slugs?: string[] }) {
  const fromArray = normalizeProductSlugs(item.product_slugs)
  if (fromArray.length > 0) return fromArray

  const fromHref = getProductSlugFromHref(item.href)
  return fromHref ? [fromHref] : []
}

export function NavSettings({
  navigation,
  onUpdate,
  catalogCategories = [],
  catalogProducts = [],
  showCategoryControls = true,
  sections,
  compact = false,
}: NavSettingsProps) {
  const sectionKeys = (sections && sections.length ? sections : Object.keys(navigation)).filter(Boolean)
  const [catalogPicker, setCatalogPicker] = useState<Record<string, string>>({})
  
  const productOptions = useMemo(() => {
    const seenSlugs = new Set<string>()
    return catalogProducts
      .map((product) => {
        const slug = typeof product.slug === "string" ? product.slug.trim() : ""
        if (!slug || seenSlugs.has(slug)) return null
        seenSlugs.add(slug)
        const ml = typeof product.ml === "string" ? product.ml.trim() : ""
        const name =
          typeof product.name === "string" && product.name.trim()
            ? product.name.trim()
            : slug
        
        const displayName = ml ? `${name} (${ml} ML)` : name

        return {
          slug,
          name: displayName,
          categoryName: getProductCategoryName(product),
        }
      })
      .filter((product): product is { slug: string; name: string; categoryName: string } => Boolean(product))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [catalogProducts])

  const emptySection: NavSection = { categories: [], notes: [], banners: [] }
  const getSection = (sectionKey: string) => navigation[sectionKey] || emptySection

  // State Updaters
  const setCategories = (sectionKey: string, categories: NavCategory[]) => {
    onUpdate(sectionKey, "categories", categories)
  }
  const setNotes = (sectionKey: string, notes: NavSection["notes"]) => {
    onUpdate(sectionKey, "notes", notes)
  }
  const setBanners = (sectionKey: string, banners: NavSection["banners"]) => {
    onUpdate(sectionKey, "banners", banners)
  }

  const addCustomCategory = (sectionKey: string) => {
    setCategories(sectionKey, [
      ...getSection(sectionKey).categories,
      { name: "New Category", slug: "new-category", subcategories: [] },
    ])
  }

  const addCatalogCategory = (sectionKey: string) => {
    const selectedId = catalogPicker[sectionKey]
    const selectedCategory = catalogCategories.find((category) => category.id === selectedId)
    if (!selectedCategory) return
    if (getSection(sectionKey).categories.some((category) => category.slug === selectedCategory.slug)) return

    setCategories(sectionKey, [
      ...getSection(sectionKey).categories,
      { name: selectedCategory.name, slug: selectedCategory.slug, subcategories: [] },
    ])
  }

  return (
    <section className={`rounded-2xl border border-neutral-200 bg-white shadow-sm ${compact ? "p-4 sm:p-5" : "p-5 sm:p-7"}`}>
      <h2 className={`${compact ? "text-lg font-semibold" : "text-2xl font-serif"} text-neutral-900`}>
        Mega Menu Navigation
      </h2>
      <p className={`mt-1 ${compact ? "text-xs" : "text-sm"} text-neutral-500`}>
        {showCategoryControls
          ? "Categories now follow Product Categories hierarchy. Use this panel for fallback links, notes, and right-side banners."
          : "Manage Shop By Notes and Right Banners for mega menu. Shop By Category is controlled from Product Categories."}
      </p>

      <div className={`mt-6 grid gap-6 ${compact ? "" : "lg:grid-cols-2"}`}>
        {sectionKeys.map((sectionKey) => {
          const section = getSection(sectionKey)
          return (
            <div key={sectionKey} className={`rounded-3xl border border-neutral-200 bg-neutral-50 ${compact ? "p-4" : "p-6 sm:p-8"}`}>
              <h3 className={`border-b border-neutral-200 pb-4 ${compact ? "text-sm" : "text-xl"} font-serif italic text-neutral-900 mb-6`}>
                {sectionKey.replace(/-/g, " ")} Menu
              </h3>

              {showCategoryControls && (
                <NavSectionEditor
                  title="Shop By Category"
                  description="Main navigation links grouped by your product taxonomy."
                  onAdd={() => addCustomCategory(sectionKey)}
                  addLabel="Add Custom"
                >
                  {catalogCategories.length > 0 && (
                    <div className="mb-2 grid grid-cols-[1fr_auto] gap-2">
                      <select
                        className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs outline-none focus:border-black"
                        value={catalogPicker[sectionKey] || ""}
                        onChange={(e) => setCatalogPicker(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                      >
                        <option value="">Add from Product Categories...</option>
                        {catalogCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="h-9 rounded-lg border border-neutral-300 bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-black hover:text-white transition-all disabled:opacity-40"
                        disabled={!catalogPicker[sectionKey]}
                        onClick={() => addCatalogCategory(sectionKey)}
                      >
                        Add
                      </button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {section.categories.map((category, idx) => (
                      <CategoryEditor
                        key={`${sectionKey}-cat-${idx}`}
                        category={category}
                        slugify={slugify}
                        onUpdate={(patch) => {
                          const next = [...section.categories]
                          next[idx] = { ...next[idx], ...patch }
                          setCategories(sectionKey, next)
                        }}
                        onRemove={() => {
                          const next = section.categories.filter((_, i) => i !== idx)
                          setCategories(sectionKey, next)
                        }}
                      />
                    ))}
                  </div>
                </NavSectionEditor>
              )}

              <div className="mt-8 grid gap-8 lg:grid-cols-2 items-start border-t border-neutral-200 pt-8">
                <NavSectionEditor
                  title="Shop By Notes"
                  description="Configure notes with images and multi-product landing pages."
                  onAdd={() => setNotes(sectionKey, [...section.notes, { name: "New Note", image: "", href: "", product_slugs: [] }])}
                  addLabel="Add Note"
                >
                  {section.notes.map((note, idx) => (
                    <NoteEditor
                      key={`${sectionKey}-note-${idx}`}
                      note={note}
                      productOptions={productOptions}
                      getProductSelection={getProductSelection}
                      toMultiProductHref={toMultiProductHref}
                      onUpdate={(patch) => {
                        const next = [...section.notes]
                        next[idx] = { ...next[idx], ...patch }
                        setNotes(sectionKey, next)
                      }}
                      onRemove={() => {
                        const next = section.notes.filter((_, i) => i !== idx)
                        setNotes(sectionKey, next)
                      }}
                    />
                  ))}
                </NavSectionEditor>

                <NavSectionEditor
                  title="Right Banners"
                  description="Promotional banners that appear on the right side of the menu."
                  onAdd={() => setBanners(sectionKey, [...section.banners, { title: "New Banner", image: "", href: "", product_slugs: [] }])}
                  addLabel="Add Banner"
                >
                  {section.banners.map((banner, idx) => (
                    <BannerEditor
                      key={`${sectionKey}-banner-${idx}`}
                      banner={banner}
                      productOptions={productOptions}
                      getProductSelection={getProductSelection}
                      toMultiProductHref={toMultiProductHref}
                      onUpdate={(patch) => {
                        const next = [...section.banners]
                        next[idx] = { ...next[idx], ...patch }
                        setBanners(sectionKey, next)
                      }}
                      onRemove={() => {
                        const next = section.banners.filter((_, i) => i !== idx)
                        setBanners(sectionKey, next)
                      }}
                    />
                  ))}
                </NavSectionEditor>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
