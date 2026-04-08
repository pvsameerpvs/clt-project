import { notFound } from "next/navigation"
import { getProductBySlug, getProducts } from "@/lib/api"
import { ProductDisplay } from "@/components/product-display"
import { Product, getCategorySlug } from "@/lib/products"

function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Fetch the main product
  const product = await getProductBySlug(slug)
  
  if (!product) {
    notFound()
  }

  const currentCategoryId = typeof product.category_id === "string" ? product.category_id : ""
  const currentCategoryToken = normalizeToken(getCategorySlug(product.category) || "")

  // Fetch cross-sell products from DIFFERENT categories
  const allProductsRaw = await getProducts()
  const allProducts = (allProductsRaw || []) as Product[]
  
  const differentCategoryProducts = allProducts
    .filter((p) => p.id !== product.id)
    .filter((p) => {
      if (currentCategoryId && p.category_id === currentCategoryId) return false
      const candidateCategory = normalizeToken(getCategorySlug(p.category) || "")
      if (candidateCategory && currentCategoryToken && candidateCategory === currentCategoryToken) return false
      return true
    })

  // If we couldn't find enough different-category products, just use any products (excluding current)
  const relatedProducts = (differentCategoryProducts.length > 0 ? differentCategoryProducts : allProducts.filter((p) => p.id !== product.id))
    .reverse() // Just reverse so it gives a different feel without being impure
    .slice(0, 5)

  return <ProductDisplay product={product} relatedProducts={relatedProducts} />
}
