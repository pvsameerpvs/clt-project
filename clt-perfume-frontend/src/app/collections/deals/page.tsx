import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Percent, Sparkles, Tags } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { Badge } from "@/components/ui/badge"
import { getProducts, getSiteSettings } from "@/lib/api"
import { isOfferActive } from "@/lib/offers"
import { Product } from "@/lib/products"

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

interface CuratedCollectionItem {
  href: string
  image: string
  cover_image?: string
  subtitle: string
  title: string
  action: string
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

function normalizeProductSlugs(input: unknown) {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const values: string[] = []
  for (const token of input) {
    if (typeof token !== "string") continue
    const normalized = normalizeToken(token)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    values.push(normalized)
  }
  return values
}

function extractCollectionSlugFromHref(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  const match = value.match(/^\/collections\/([^/?#]+)/i)
  return match?.[1] ? normalizeToken(decodeURIComponent(match[1])) : ""
}

function resolveOfferHref(offer: PromoOffer) {
  const value = typeof offer.href === "string" ? offer.href.trim() : ""
  if (/^\/offers\/[^/?#]+/i.test(value)) return value
  const fallback = normalizeToken(offer.title)
  return fallback ? `/offers/${fallback}` : "/offers"
}

function getOfferBestDiscount(offer: PromoOffer) {
  const bundleDiscounts = Object.values(offer.bundle_discounts || {})
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)

  const directDiscount = Number(offer.discount_percentage || 0)
  const validDirectDiscount = Number.isFinite(directDiscount) && directDiscount > 0 ? directDiscount : 0
  const bestBundle = bundleDiscounts.length > 0 ? Math.max(...bundleDiscounts) : 0

  return Math.max(validDirectDiscount, bestBundle)
}

function getOfferBundleEntries(offer: PromoOffer) {
  const sizes = Array.isArray(offer.bundle_sizes) ? offer.bundle_sizes : []
  const discounts = offer.bundle_discounts || {}

  return sizes
    .map((size) => {
      const discount = Number(discounts[String(size)])
      if (!Number.isFinite(size) || size <= 0) return null
      return {
        size: Math.round(size),
        discount: Number.isFinite(discount) && discount > 0 ? Math.round(discount) : 0,
      }
    })
    .filter((entry): entry is { size: number; discount: number } => Boolean(entry))
}

function getOfferProductSlugs(offer: PromoOffer) {
  return normalizeProductSlugs(offer.product_slugs)
}

function pickDealProducts(allProducts: Product[], offers: PromoOffer[]) {
  const slugs = new Set(offers.flatMap((offer) => normalizeProductSlugs(offer.product_slugs)))

  if (slugs.size > 0) {
    const selected = allProducts.filter((product) => slugs.has(normalizeToken(product.slug)))
    if (selected.length > 0) return selected
  }

  const flagged = allProducts.filter((product) => {
    const isBestSeller = Boolean(product.is_best_seller ?? product.isBestSeller)
    const isNew = Boolean(product.is_new ?? product.isNew)
    const isExclusive = Boolean(product.is_exclusive ?? product.isExclusive)
    return isBestSeller || isNew || isExclusive
  })

  return flagged.length > 0 ? flagged : allProducts
}

export default async function DealsCollectionPage() {
  const [settings, allProductsRaw] = await Promise.all([getSiteSettings(), getProducts()])
  const allProducts = Array.isArray(allProductsRaw) ? (allProductsRaw as Product[]) : []
  const offers = Array.isArray(settings?.offers) ? (settings.offers as PromoOffer[]) : []
  const collections = Array.isArray(settings?.collections) ? (settings.collections as CuratedCollectionItem[]) : []

  const dealsCollection =
    collections.find((collection) => extractCollectionSlugFromHref(collection.href) === "deals") || null

  const activeOffers = offers.filter(isOfferActive)
  const rankedOffers = [...activeOffers].sort((a, b) => getOfferBestDiscount(b) - getOfferBestDiscount(a))
  const featuredOffers = rankedOffers.slice(0, 6)
  const bundleFocusedOffers = rankedOffers
    .map((offer) => ({ offer, bundles: getOfferBundleEntries(offer) }))
    .filter((entry) => entry.bundles.length > 0)
    .slice(0, 6)

  const averageDiscount = rankedOffers.length
    ? Math.round(rankedOffers.reduce((sum, offer) => sum + getOfferBestDiscount(offer), 0) / rankedOffers.length)
    : 0

  const dealProducts = pickDealProducts(allProducts, activeOffers)
  const productBySlug = new Map<string, Product>(allProducts.map((product) => [normalizeToken(product.slug), product]))

  const getOfferPreviewProduct = (offer: PromoOffer) => {
    const slugs = getOfferProductSlugs(offer)
    if (slugs.length === 0) return dealProducts[0] || allProducts[0]
    return productBySlug.get(slugs[0]) || dealProducts[0] || allProducts[0]
  }

  const heroImage = dealsCollection?.cover_image || dealsCollection?.image || "/curated-pefume-banner.png"
  const heroTitleHtml = dealsCollection?.title || "Deals Collection"
  const heroTitle = stripHtml(heroTitleHtml) || "Deals Collection"
  const heroSubtitle =
    dealsCollection?.subtitle || "Discover curated bundle offers and promo-selected products with exclusive pricing."

  return (
    <div className="min-h-screen bg-white pb-20">
      <section className="relative h-[42vh] min-h-[360px] overflow-hidden">
        <Image src={heroImage} alt={heroTitle} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 container mx-auto h-full px-4 md:px-6 flex flex-col justify-center">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-white/85 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back To Home
          </Link>

          <Badge
            variant="outline"
            className="mb-4 w-fit border-white/40 bg-transparent text-white uppercase tracking-[0.18em]"
          >
            Limited Time Deals
          </Badge>

          <h1
            className="text-4xl md:text-6xl font-serif text-white"
            dangerouslySetInnerHTML={{ __html: heroTitleHtml }}
          />
          <p className="mt-3 max-w-2xl text-white/85 font-light md:text-lg">{heroSubtitle}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-white/35 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-white">
              {activeOffers.length} Active Offers
            </div>
            <div className="rounded-full border border-white/35 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-white">
              {dealProducts.length} Deal Products
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 md:px-6 pt-12">
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-8">
          <aside className="space-y-4 xl:sticky xl:top-24 h-fit">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Deals Navigation</p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <a href="#offer-highlights" className="rounded-lg border border-neutral-200 px-3 py-2 hover:border-black transition-colors">Offer Highlights</a>
                <a href="#bundle-deals" className="rounded-lg border border-neutral-200 px-3 py-2 hover:border-black transition-colors">Bundle Deals</a>
                <a href="#deal-products" className="rounded-lg border border-neutral-200 px-3 py-2 hover:border-black transition-colors">Deal Products</a>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Deals Stats</p>
              <div className="mt-3 space-y-2 text-sm text-neutral-700">
                <div className="flex items-center justify-between">
                  <span>Active offers</span>
                  <span className="font-semibold text-neutral-900">{activeOffers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average discount</span>
                  <span className="font-semibold text-neutral-900">{averageDiscount}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deal products</span>
                  <span className="font-semibold text-neutral-900">{dealProducts.length}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Top Discounts</p>
              <div className="mt-3 space-y-2">
                {rankedOffers.slice(0, 5).map((offer, index) => {
                  const preview = getOfferPreviewProduct(offer)
                  return (
                    <Link
                      key={`sidebar-offer-${index}-${offer.title}`}
                      href={resolveOfferHref(offer)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-2 py-2 text-sm hover:border-black transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative h-9 w-8 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                          <Image
                            src={preview?.images?.[0] || "/placeholder-perfume.png"}
                            alt={offer.title || "Offer"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="line-clamp-1 text-neutral-800">{offer.title || "Offer"}</span>
                      </div>
                      <span className="font-semibold text-neutral-900">{getOfferBestDiscount(offer)}%</span>
                    </Link>
                  )
                })}
                {rankedOffers.length === 0 && <p className="text-sm text-neutral-500">No active offers yet.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Visual Picks</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {dealProducts.slice(0, 6).map((product) => (
                  <Link key={`sidebar-pick-${product.id}`} href={`/product/${product.slug}`} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-neutral-100">
                    <Image
                      src={product.images?.[0] || "/placeholder-perfume.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-12">
            <section id="offer-highlights">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-serif text-neutral-900">Offer Highlights</h2>
                <Link href="/offers" className="text-xs uppercase tracking-[0.14em] font-semibold text-neutral-500 hover:text-black">
                  View All Offers
                </Link>
              </div>

              {featuredOffers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {featuredOffers.map((offer, index) => {
                    const bestDiscount = getOfferBestDiscount(offer)
                    const preview = getOfferPreviewProduct(offer)
                    return (
                      <article
                        key={`deal-offer-${index}-${offer.title}`}
                        className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm h-full flex flex-col"
                      >
                        <div className="relative h-40 w-full bg-neutral-100">
                          <Image
                            src={preview?.images?.[0] || "/placeholder-perfume.png"}
                            alt={offer.title || "Offer"}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                          {bestDiscount > 0 && (
                            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                              <Percent className="h-3 w-3" />
                              {bestDiscount}% OFF
                            </span>
                          )}
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-lg font-serif text-neutral-900">{offer.title || "Offer"}</h3>
                          <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                            {offer.description || "Special curated promotion from CLE DXB Perfumes."}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {getOfferBundleEntries(offer).slice(0, 3).map((bundle) => (
                              <span
                                key={`${offer.title}-${bundle.size}-${bundle.discount}`}
                                className="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-neutral-700"
                              >
                                {bundle.size} items
                              </span>
                            ))}
                          </div>

                          <div className="mt-auto pt-4 flex justify-end">
                            <Link
                              href={resolveOfferHref(offer)}
                              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-700 hover:text-black"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              {offer.action || "View Offer"}
                            </Link>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center text-neutral-500">
                  No active offers available.
                </div>
              )}
            </section>

            <section id="bundle-deals">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-serif text-neutral-900">Bundle Deals</h2>
                <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Size + Discount Matrix</p>
              </div>

              {bundleFocusedOffers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {bundleFocusedOffers.map(({ offer, bundles }, index) => {
                    const preview = getOfferPreviewProduct(offer)
                    return (
                      <article
                        key={`bundle-deal-${index}-${offer.title}`}
                        className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm h-full flex flex-col"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative h-16 w-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                            <Image
                              src={preview?.images?.[0] || "/placeholder-perfume.png"}
                              alt={offer.title || "Offer"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-serif text-neutral-900">{offer.title || "Offer"}</h3>
                            <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                              {offer.description || "Curated bundle offer configuration."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {bundles.map((bundle) => (
                            <div
                              key={`${offer.title}-${bundle.size}-${bundle.discount}`}
                              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2"
                            >
                              <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">Bundle Size</p>
                              <p className="text-sm font-semibold text-neutral-900 mt-1">{bundle.size} Items</p>
                              <p className="text-[11px] text-neutral-700 mt-1">
                                {bundle.discount > 0 ? `${bundle.discount}% OFF` : "Offer Price"}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-auto pt-4 flex justify-end">
                          <Link
                            href={resolveOfferHref(offer)}
                            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-700 hover:text-black"
                          >
                            {offer.action || "Open Offer"}
                          </Link>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center text-neutral-500">
                  No bundle configurations available yet.
                </div>
              )}
            </section>

            <section id="deal-products">
              <div className="mb-6 flex items-center justify-between border-b border-neutral-100 pb-4">
                <h2 className="text-2xl font-serif text-neutral-900">Deal Products ({dealProducts.length})</h2>
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-neutral-600">
                  <Tags className="h-3.5 w-3.5" />
                  Auto Curated
                </div>
              </div>

              {dealProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                  {dealProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-neutral-500">
                  No products available for deals right now.
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
