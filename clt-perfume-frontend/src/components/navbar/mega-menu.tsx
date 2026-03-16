"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { getCategories, getSiteSettings, NavMenuCategory, ProductCategory } from "@/lib/api"

interface MegaMenuProps {
  categorySlug: string
}

interface MenuNote {
  name: string
  image: string
}

interface MenuBanner {
  title: string
  image: string
}

interface MegaMenuData {
  categories: unknown
  notes: MenuNote[]
  banners: MenuBanner[]
}

interface MenuCategoryLink {
  name: string
  slug: string
  href: string
}

interface NavigationMap {
  [key: string]: {
    categories?: unknown
    notes?: unknown
    banners?: unknown
  } | undefined
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function normalizeCategories(input: unknown): NavMenuCategory[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim()
        if (!name) return null
        return { name, slug: slugify(name), subcategories: [] }
      }
      if (!item || typeof item !== "object") return null

      const source = item as { name?: unknown; slug?: unknown; subcategories?: unknown }
      const name =
        typeof source.name === "string" && source.name.trim()
          ? source.name.trim()
          : typeof source.slug === "string"
            ? source.slug.replace(/-/g, " ").trim()
            : ""
      const slug =
        typeof source.slug === "string" && source.slug.trim()
          ? slugify(source.slug)
          : slugify(name)
      if (!name || !slug) return null

      const subcategories = Array.isArray(source.subcategories)
        ? source.subcategories
            .map((sub) => (typeof sub === "string" ? sub.trim() : ""))
            .filter(Boolean)
        : []

      return { name, slug, subcategories }
    })
    .filter((item): item is NavMenuCategory => Boolean(item))
}

function normalizeNotes(input: unknown): MenuNote[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const source = item as { name?: unknown; image?: unknown }
      if (typeof source.name !== "string" || typeof source.image !== "string") return null
      return { name: source.name, image: source.image }
    })
    .filter((item): item is MenuNote => Boolean(item))
}

function normalizeBanners(input: unknown): MenuBanner[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const source = item as { title?: unknown; image?: unknown }
      if (typeof source.title !== "string" || typeof source.image !== "string") return null
      return { title: source.title, image: source.image }
    })
    .filter((item): item is MenuBanner => Boolean(item))
}

function buildStandardCategories(categorySlug: string, categories: ProductCategory[]): MenuCategoryLink[] {
  const parent = categories.find((category) => category.slug === categorySlug)
  if (!parent) return []

  const children = categories.filter((category) => category.parent_id === parent.id)
  if (children.length > 0) {
    return children.map((child) => ({
      name: child.name,
      slug: child.slug,
      href: `/collections/${parent.slug}?sub=${encodeURIComponent(child.slug)}`,
    }))
  }

  return [{ name: parent.name, slug: parent.slug, href: `/collections/${parent.slug}` }]
}

function pickNavigationSection(navigation: NavigationMap, categorySlug: string) {
  if (navigation[categorySlug]) return navigation[categorySlug]

  if (categorySlug === "men" || categorySlug === "mens") {
    return navigation.mens || navigation.men
  }

  if (categorySlug === "women" || categorySlug === "womens") {
    return navigation.womens || navigation.women
  }

  return undefined
}

export function MegaMenu({ categorySlug }: MegaMenuProps) {
  const [data, setData] = useState<MegaMenuData | null>(null)
  const [catalogCategories, setCatalogCategories] = useState<ProductCategory[]>([])
  const defaultHref = `/collections/${categorySlug}`

  useEffect(() => {
    async function load() {
      const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()])
      setCatalogCategories(categories)
      const navigation = (settings?.navigation || {}) as NavigationMap
      const nav = pickNavigationSection(navigation, categorySlug)
      setData({
        categories: nav?.categories,
        notes: normalizeNotes(nav?.notes),
        banners: normalizeBanners(nav?.banners),
      })
    }
    load()
  }, [categorySlug])

  if (!data) return null
  const standardCategories = buildStandardCategories(categorySlug, catalogCategories)
  const fallbackCategories = normalizeCategories(data.categories).map((category) => ({
    name: category.name,
    slug: category.slug,
    href:
      category.slug === categorySlug
        ? `/collections/${categorySlug}`
        : `/collections/${categorySlug}?sub=${encodeURIComponent(category.slug)}`,
  }))
  const categories = standardCategories.length
    ? standardCategories
    : fallbackCategories.length
      ? fallbackCategories
      : [{ name: categorySlug.replace(/-/g, " "), slug: categorySlug, href: `/collections/${categorySlug}` }]

  return (
    <div className="absolute top-full left-0 right-0 bg-white text-black shadow-2xl border-t border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0 pb-10 pt-8 px-12">
      <div className="flex gap-12 w-full max-w-6xl mx-auto">
        {/* Category Column */}
        <div className="flex flex-col flex-1">
          <h3 className="text-black font-serif text-base tracking-wide uppercase mb-6 drop-shadow-sm">Shop By Category</h3>
          <div className="flex flex-col space-y-4">
            {categories.map((category) => {
              return (
                <div key={`${category.slug}-${category.name}`} className="space-y-1">
                  <Link
                    href={category.href}
                    className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize"
                  >
                    {category.name}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes Column */}
        <div className="flex flex-col flex-1">
          <h3 className="text-black font-serif text-base tracking-wide uppercase mb-6 drop-shadow-sm">Shop By Notes</h3>
          <div className="grid grid-cols-2 gap-6 w-full max-w-[220px]">
            {data.notes.map((note) => (
              <Link key={note.name} href={defaultHref} className="flex flex-col items-center gap-3 group/note">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-black/20 group-hover/note:scale-105 transition-transform">
                  {note.image ? (
                    <Image src={note.image} alt={note.name} width={80} height={80} className="object-cover w-full h-full" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-neutral-100 text-[10px] uppercase tracking-widest text-neutral-400">
                      No Image
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-neutral-600 capitalize">{note.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Banners Column */}
        <div className="flex flex-col gap-4 flex-[1.5]">
          {data.banners.map((banner) => (
            <Link key={banner.title} href={defaultHref} className="relative w-full h-[80px] rounded overflow-hidden group/banner block shadow-md">
              {banner.image ? (
                <Image src={banner.image} alt={banner.title} fill className="object-cover group-hover/banner:scale-105 transition-transform duration-700" />
              ) : (
                <div className="absolute inset-0 bg-neutral-200" />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover/banner:bg-black/10 transition-colors"></div>
              <div className="absolute inset-0 flex items-center p-6 text-2xl font-serif tracking-widest text-white drop-shadow-lg">
                {banner.title}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
