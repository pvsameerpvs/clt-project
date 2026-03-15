import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { products } from "@/lib/products"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"

// Hardcoded collection data since it's not in products.ts
const COLLECTIONS = {
  "mens": {
    title: "Best Men's Collection",
    subtitle: "For Him",
    description: "Discover our most sought-after men's fragrances. Bold, sophisticated, and unmistakably masculine.",
    image: "/curated-perfume-men.png",
    filteredProductIds: ["4", "5", "1"] // Midnight Smock, Noir de Soir, Breath
  },
  "womens": {
    title: "Best Women's Collection",
    subtitle: "For Her",
    description: "An elegant selection of our finest women's perfumes. Delicate, romantic, and beautifully complex.",
    image: "/curated-pefume-banner.png",
    filteredProductIds: ["2", "3", "6"] // Elan, First Dance, Tears of Love
  },
  "deals": {
    title: "Best Deals & Sets",
    subtitle: "Exclusive Offers",
    description: "Curated gift sets and limited-time offers on our signature scents. Perfect for gifting or treating yourself.",
    image: "/best-deals-sets-2.png",
    filteredProductIds: ["1", "2", "6"] // Using the 'isNew' items for now
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  if (!(slug in COLLECTIONS)) {
    notFound()
  }

  const collection = COLLECTIONS[slug as keyof typeof COLLECTIONS]
  const collectionProducts = products.filter(p => collection.filteredProductIds.includes(p.id))

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Collection Hero */}
      <div className="relative h-[40vh] min-h-[400px] w-full flex items-center justify-center mb-16">
        <Image 
          src={collection.image}
          alt={collection.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 text-white border-white/30 tracking-widest uppercase bg-transparent hover:bg-transparent">
            {collection.subtitle}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
            {collection.title}
          </h1>
          <p className="text-white/80 font-light text-lg">
            {collection.description}
          </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {collectionProducts.length === 0 && (
          <div className="text-center py-20 text-neutral-500">
            No products found in this collection.
          </div>
        )}
      </div>
    </div>
  )
}
