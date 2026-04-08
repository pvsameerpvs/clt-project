"use client"

import { Product } from "@/lib/products"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { ProductGallery } from "@/components/product/product-gallery"
import { ProductInfo } from "@/components/product/product-info"
import { ProductReviews } from "@/components/product/product-reviews"
import { RelatedProducts } from "@/components/product/related-products"


export function ProductDisplay({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  return (
    <div className="min-h-screen bg-white pb-20 pt-8">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Breadcrumb / Back Link */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
               <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="font-medium tracking-wide uppercase text-xs">Back to Collection</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 mb-20">
          {/* Left Column: Images and Desktop Related Products */}
          <ProductGallery product={product} relatedProducts={relatedProducts} />

          {/* Right Column: Product Info */}
          <ProductInfo product={product} />
        </div>

        {/* Reviews Section */}
        <ProductReviews product={product} />

        {/* You Might Also Like */}
        <RelatedProducts relatedProducts={relatedProducts} />

      </div>
    </div>
  )
}
