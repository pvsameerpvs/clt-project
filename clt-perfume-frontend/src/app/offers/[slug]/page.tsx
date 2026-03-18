import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Gift, PenTool, Sparkles } from "lucide-react"

import { getProducts, getSiteSettings } from "@/lib/api"
import { Product } from "@/lib/products"
import { ProductCard } from "@/components/product/product-card"
import { OfferBundleBuilder } from "@/components/offers/offer-bundle-builder"

interface PromoOffer {
  title: string
  description: string
  action: string
  href: string
  badge?: string
  bgColor?: string
  product_slugs?: string[]
  discount_percentage?: number
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

function extractOfferSlug(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  const match = value.match(/^\/offers\/([^/?#]+)/i)
  return match?.[1] ? normalizeToken(decodeURIComponent(match[1])) : ""
}

function resolveOfferSlug(offer: PromoOffer) {
  const fromHref = extractOfferSlug(offer.href)
  if (fromHref) return fromHref
  return normalizeToken(offer.title)
}

function buildDetails(offer: PromoOffer, selectedCount: number) {
  const cleanedDescription = stripHtml(offer.description)
  const details = [cleanedDescription || "Discover this curated offer from CLE Perfumes."]

  if (typeof offer.discount_percentage === "number" && offer.discount_percentage > 0) {
    details.push(`Save ${offer.discount_percentage}% when you complete the recommended bundle size.`)
  } else {
    details.push("Complete your curated bundle and enjoy exclusive offer pricing at checkout.")
  }

  if (selectedCount > 0) {
    details.push(`This offer currently includes ${selectedCount} selected eligible item${selectedCount > 1 ? "s" : ""}.`)
  } else {
    details.push("Choose from our full catalog to build your offer bundle.")
  }

  return details.slice(0, 3)
}

function getOfferIcon(title: string) {
  const token = normalizeToken(title)
  if (token.includes("engrav")) return <PenTool className="h-12 w-12 text-neutral-400 mb-6" />
  if (token.includes("sample") || token.includes("mini")) return <Sparkles className="h-12 w-12 text-neutral-400 mb-6" />
  return <Gift className="h-12 w-12 text-neutral-400 mb-6" />
}

function buildProductsHref(slugs: string[]) {
  const normalized = normalizeProductSlugs(slugs)
  if (normalized.length === 0) return "/collections/all"
  return `/collections/all?products=${normalized.map((slug) => encodeURIComponent(slug)).join(",")}`
}

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalizedSlug = normalizeToken(slug)

  const [settings, allProductsRaw] = await Promise.all([getSiteSettings(), getProducts()])
  const offers = Array.isArray(settings?.offers) ? (settings.offers as PromoOffer[]) : []
  const allProducts = Array.isArray(allProductsRaw) ? (allProductsRaw as Product[]) : []

  const offerIndex = offers.findIndex((offer) => resolveOfferSlug(offer) === normalizedSlug)
  if (offerIndex < 0) {
    notFound()
  }

  const offer = offers[offerIndex]
  const selectedProductSlugs = new Set(normalizeProductSlugs(offer.product_slugs))
  const eligibleProductsRaw =
    selectedProductSlugs.size > 0
      ? allProducts.filter((product) => selectedProductSlugs.has(normalizeToken(product.slug)))
      : allProducts
  const eligibleProducts = eligibleProductsRaw.length > 0 ? eligibleProductsRaw : allProducts

  const details = buildDetails(offer, selectedProductSlugs.size)
  const bgColor = offer.bgColor || ["bg-[#F3F0EA]", "bg-[#EBEFF5]", "bg-[#F5EBEB]"][offerIndex % 3]
  const heroImage = eligibleProducts[0]?.images?.[0] || "/prfume-bannar5.jpg"

  return (
    <div className="min-h-screen bg-white">
      <div className={`${bgColor} py-24 relative overflow-hidden flex items-center justify-center`}>
        <div
          className="absolute inset-0 opacity-10 mix-blend-multiply"
          style={{ backgroundImage: "radial-gradient(#000 1px, transparent 0)", backgroundSize: "40px 40px" }}
        ></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-600 hover:text-black transition-colors mb-12"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Offers
          </Link>

          <div className="max-w-3xl">
            {getOfferIcon(offer.title)}
            <h1 className="text-5xl md:text-7xl font-serif font-light text-neutral-900 mb-6 leading-tight">{offer.title}</h1>
            <p className="text-xl md:text-2xl font-light text-neutral-600 leading-relaxed max-w-xl">
              {offer.description}
            </p>
          </div>
        </div>
      </div>

      {/* <div className="container mx-auto px-4 md:px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="relative aspect-[4/5] w-full max-h-[800px] overflow-hidden shadow-2xl bg-neutral-100">
            <Image
              src={heroImage}
              alt={offer.title}
              fill
              className="object-cover scale-105 hover:scale-110 transition-transform duration-1000"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
          </div>

          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">The Details</span>
              <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 leading-tight">Exclusive Perks & Specifications</h2>
            </div>

            <ul className="space-y-8">
              {details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-6">
                  <span className="text-sm font-serif italic text-neutral-400 shrink-0 mt-1">0{idx + 1}</span>
                  <p className="text-neutral-600 font-light leading-relaxed text-lg">{detail}</p>
                </li>
              ))}
            </ul>

            <div className="pt-8 border-t border-neutral-100">
              <Button
                asChild
                className="h-16 px-10 rounded-none bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-sm font-medium transition-all w-full sm:w-auto"
              >
                <a href="#bundle-builder">{offer.action || "Build Bundle"}</a>
              </Button>
            </div>
          </div>
        </div>
      </div> */}

      {eligibleProducts.length > 0 && (
        <div className="container mx-auto px-4 md:px-6 pb-20 pt-10">
          <OfferBundleBuilder
            offerTitle={offer.title}
            discountPercentage={offer.discount_percentage}
            products={eligibleProducts}
          />
        </div>
      )}

      <div className="bg-neutral-50 py-24 border-t border-neutral-100" id="eligible-items">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Shop The Offer</span>
              <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-neutral-900">Eligible Items</h2>
            </div>
            <Button asChild variant="link" className="text-black underline-offset-4 hover:text-neutral-600 px-0">
              <Link href={buildProductsHref(Array.from(selectedProductSlugs))}>View All Eligible</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {eligibleProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
