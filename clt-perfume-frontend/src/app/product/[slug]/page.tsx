
import { notFound } from "next/navigation"
import { products } from "@/lib/products"
import { ProductDisplay } from "@/components/product-display"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug)
  
  if (!product) {
    notFound()
  }

  const relatedProducts = products
    .filter((p) => p.id !== product.id)
    .slice(0, 5)

  return <ProductDisplay product={product} relatedProducts={relatedProducts} />
}
