import { useState, useEffect } from "react"
import { SingleImageUpload } from "@/components/single-image-upload"
import { HeroPreview } from "@/components/preview/hero-preview"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Link2 } from "lucide-react"
import { getAdminCategories, getAdminProducts, type Category, type AdminProduct } from "@/lib/admin-api"
import { buildCategoryHierarchyOptions } from "@/lib/category-hierarchy"

interface HeroSlide {
  image: string
  tagline: string
  headline: string
  href: string
}

interface HeroSettingsProps {
  slides: HeroSlide[]
  onChange: (slides: HeroSlide[]) => void
}

export function HeroSettings({ slides, onChange }: HeroSettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const categoryOptions = buildCategoryHierarchyOptions(categories)

  useEffect(() => {
    async function fetchData() {
      try {
        const [cats, prods] = await Promise.all([getAdminCategories(), getAdminProducts()])
        setCategories(cats)
        setProducts(prods)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      }
    }
    if (isModalOpen) fetchData()
  }, [isModalOpen])

  const updateSlide = (idx: number, field: keyof HeroSlide, value: string) => {
    const next = [...slides]
    next[idx] = { ...next[idx], [field]: value }
    onChange(next)
  }

  const addSlide = () => {
    onChange([...slides, { image: "", tagline: "New Collection", headline: "Elegance <br/> Redefined", href: "" }])
  }

  const removeSlide = (idx: number) => {
    onChange(slides.filter((_, i) => i !== idx))
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-neutral-900">Live Hero Preview</h2>
          <p className="mt-1 text-sm text-neutral-500">How your homepage looks right now.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-full">
          Edit Banners
        </Button>
      </div>

      <HeroPreview slides={slides} onEditClick={() => setIsModalOpen(true)} />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between w-full pr-12">
              <div>
                <DialogTitle className="text-3xl font-serif">Hero Banner Studio</DialogTitle>
                <DialogDescription>
                  Manage high-impact banners with automatic product/category linking.
                </DialogDescription>
              </div>
              <Button onClick={addSlide} className="rounded-full gap-2">
                <Plus className="h-4 w-4" /> Add Slide
              </Button>
            </div>
          </DialogHeader>

          <div className="grid gap-8 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {slides.map((slide, idx) => (
                <div key={idx} className="group relative p-6 bg-neutral-50 rounded-[2rem] border border-neutral-200 grid gap-5">
                  <button 
                    onClick={() => removeSlide(idx)}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="bg-black text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Global Slide {idx + 1}</span>
                  </div>

                  <SingleImageUpload 
                    value={slide.image} 
                    onUpload={(url) => updateSlide(idx, 'image', url)}
                    onRemove={() => updateSlide(idx, 'image', "")}
                  />

                  <div className="grid md:grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Tagline</label>
                      <input 
                        className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-black outline-none transition-all" 
                        placeholder="e.g. New Arrival" 
                        value={slide.tagline} 
                        onChange={(e) => updateSlide(idx, 'tagline', e.target.value)} 
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Headline (HTML)</label>
                      <textarea 
                        className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs h-24 focus:ring-2 focus:ring-black outline-none transition-all resize-none font-serif italic" 
                        placeholder="Main Headline" 
                        value={slide.headline} 
                        onChange={(e) => updateSlide(idx, 'headline', e.target.value)} 
                      />
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-neutral-200 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-1.5"><Link2 className="h-3 w-3"/> Link to Collection or Product</label>
                        <select 
                          className="w-full border border-neutral-200 bg-neutral-50 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer font-medium"
                          value={getDestinationSelectValue(slide.href)}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val.startsWith("cat:")) updateSlide(idx, "href", `/collections/${val.replace("cat:", "")}`)
                            else if (val.startsWith("prod:")) updateSlide(idx, "href", `/product/${val.replace("prod:", "")}`)
                          }}
                        >
                          <option value="" disabled>Select internal destination...</option>
                          <optgroup label="Categories">
                            {categoryOptions.map((option) => (
                              <option key={option.category.id} value={`cat:${option.category.slug}`}>
                                {option.path}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Products">
                            {products.map((prod) => (
                              <option key={prod.id} value={`prod:${prod.slug}`}>
                                {prod.name} {prod.ml ? `(${prod.ml} ML)` : ""}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">Button Redirect URL (Manual)</label>
                        <input className="w-full border border-neutral-200 bg-white rounded-xl px-3 py-2 text-[10px] font-mono" value={slide.href || ""} onChange={(e) => updateSlide(idx, 'href', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-6 border-y mt-8 bg-white/50 backdrop-blur-md sticky bottom-0 -mx-6 px-6 pb-6 rounded-b-[2rem] z-20">
              <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="px-12 py-6 rounded-full font-black tracking-[0.2em] text-xs">
                FINISH BANNER SETUP
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function getDestinationSelectValue(href?: string) {
  const value = normalizeHeroHref(href)
  const collectionMatch = value.match(/^\/collections\/([^/?#]+)/i)
  if (collectionMatch?.[1]) return `cat:${decodeURIComponent(collectionMatch[1])}`

  const productMatch = value.match(/^\/product\/([^/?#]+)/i)
  if (productMatch?.[1]) return `prod:${decodeURIComponent(productMatch[1])}`

  return ""
}

function normalizeHeroHref(href?: string) {
  const value = typeof href === "string" ? href.trim() : ""
  if (value.startsWith("/categories/")) return value.replace(/^\/categories\//, "/collections/")
  if (value.startsWith("/products/")) return value.replace(/^\/products\//, "/product/")
  return value
}
