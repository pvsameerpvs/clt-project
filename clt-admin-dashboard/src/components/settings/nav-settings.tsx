"use client"

import { useMemo, useState } from "react"
import { AdminProduct, Category, NavCategory, NavSection } from "@/lib/admin-api"
import { SingleImageUpload } from "@/components/single-image-upload"
import { Plus, Trash2 } from "lucide-react"

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
        const name =
          typeof product.name === "string" && product.name.trim()
            ? product.name.trim()
            : slug
        return {
          slug,
          name,
          categoryName: getProductCategoryName(product),
        }
      })
      .filter((product): product is { slug: string; name: string; categoryName: string } => Boolean(product))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [catalogProducts])
  const emptySection: NavSection = { categories: [], notes: [], banners: [] }
  const getSection = (sectionKey: string) => navigation[sectionKey] || emptySection

  const setCategories = (sectionKey: string, categories: NavCategory[]) => {
    onUpdate(sectionKey, "categories", categories)
  }

  const setNotes = (sectionKey: string, notes: NavSection["notes"]) => {
    onUpdate(sectionKey, "notes", notes)
  }

  const setBanners = (sectionKey: string, banners: NavSection["banners"]) => {
    onUpdate(sectionKey, "banners", banners)
  }

  const updateCategory = (
    sectionKey: string,
    categoryIndex: number,
    patch: Partial<NavCategory>
  ) => {
    const next = [...getSection(sectionKey).categories]
    next[categoryIndex] = { ...next[categoryIndex], ...patch }
    setCategories(sectionKey, next)
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

    if (getSection(sectionKey).categories.some((category) => category.slug === selectedCategory.slug)) {
      return
    }

    setCategories(sectionKey, [
      ...getSection(sectionKey).categories,
      {
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        subcategories: [],
      },
    ])
  }

  return (
    <section className={`rounded-2xl border border-neutral-200 bg-white shadow-sm ${compact ? "p-4 sm:p-5" : "p-5 sm:p-7"}`}>
      <h2 className={`${compact ? "text-lg font-semibold" : "text-2xl font-serif"} text-neutral-900`}>
        Mega Menu Navigation
      </h2>
      <p className={`mt-1 ${compact ? "text-xs" : "text-sm"} text-neutral-500`}>
        {showCategoryControls
          ? "Categories now follow Product Categories hierarchy (parent/child). Use this panel for fallback links, notes, and right-side banners."
          : "Manage Shop By Notes and Right Banners for mega menu. Shop By Category is controlled from Product Categories."}
      </p>

      <div className={`mt-6 grid gap-6 ${compact ? "" : "lg:grid-cols-2"}`}>
        {sectionKeys.map((sectionKey) => {
          const section = getSection(sectionKey)
          return (
          <div key={sectionKey} className={`rounded-2xl border border-neutral-200 bg-neutral-50 ${compact ? "p-3 sm:p-4" : "p-4 sm:p-5"}`}>
            <h3 className={`border-b border-neutral-200 pb-3 ${compact ? "text-sm" : "text-lg"} font-semibold uppercase tracking-wide text-neutral-800`}>
              {sectionKey.replace(/-/g, " ")} Menu
            </h3>

            {showCategoryControls && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Shop By Category</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-700 hover:border-black hover:text-black"
                      onClick={() => addCustomCategory(sectionKey)}
                    >
                      <Plus className="h-3 w-3" />
                      Add Custom
                    </button>
                  </div>
                </div>

                {catalogCategories.length > 0 && (
                  <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
                    <select
                      className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs outline-none focus:border-black"
                      value={catalogPicker[sectionKey] || ""}
                      onChange={(event) =>
                        setCatalogPicker((prev) => ({ ...prev, [sectionKey]: event.target.value }))
                      }
                    >
                      <option value="">Add from Product Categories...</option>
                      {catalogCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.slug})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-700 hover:border-black hover:text-black disabled:opacity-40"
                      disabled={!catalogPicker[sectionKey]}
                      onClick={() => addCatalogCategory(sectionKey)}
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {section.categories.map((category, categoryIndex) => (
                    <div key={`${sectionKey}-category-${categoryIndex}`} className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input
                          className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs outline-none focus:border-black"
                          value={category.name}
                          onChange={(event) =>
                            updateCategory(sectionKey, categoryIndex, {
                              name: event.target.value,
                            })
                          }
                          placeholder="Category Name"
                        />
                        <input
                          className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs outline-none focus:border-black"
                          value={category.slug}
                          onChange={(event) =>
                            updateCategory(sectionKey, categoryIndex, {
                              slug: slugify(event.target.value),
                            })
                          }
                          placeholder="category-slug"
                        />
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50"
                          onClick={() => {
                            const next = section.categories.filter((_, idx) => idx !== categoryIndex)
                            setCategories(sectionKey, next)
                          }}
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
                              updateCategory(sectionKey, categoryIndex, {
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
                            <div key={`${sectionKey}-${categoryIndex}-subcategory-${subcategoryIndex}`} className="flex items-center gap-2">
                              <input
                                className="h-8 flex-1 rounded-md border border-neutral-300 bg-white px-2 text-[11px] outline-none focus:border-black"
                                value={subcategory}
                                onChange={(event) => {
                                  const nextSubcategories = [...category.subcategories]
                                  nextSubcategories[subcategoryIndex] = event.target.value
                                  updateCategory(sectionKey, categoryIndex, { subcategories: nextSubcategories })
                                }}
                                placeholder="Subcategory name"
                              />
                              <button
                                type="button"
                                className="grid h-8 w-8 place-items-center rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50"
                                onClick={() => {
                                  const nextSubcategories = category.subcategories.filter((_, idx) => idx !== subcategoryIndex)
                                  updateCategory(sectionKey, categoryIndex, { subcategories: nextSubcategories })
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
                      onClick={() =>
                        updateCategory(sectionKey, categoryIndex, {
                          slug: slugify(category.name),
                        })
                      }
                      >
                        Auto-generate slug
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Shop By Notes</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-700 hover:border-black hover:text-black"
                  onClick={() =>
                    setNotes(sectionKey, [
                      ...section.notes,
                      { name: "New Note", image: "", href: "", product_slugs: [] },
                    ])
                  }
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              <p className="mb-2 text-[10px] text-neutral-500">
                Optional link example: <span className="font-mono">/collections/men?sub=gift-sets</span> or{" "}
                <span className="font-mono">/product/noir-de-soir</span>
              </p>
              <p className="mb-2 text-[10px] text-neutral-500">
                Multi-select products and we will auto-link to a combined products page.
              </p>
              <p className="mb-2 text-[10px] text-neutral-500">
                Hold Ctrl/Cmd to choose multiple products.
              </p>
              <div className={`grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
                {section.notes.map((note, noteIndex) => (
                  <div key={`${sectionKey}-note-${noteIndex}`} className="rounded-lg border border-neutral-200 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        className="h-8 flex-1 rounded-md border border-neutral-200 px-2 text-[11px] font-semibold outline-none focus:border-black"
                        value={note.name}
                        onChange={(event) => {
                          const next = [...section.notes]
                          next[noteIndex] = { ...next[noteIndex], name: event.target.value }
                          setNotes(sectionKey, next)
                        }}
                      />
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => {
                          const next = section.notes.filter((_, idx) => idx !== noteIndex)
                          setNotes(sectionKey, next)
                        }}
                        aria-label="Remove note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <select
                      className="mb-2 min-h-24 w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-black disabled:bg-neutral-100"
                      multiple
                      value={getProductSelection(note)}
                      disabled={productOptions.length === 0}
                      onChange={(event) => {
                        const selectedSlugs = Array.from(event.target.selectedOptions)
                          .map((option) => option.value)
                          .filter(Boolean)
                        const next = [...section.notes]
                        next[noteIndex] = {
                          ...next[noteIndex],
                          product_slugs: selectedSlugs,
                          href: toMultiProductHref(selectedSlugs),
                        }
                        setNotes(sectionKey, next)
                      }}
                    >
                      {productOptions.map((product) => (
                        <option key={`note-product-${product.slug}`} value={product.slug}>
                          {product.name} ({product.categoryName})
                        </option>
                      ))}
                    </select>
                    <input
                      className="mb-2 h-8 w-full rounded-md border border-neutral-200 px-2 text-[11px] font-mono outline-none focus:border-black"
                      value={note.href || ""}
                      onChange={(event) => {
                        const next = [...section.notes]
                        next[noteIndex] = { ...next[noteIndex], href: event.target.value }
                        setNotes(sectionKey, next)
                      }}
                      placeholder="/collections/men?sub=best-seller"
                    />
                    <SingleImageUpload
                      value={note.image}
                      onUpload={(url) => {
                        const next = [...section.notes]
                        next[noteIndex] = { ...next[noteIndex], image: url }
                        setNotes(sectionKey, next)
                      }}
                      onRemove={() => {
                        const next = [...section.notes]
                        next[noteIndex] = { ...next[noteIndex], image: "" }
                        setNotes(sectionKey, next)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Right Banners</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-700 hover:border-black hover:text-black"
                  onClick={() =>
                    setBanners(sectionKey, [
                      ...section.banners,
                      { title: "New Banner", image: "", href: "", product_slugs: [] },
                    ])
                  }
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              <p className="mb-2 text-[10px] text-neutral-500">
                Banner link controls product landing. Use collection filters or direct product URL.
              </p>
              <p className="mb-2 text-[10px] text-neutral-500">
                Multi-select products and we will auto-link to a combined products page.
              </p>
              <p className="mb-2 text-[10px] text-neutral-500">
                Hold Ctrl/Cmd to choose multiple products.
              </p>
              <div className={compact ? "space-y-2" : "space-y-3"}>
                {section.banners.map((banner, bannerIndex) => (
                  <div key={`${sectionKey}-banner-${bannerIndex}`} className="rounded-lg border border-neutral-200 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        className="h-8 flex-1 rounded-md border border-neutral-200 px-2 text-[11px] font-semibold uppercase tracking-wide outline-none focus:border-black"
                        value={banner.title}
                        onChange={(event) => {
                          const next = [...section.banners]
                          next[bannerIndex] = { ...next[bannerIndex], title: event.target.value }
                          setBanners(sectionKey, next)
                        }}
                      />
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => {
                          const next = section.banners.filter((_, idx) => idx !== bannerIndex)
                          setBanners(sectionKey, next)
                        }}
                        aria-label="Remove banner"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <select
                      className="mb-2 min-h-24 w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-black disabled:bg-neutral-100"
                      multiple
                      value={getProductSelection(banner)}
                      disabled={productOptions.length === 0}
                      onChange={(event) => {
                        const selectedSlugs = Array.from(event.target.selectedOptions)
                          .map((option) => option.value)
                          .filter(Boolean)
                        const next = [...section.banners]
                        next[bannerIndex] = {
                          ...next[bannerIndex],
                          product_slugs: selectedSlugs,
                          href: toMultiProductHref(selectedSlugs),
                        }
                        setBanners(sectionKey, next)
                      }}
                    >
                      {productOptions.map((product) => (
                        <option key={`banner-product-${product.slug}`} value={product.slug}>
                          {product.name} ({product.categoryName})
                        </option>
                      ))}
                    </select>
                    <input
                      className="mb-2 h-8 w-full rounded-md border border-neutral-200 px-2 text-[11px] font-mono outline-none focus:border-black"
                      value={banner.href || ""}
                      onChange={(event) => {
                        const next = [...section.banners]
                        next[bannerIndex] = { ...next[bannerIndex], href: event.target.value }
                        setBanners(sectionKey, next)
                      }}
                      placeholder="/collections/men?sub=new-arrivals"
                    />
                    <SingleImageUpload
                      value={banner.image}
                      onUpload={(url) => {
                        const next = [...section.banners]
                        next[bannerIndex] = { ...next[bannerIndex], image: url }
                        setBanners(sectionKey, next)
                      }}
                      onRemove={() => {
                        const next = [...section.banners]
                        next[bannerIndex] = { ...next[bannerIndex], image: "" }
                        setBanners(sectionKey, next)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )})}
      </div>
    </section>
  )
}
