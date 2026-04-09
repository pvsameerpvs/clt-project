"use client"

import { Search, Loader2, Package, LayoutGrid } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getProducts, getCategories, ProductCategory } from "@/lib/api"
import { Product, getCategoryLabel } from "@/lib/products"
import Link from "next/link"
import Image from "next/image"

interface NavbarSearchProps {
  className?: string
}

export function NavbarSearch({ className }: NavbarSearchProps) {
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced Search
  useEffect(() => {
    if (!query.trim()) {
      setProducts([])
      setCategories([])
      setIsOpen(false)
      return
    }

    setIsOpen(true)
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        // Fetch matching products (Server Side API)
        const matchedProducts = await getProducts({ search: query.trim(), limit: 5 })
        // Deduplicate products (sometimes backend returns same product if schema/data mismatch)
        const uniqueProducts = matchedProducts.reduce((acc: Product[], current) => {
          if (!acc.find(item => item.id === current.id)) acc.push(current);
          return acc;
        }, []);
        setProducts(uniqueProducts)

        // Fetch or filter categories (Server Side API)
        const allCategories = await getCategories()
        const matchedCats = allCategories.filter(c => 
          c.name.toLowerCase().includes(query.toLowerCase()) && !c.parent_id
        ).slice(0, 3) // max 3 categories
        
        setCategories(matchedCats)
      } catch (err) {
        console.error("Search failed:", err)
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      setIsOpen(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const submitSearch = () => {
    if (query.trim()) {
      setIsOpen(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div ref={wrapperRef} className={cn("relative z-50", className)}>
      <Input 
        type="search" 
        placeholder="Search for product or category" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
        onFocus={() => { if (query.trim()) setIsOpen(true) }}
        className="w-full rounded-full pl-6 pr-12 h-12 border-neutral-300 focus-visible:ring-black/5 text-neutral-600 font-light"
      />
      
      {loading ? (
        <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5 animate-spin" />
      ) : (
        <Search 
          onClick={submitSearch}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5 cursor-pointer hover:text-black transition-colors" 
        />
      )}

      {/* Live Search Dropdown */}
      {isOpen && (query.trim().length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden max-h-[80vh] overflow-y-auto">
          {!loading && products.length === 0 && categories.length === 0 ? (
            <div className="p-6 text-center text-sm text-neutral-500 font-light">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-2 space-y-2">
              
              {/* Categories */}
              {categories.length > 0 && (
                <div className="mb-2">
                  <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Categories</h4>
                  <div className="flex flex-col">
                    {categories.map(cat => (
                      <Link 
                        key={cat.id} 
                        href={`/collections/${cat.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 rounded-xl transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                          <LayoutGrid className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-neutral-900 group-hover:text-black">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {products.length > 0 && (
                <div>
                  <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Products</h4>
                  <div className="flex flex-col gap-1">
                    {products.map(product => (
                      <Link 
                        key={product.id} 
                        href={`/product/${product.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 rounded-xl transition-colors group"
                      >
                        {product.images && product.images.length > 0 ? (
                          <div className="h-10 w-10 relative rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                            <Image 
                              src={product.images[0]} 
                              alt={product.name} 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-neutral-900 group-hover:text-black line-clamp-1">{product.name}</span>
                          {product.category && getCategoryLabel(product.category) !== "Uncategorized" && (
                            <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                              {getCategoryLabel(product.category)}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Details */}
              <div className="pt-2 pb-1 px-2 border-t border-neutral-50 mt-2">
                <button 
                  onClick={submitSearch}
                  className="w-full text-center text-[10px] font-semibold uppercase tracking-widest py-2 text-neutral-400 hover:text-black transition-colors"
                >
                  View All Search Results
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  )
}
