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

  // Fetch related products from the same category first.
  const allProductsRaw = await getProducts()
  const allProducts = (allProductsRaw || []) as Product[]
  const sameCategoryProducts = allProducts
    .filter((p) => p.id !== product.id)
    .filter((p) => {
      if (currentCategoryId) return p.category_id === currentCategoryId
      const candidateCategory = normalizeToken(getCategorySlug(p.category) || "")
      if (!candidateCategory || !currentCategoryToken) return false
      return candidateCategory === currentCategoryToken
    })
  const relatedProducts = (sameCategoryProducts.length > 0 ? sameCategoryProducts : allProducts.filter((p) => p.id !== product.id))
    .slice(0, 5)

  return <ProductDisplay product={product} relatedProducts={relatedProducts} />
}
