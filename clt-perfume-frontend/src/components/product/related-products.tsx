import { Product } from "@/lib/products"
import { ProductCard } from "@/components/product/product-card"

export function RelatedProducts({ relatedProducts }: { relatedProducts: Product[] }) {
  if (!relatedProducts || relatedProducts.length === 0) return null;

  return (
    <div className="border-t border-neutral-200 pt-16">
      <h2 className="text-3xl font-serif mb-10 text-center">You Might Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {relatedProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
