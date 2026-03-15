
import { Button } from "@/components/ui/button"
import { products } from "@/lib/products"
import { ProductCard } from "@/components/product/product-card"

export function FeaturedProducts() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-neutral-900">
              The Collection
            </h2>
            <p className="text-neutral-500 max-w-sm font-light">
              Carefully curated scents designed to evoke emotion and memory.
            </p>
          </div>
          <Button variant="link" className="text-black underline-offset-4 hover:text-neutral-600 px-0">
            View All Scents
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
