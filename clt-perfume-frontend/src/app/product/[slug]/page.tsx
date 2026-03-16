import { notFound } from "next/navigation"
import { getProductBySlug, getProducts } from "@/lib/api"
import { ProductDisplay } from "@/components/product-display"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Fetch the main product
  const product = await getProductBySlug(slug)
  
  if (!product) {
    notFound()
  }

  // Fetch related products (for now just all products excluding current)
  const allProducts = await getProducts()
  const relatedProducts = (allProducts || [])
    .filter((p: any) => p.id !== product.id)
    .slice(0, 5)

  return <ProductDisplay product={product} relatedProducts={relatedProducts} />
}
