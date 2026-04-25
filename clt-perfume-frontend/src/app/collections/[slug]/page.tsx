import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { getCategories, getCategoryBySlug, getProducts, getSiteSettings } from "@/lib/api"
import { Product, getCategorySlug } from "@/lib/products"

interface CuratedCollectionItem {
  href: string
  image: string
  cover_image?: string
  subtitle: string
  title: string
  action: string
  product_slugs?: string[]
}

function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function parseSelectedProductSlugs(value?: string) {
  if (!value) return new Set<string>()
  const slugs = value
    .split(",")
    .map((token) => decodeURIComponent(token.trim()))
    .map((token) => normalizeToken(token))
    .filter(Boolean)
  return new Set(slugs)
}

function normalizeProductSlugs(input: unknown) {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const values: string[] = []
  for (const token of input) {
    if (typeof token !== "string") continue
    const value = normalizeToken(token)
    if (!value || seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }
  return values
}

function extractCollectionSlugFromHref(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  const match = value.match(/^\/collections\/([^/?#]+)/i)
  return match?.[1] ? normalizeToken(decodeURIComponent(match[1])) : ""
}

function isBestSeller(product: Product) {
  return Boolean(product.is_best_seller ?? product.isBestSeller)
}

function isNewArrival(product: Product) {
  return Boolean(product.is_new ?? product.isNew)
}

function buildRelatedProducts(allProducts: Product[], visibleProducts: Product[]) {
  const selectedVisibleSlugs = new Set(visibleProducts.map((product) => normalizeToken(product.slug)))
  const selectedCategorySlugs = new Set(
    visibleProducts
      .map((product) => normalizeToken(getCategorySlug(product.category) || ""))
      .filter(Boolean)
  )
  const relatedCandidates = allProducts.filter((product) => {
    const slugToken = normalizeToken(product.slug)
    if (selectedVisibleSlugs.has(slugToken)) return false
    if (selectedCategorySlugs.size === 0) return true
    const categoryToken = normalizeToken(getCategorySlug(product.category) || "")
    return categoryToken ? selectedCategorySlugs.has(categoryToken) : false
  })

  const primaryMode: "best-seller" | "new-arrival" =
    new Date().getUTCDate() % 2 === 0 ? "best-seller" : "new-arrival"
  const primaryRelated =
    primaryMode === "best-seller"
      ? relatedCandidates.filter(isBestSeller)
      : relatedCandidates.filter(isNewArrival)
  const secondaryRelated =
    primaryMode === "best-seller"
      ? relatedCandidates.filter(isNewArrival)
      : relatedCandidates.filter(isBestSeller)
  const relatedProducts = (
    primaryRelated.length
      ? primaryRelated
      : secondaryRelated.length
        ? secondaryRelated
        : relatedCandidates
  ).slice(0, 4)

  const relatedTitle = primaryRelated.length
    ? primaryMode === "best-seller"
      ? "Related Best Sellers"
      : "Related New Arrivals"
    : secondaryRelated.length
      ? primaryMode === "best-seller"
        ? "Related New Arrivals"
        : "Related Best Sellers"
      : "Related Picks"

  return { relatedProducts, relatedTitle }
}

function collectDescendantCategorySlugs(
  categorySlug: string,
  categories: Array<{ id: string; slug: string; parent_id?: string | null }>
) {
  const normalizedSlug = normalizeToken(categorySlug)
  const slugMap = new Map(categories.map((category) => [normalizeToken(category.slug), category]))
  const root = slugMap.get(normalizedSlug)
  if (!root) return new Set([normalizedSlug])

  const childrenByParent = new Map<string, Array<{ id: string; slug: string; parent_id?: string | null }>>()
  for (const category of categories) {
    if (!category.parent_id) continue
    if (!childrenByParent.has(category.parent_id)) childrenByParent.set(category.parent_id, [])
    childrenByParent.get(category.parent_id)?.push(category)
  }

  const slugs = new Set<string>()
  const stack = [root]
  const visited = new Set<string>()

  while (stack.length) {
    const current = stack.pop()
    if (!current || visited.has(current.id)) continue
    visited.add(current.id)
    slugs.add(normalizeToken(current.slug))
    const children = childrenByParent.get(current.id) || []
    for (const child of children) stack.push(child)
  }

  return slugs
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sub?: string; products?: string }>
}) {
  const { slug } = await params
  const { sub, products: selectedProducts } = await searchParams
  const selectedSubcategory = typeof sub === "string" ? sub.trim() : ""
  const selectedProductSlugs = parseSelectedProductSlugs(
    typeof selectedProducts === "string" ? selectedProducts : undefined
  )
  
  // Special case for 'all' products collection
  if (slug === 'all') {
    const [products, settings] = await Promise.all([
      getProducts(),
      getSiteSettings(),
    ])
    const allProducts = products as Product[]
    const curatedCollections = Array.isArray(settings?.collections)
      ? (settings.collections as CuratedCollectionItem[])
      : []
    const matchedCuratedCollection =
      selectedProductSlugs.size > 0
        ? curatedCollections.find((collection) => {
            const productSlugs = normalizeProductSlugs(collection.product_slugs)
            if (productSlugs.length === 0) return false
            if (productSlugs.length !== selectedProductSlugs.size) return false
            return productSlugs.every((token) => selectedProductSlugs.has(token))
          })
        : null
    const visibleProducts =
      selectedProductSlugs.size > 0
        ? allProducts.filter((product) => selectedProductSlugs.has(normalizeToken(product.slug)))
        : allProducts
    const { relatedProducts, relatedTitle } = buildRelatedProducts(allProducts, visibleProducts)
    const allCategory = {
      name: matchedCuratedCollection ? stripHtml(matchedCuratedCollection.title) : "The Collection",
      titleHtml: matchedCuratedCollection?.title || "The Collection",
      description:
        matchedCuratedCollection?.subtitle ||
        "Explore our entire range of signature fragrances, crafted for every mood and occasion.",
      image_url:
        matchedCuratedCollection?.cover_image ||
        matchedCuratedCollection?.image ||
        "/prfume-bannar-1.jpg",
    }
    
    return (
      <div className="min-h-screen bg-white">
        {/* Banner Section */}
        <div className="relative h-[40vh] min-h-[300px] w-full bg-neutral-900 overflow-hidden">
           <Image
             src={allCategory.image_url}
             alt={allCategory.name}
             fill
             className="object-cover"
             priority
           />
           <div className="absolute inset-0 bg-black/55" />
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <span className="text-white/60 uppercase tracking-[0.3em] text-[10px] mb-4">Discover</span>
              <h1
                className="text-white text-5xl md:text-7xl font-serif mb-4"
                dangerouslySetInnerHTML={{ __html: allCategory.titleHtml }}
              />
              <p className="text-white/80 max-w-xl font-light text-sm md:text-base leading-relaxed">
                {allCategory.description}
              </p>
           </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-between mb-12 border-b border-neutral-100 pb-6">
            <h2 className="text-xl font-serif">All Fragrances ({visibleProducts.length})</h2>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 border-2 border-dashed border-neutral-100 rounded-3xl">
              <p className="text-neutral-400 font-light italic">No products found in this collection.</p>
            </div>
          )}

          {relatedProducts.length > 0 && (
            <div className="mt-16 border-t border-neutral-100 pt-10">
              <div className="mb-8 flex items-center justify-between border-b border-neutral-100 pb-4">
                <h3 className="text-xl font-serif">{relatedTitle} ({relatedProducts.length})</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Smart Rotation</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {relatedProducts.map((product) => (
                  <ProductCard key={`related-${product.id}`} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const [category, allCategories, settings, allProductsRaw] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getSiteSettings(),
    getProducts(),
  ])
  const curatedCollections = Array.isArray(settings?.collections)
    ? (settings.collections as CuratedCollectionItem[])
    : []
  const curatedCollection =
    curatedCollections.find(
      (collection) => extractCollectionSlugFromHref(collection.href) === normalizeToken(slug)
    ) || null

  if (!category && !curatedCollection) {
    notFound()
  }

  const allCatalogProducts = allProductsRaw as Product[]
  const products = category
    ? ((await getProducts({ category: slug })) as Product[])
    : allCatalogProducts
  const curatedProductSlugs =
    curatedCollection && Array.isArray(curatedCollection.product_slugs)
      ? new Set(curatedCollection.product_slugs.map((item) => normalizeToken(item)).filter(Boolean))
      : null
  const baseProducts =
    curatedProductSlugs && curatedProductSlugs.size > 0
      ? products.filter((product) => curatedProductSlugs.has(normalizeToken(product.slug)))
      : products
  const normalizedSubcategory = normalizeToken(selectedSubcategory)
  const validSubcategorySlugs = normalizedSubcategory
    ? collectDescendantCategorySlugs(normalizedSubcategory, allCategories)
    : null
  const subFilteredProducts = normalizedSubcategory && category
    ? baseProducts.filter((product) => {
        if (normalizedSubcategory === "best-seller") {
          return Boolean(product.is_best_seller ?? product.isBestSeller)
        }

        if (normalizedSubcategory === "new-arrivals" || normalizedSubcategory === "new") {
          return Boolean(product.is_new ?? product.isNew)
        }

        const productCategorySlug = getCategorySlug(product.category)
        if (!productCategorySlug) return false

        const normalizedProductCategorySlug = normalizeToken(productCategorySlug)
        return validSubcategorySlugs ? validSubcategorySlugs.has(normalizedProductCategorySlug) : false
      })
    : baseProducts
  const visibleProducts =
    selectedProductSlugs.size > 0
      ? subFilteredProducts.filter((product) => selectedProductSlugs.has(normalizeToken(product.slug)))
      : subFilteredProducts
  const { relatedProducts, relatedTitle } = buildRelatedProducts(allCatalogProducts, visibleProducts)
  const heroImage =
    curatedCollection?.cover_image ||
    curatedCollection?.image ||
    category?.image_url ||
    "/curated-pefume-banner.png"
  const heroTitleHtml = curatedCollection?.title || category?.name || slug
  const heroTitleText = stripHtml(heroTitleHtml)
  const heroSubtitle = curatedCollection?.subtitle || category?.description || ""

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Dynamic Collection Hero */}
      <div className="relative h-[40vh] min-h-[400px] w-full flex items-center justify-center mb-16">
        <Image 
          src={heroImage}
          alt={heroTitleText}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 text-white border-white/30 tracking-widest uppercase bg-transparent hover:bg-transparent">
            Collection
          </Badge>
          <h1
            className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight"
            dangerouslySetInnerHTML={{ __html: heroTitleHtml }}
          />
          {heroSubtitle && (
            <p className="text-white/80 font-light text-lg">
              {heroSubtitle}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        {/* Back Link */}
        <div className="mb-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
               <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="font-medium tracking-wide uppercase text-xs">Back to Home</span>
          </Link>
        </div>

        {/* Products Grid */}
        {(selectedSubcategory || selectedProductSlugs.size > 0) && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
            <p className="text-neutral-700">
              {selectedSubcategory ? (
                <>
                  Filtering by subcategory: <span className="font-semibold">{selectedSubcategory}</span>
                </>
              ) : (
                <>
                  Filtering by selected products:{" "}
                  <span className="font-semibold">{selectedProductSlugs.size}</span>
                </>
              )}
            </p>
            <Link href={`/collections/${slug}`} className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-black">
              Clear Filter
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visibleProducts.length === 0 && (
          <div className="text-center py-20 text-neutral-500">
            No products found in this collection{selectedSubcategory ? ` for "${selectedSubcategory}".` : "."}
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-neutral-100 pt-10">
            <div className="mb-8 flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="text-xl font-serif">{relatedTitle} ({relatedProducts.length})</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Smart Rotation</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {relatedProducts.map((product) => (
                <ProductCard key={`related-${product.id}`} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
