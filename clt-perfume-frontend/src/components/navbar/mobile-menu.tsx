"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, ChevronRight, Zap, User } from "lucide-react"
import { getCategories, getSiteSettings, NavMenuCategory, ProductCategory } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

import Image from "next/image"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

interface MobileNavData {
  [key: string]: { categories?: unknown } | undefined
}

interface MenuCategoryLink {
  name: string
  slug: string
  href: string
  depth: number
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

function buildStandardCategories(parentSlug: string, categories: ProductCategory[]): MenuCategoryLink[] {
  const parent = categories.find((category) => category.slug === parentSlug)
  if (!parent) return []

  const childrenByParent = new Map<string, ProductCategory[]>()
  for (const category of categories) {
    if (!category.parent_id) continue
    if (!childrenByParent.has(category.parent_id)) childrenByParent.set(category.parent_id, [])
    childrenByParent.get(category.parent_id)?.push(category)
  }
  for (const items of childrenByParent.values()) {
    items.sort((a, b) => a.name.localeCompare(b.name))
  }

  const topChildren = childrenByParent.get(parent.id) || []
  if (topChildren.length > 0) {
    const links: MenuCategoryLink[] = []
    const visited = new Set<string>()

    const walk = (node: ProductCategory, depth: number) => {
      if (visited.has(node.id)) return
      visited.add(node.id)

      links.push({
        name: node.name,
        slug: node.slug,
        href: `/collections/${parent.slug}?sub=${encodeURIComponent(node.slug)}`,
        depth,
      })

      const children = childrenByParent.get(node.id) || []
      for (const child of children) {
        walk(child, depth + 1)
      }
    }

    for (const child of topChildren) {
      walk(child, 0)
    }

    return withSmartCollectionLinks(parent.slug, links)
  }

  return withSmartCollectionLinks(parent.slug, [
    { name: parent.name, slug: parent.slug, href: `/collections/${parent.slug}`, depth: 0 },
  ])
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, isLoading } = useAuth()
  const [activeMenu, setActiveMenu] = useState("main")
  const [navData, setNavData] = useState<MobileNavData | null>(null)
  const [catalogCategories, setCatalogCategories] = useState<ProductCategory[]>([])
  const topCategories = catalogCategories
    .filter((category) => !category.parent_id)
    .sort((a, b) => a.name.localeCompare(b.name))

  useEffect(() => {
    async function load() {
      const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()])
      setCatalogCategories(categories)
      if (settings?.navigation) {
        setNavData(settings.navigation as MobileNavData)
      }
    }
    load()
  }, [])

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[100] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <div 
        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-white z-[101] lg:hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 min-h-[85px]">
          {activeMenu === 'main' ? (
            <Link href="/" onClick={onClose} className="flex-shrink-0 flex items-center">
              <div className="flex flex-col items-center">
                 <Image src="/perfume-sam.png" alt="CLE DXB Perfumes" width={140} height={50} className="object-contain w-auto h-11" priority />
                 <span className="text-[10px] tracking-[0.3em] uppercase mt-1">Perfumes</span>
              </div>
            </Link>
          ) : (
            <button 
              onClick={() => setActiveMenu('main')}
              className="flex items-center gap-2 text-sm text-neutral-500 font-medium"
            >
               <ChevronRight className="w-4 h-4 rotate-180" /> Back
            </button>
          )}
          
          <button onClick={onClose} className="p-2 -mr-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          {/* Main Menu */}
          <div className={`w-full flex flex-col p-6 ${activeMenu === 'main' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}`}>
            <div className="flex flex-col gap-6">
              {topCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveMenu(`category:${category.slug}`)}
                  className="flex items-center justify-between py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4"
                >
                  {category.name}
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </button>
              ))}
              {topCategories.length === 0 && (
                <p className="text-sm text-neutral-500">Create top-level categories in admin to show menu items.</p>
              )}
              
              <Link onClick={onClose} href="/offers" className="py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4 text-amber-600 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" /> Exclusive Offers
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-100 space-y-6 pb-24">
              <Link
                onClick={onClose}
                href={user ? "/profile" : "/login"}
                className={`flex items-center gap-3 text-sm uppercase tracking-wider text-neutral-700 font-bold ${isLoading ? "pointer-events-none opacity-60" : ""}`}
              >
                <User className="w-5 h-5" /> {user ? "Account Center" : "Log In"}
              </Link>
            </div>
          </div>

          {/* Submenus */}
          {topCategories.map((topCategory) => {
            const standardCategories = buildStandardCategories(topCategory.slug, catalogCategories)
            const fallbackCategories = normalizeCategories(navData?.[topCategory.slug]?.categories).map((category) => ({
              name: category.name,
              slug: category.slug,
              href:
                category.slug === topCategory.slug
                  ? `/collections/${topCategory.slug}`
                  : `/collections/${topCategory.slug}?sub=${encodeURIComponent(category.slug)}`,
              depth: 0,
            }))
            const menuCategories = standardCategories.length
              ? standardCategories
              : withSmartCollectionLinks(topCategory.slug, fallbackCategories)

            return (
              <div
                key={topCategory.id}
                className={`w-full flex flex-col p-6 ${activeMenu === `category:${topCategory.slug}` ? 'block animate-in fade-in slide-in-from-right-4 duration-100' : 'hidden'}`}
              >
                  <h3 className="font-serif text-xl tracking-widest uppercase mb-8 pb-4 border-b border-neutral-100">
                    {topCategory.name}
                  </h3>
                  <div className="space-y-5">
                    {menuCategories.map((category) => {
                      return (
                        <div
                          key={`${topCategory.slug}-${category.slug}-${category.name}`}
                          className="space-y-1"
                          style={{ marginLeft: `${Math.min(category.depth, 3) * 14}px` }}
                        >
                          <Link onClick={onClose} href={category.href} className="block text-sm text-neutral-600 uppercase tracking-wider py-1 hover:text-black">
                            {category.name}
                          </Link>
                        </div>
                      )
                    })}
                    {(!menuCategories.length) && <p className="text-neutral-400 text-xs italic">Create Product Categories to show here.</p>}
                  </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function withSmartCollectionLinks(parentSlug: string, links: MenuCategoryLink[]) {
  const smartLinks: MenuCategoryLink[] = [
    {
      name: "Best Seller",
      slug: "best-seller",
      href: `/collections/${parentSlug}?sub=best-seller`,
      depth: 0,
    },
    {
      name: "New Arrivals",
      slug: "new-arrivals",
      href: `/collections/${parentSlug}?sub=new-arrivals`,
      depth: 0,
    },
  ]

  const existing = new Set(links.map((link) => link.slug))
  const merged = [...links]
  for (const smartLink of smartLinks) {
    if (!existing.has(smartLink.slug)) {
      merged.push(smartLink)
    }
  }
  return merged
}
