import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { getCategoryBySlug, getProducts } from "@/lib/api"
import { Product, getCategorySlug } from "@/lib/products"

function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sub?: string }>
}) {
  const { slug } = await params
  const { sub } = await searchParams
  const selectedSubcategory = typeof sub === "string" ? sub.trim() : ""
  
  // Special case for 'all' products collection
  if (slug === 'all') {
    const products = (await getProducts()) as Product[]
    const allCategory = {
      name: "The Collection",
      description: "Explore our entire range of signature fragrances, crafted for every mood and occasion.",
      image_url: "/prfume-bannar-1.jpg"
    }
    
    return (
      <div className="min-h-screen bg-white">
        {/* Banner Section */}
        <div className="relative h-[40vh] min-h-[300px] w-full bg-neutral-900">
           <div className="absolute inset-0 opacity-40">
             {/* Use fallback if no image */}
             <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-black" />
           </div>
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <span className="text-white/60 uppercase tracking-[0.3em] text-[10px] mb-4">Discover</span>
              <h1 className="text-white text-5xl md:text-7xl font-serif mb-4">{allCategory.name}</h1>
              <p className="text-white/80 max-w-xl font-light text-sm md:text-base leading-relaxed">
                {allCategory.description}
              </p>
           </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-between mb-12 border-b border-neutral-100 pb-6">
            <h2 className="text-xl font-serif">All Fragrances ({products.length})</h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 border-2 border-dashed border-neutral-100 rounded-3xl">
              <p className="text-neutral-400 font-light italic">No products found in this collection.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Fetch real category from DB
  const category = await getCategoryBySlug(slug)
  
  if (!category) {
    notFound()
  }

  // Fetch real products for this category
  const products = (await getProducts({ category: slug })) as Product[]
  const normalizedSubcategory = normalizeToken(selectedSubcategory)
  const visibleProducts = normalizedSubcategory
    ? products.filter((product) => {
        const productCategorySlug = getCategorySlug(product.category)
        return productCategorySlug ? normalizeToken(productCategorySlug) === normalizedSubcategory : false
      })
    : products

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Dynamic Collection Hero */}
      <div className="relative h-[40vh] min-h-[400px] w-full flex items-center justify-center mb-16">
        <Image 
          src={category.image_url || "/curated-pefume-banner.png"}
          alt={category.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 text-white border-white/30 tracking-widest uppercase bg-transparent hover:bg-transparent">
            Collection
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-white/80 font-light text-lg">
              {category.description}
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
        {selectedSubcategory && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
            <p className="text-neutral-700">
              Filtering by subcategory: <span className="font-semibold">{selectedSubcategory}</span>
            </p>
            <Link href={`/collections/${slug}`} className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-black">
              Clear Filter
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visibleProducts.length === 0 && (
          <div className="text-center py-20 text-neutral-500">
            No products found in this collection{selectedSubcategory ? ` for "${selectedSubcategory}".` : "."}
          </div>
        )}
      </div>
    </div>
  )
}
