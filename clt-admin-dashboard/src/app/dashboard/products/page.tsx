"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  AdminProduct,
  createAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  getAdminProducts,
  updateAdminProduct,
  Category,
} from "@/lib/admin-api"
import { ProductForm } from "@/components/products/product-form"
import { ProductList } from "@/components/products/product-list"
import { ProductPreview, ProductPreviewData } from "@/components/products/product-preview"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import {
  EMPTY_PRODUCT_FORM,
  ProductFormState,
  ProductViewFilter,
  joinCsv,
  splitCsv,
} from "@/components/products/types"

function normalizeProduct(product: AdminProduct): ProductPreviewData {
  return {
    id: product.id,
    name: product.name || "Untitled Fragrance",
    slug: product.slug || "",
    description: product.description || "",
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    scent: product.scent || "",
    images: product.images || [],
    tags: product.tags || [],
    top_notes: product.top_notes || [],
    heart_notes: product.heart_notes || [],
    base_notes: product.base_notes || [],
    is_active: product.is_active !== false,
    is_new: Boolean(product.is_new),
    is_best_seller: Boolean(product.is_best_seller),
    is_exclusive: Boolean(product.is_exclusive),
    ml: product.ml || "",
  }
}

function draftFromForm(form: ProductFormState): ProductPreviewData {
  return {
    id: form.id,
    name: form.name.trim() || "Untitled Fragrance",
    slug: form.slug.trim(),
    description: form.description.trim(),
    price: Number(form.price || 0),
    stock: Number(form.stock || 0),
    scent: form.scent.trim(),
    images: splitCsv(form.images),
    tags: splitCsv(form.tags),
    top_notes: splitCsv(form.top_notes),
    heart_notes: splitCsv(form.heart_notes),
    base_notes: splitCsv(form.base_notes),
    is_active: form.is_active,
    is_new: form.is_new,
    is_best_seller: form.is_best_seller,
    is_exclusive: form.is_exclusive,
    ml: form.ml.trim(),
  }
}

function hasCreateDraft(form: ProductFormState) {
  return Boolean(
    form.name.trim() ||
      form.slug.trim() ||
      form.description.trim() ||
      form.price.trim() ||
      form.stock.trim() ||
      form.scent.trim() ||
      form.images.trim() ||
      form.tags.trim() ||
      form.top_notes.trim() ||
      form.heart_notes.trim() ||
      form.base_notes.trim() ||
      form.ml.trim() ||
      !form.is_active ||
      form.is_new ||
      form.is_best_seller ||
      form.is_exclusive
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [viewFilter, setViewFilter] = useState<ProductViewFilter>("all")
  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [serverMlFilter, setServerMlFilter] = useState("")
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  
  // Professional Hub Tabs
  const [activeTab, setActiveTab] = useState<"studio" | "catalog" | "preview">("catalog")

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0)),
    [products]
  )

  const filteredProducts = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return sortedProducts

    return sortedProducts.filter((product) => {
      const haystack = [product.name, product.slug, product.scent, ...(product.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const matchesSearch = haystack.includes(text)

      let matchesFilter = true
      if (viewFilter === "active") matchesFilter = product.is_active !== false
      if (viewFilter === "inactive") matchesFilter = product.is_active === false
      if (viewFilter === "low_stock") matchesFilter = Number(product.stock || 0) < 10
      if (viewFilter === "featured") {
        matchesFilter = Boolean(product.is_new) || Boolean(product.is_best_seller) || Boolean(product.is_exclusive)
      }

      return matchesSearch && matchesFilter
    })
  }, [query, sortedProducts, viewFilter])

  const variantGroupOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: string[] = []

    for (const product of sortedProducts) {
      const raw = (product.variant_group_id || "").trim()
      if (!raw) continue

      const key = raw.toLowerCase()
      if (seen.has(key)) continue

      seen.add(key)
      options.push(raw)
    }

    return options.sort((a, b) => a.localeCompare(b))
  }, [sortedProducts])

  const selectedProduct = useMemo(
    () => sortedProducts.find((product) => product.id === selectedProductId) || null,
    [selectedProductId, sortedProducts]
  )

  const shouldPreviewForm = useMemo(() => {
    if (form.id && form.id === selectedProductId) return true
    if (!form.id && hasCreateDraft(form)) return true
    return false
  }, [form, selectedProductId])

  const previewProduct = useMemo(() => {
    if (shouldPreviewForm) return draftFromForm(form)
    if (selectedProduct) return normalizeProduct(selectedProduct)
    if (!selectedProductId) return null
    if (sortedProducts[0]) return normalizeProduct(sortedProducts[0])
    return null
  }, [form, selectedProduct, selectedProductId, shouldPreviewForm, sortedProducts])

  async function loadProducts(preferredProductId?: string | null, mlValue?: string) {
    try {
      setLoading(true)
 
      const [nextProducts, nextCategories] = await Promise.all([
        getAdminProducts({ ml: mlValue ?? serverMlFilter }),
        getAdminCategories(),
      ])
      
      setProducts(nextProducts)
      setCategories(nextCategories)

      setSelectedProductId((currentSelectedId) => {
        const targetId = preferredProductId ?? currentSelectedId
        if (targetId && nextProducts.some((product) => product.id === targetId)) {
          return targetId
        }
        return nextProducts[0]?.id || null
      })
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : "Unable to load products.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts(null, serverMlFilter)
  }, [serverMlFilter])

  function handleVariantAutofill() {
    const normalizedGroupId = form.variant_group_id.trim().toLowerCase()
    if (!normalizedGroupId) {
      toast.error("Enter Variant Group ID first.")
      return
    }

    const sourceProduct = sortedProducts.find(
      (product) => (product.variant_group_id || "").trim().toLowerCase() === normalizedGroupId
    )

    if (!sourceProduct) {
      toast.error(`No product found for Variant Group ID: ${form.variant_group_id.trim()}`)
      return
    }

    setForm((prev) => {
      if (prev.id) return prev
      if (prev.variant_group_id.trim().toLowerCase() !== normalizedGroupId) return prev

      return {
        ...prev,
        name: sourceProduct.name ?? prev.name,
        description: sourceProduct.description ?? prev.description,
        price:
          sourceProduct.price === undefined || sourceProduct.price === null
            ? prev.price
            : String(sourceProduct.price),
        stock:
          sourceProduct.stock === undefined || sourceProduct.stock === null
            ? prev.stock
            : String(sourceProduct.stock),
        scent: sourceProduct.scent ?? prev.scent,
        olfactive_family: sourceProduct.olfactive_family ?? prev.olfactive_family,
        olfactive_signature: sourceProduct.olfactive_signature ?? prev.olfactive_signature,
        concentration: sourceProduct.concentration ?? prev.concentration,
        mood_use: sourceProduct.mood_use ?? prev.mood_use,
        tags: sourceProduct.tags ? joinCsv(sourceProduct.tags) : prev.tags,
        top_notes: sourceProduct.top_notes ? joinCsv(sourceProduct.top_notes) : prev.top_notes,
        heart_notes: sourceProduct.heart_notes ? joinCsv(sourceProduct.heart_notes) : prev.heart_notes,
        base_notes: sourceProduct.base_notes ? joinCsv(sourceProduct.base_notes) : prev.base_notes,
        is_active: sourceProduct.is_active !== false,
        is_new: Boolean(sourceProduct.is_new),
        is_best_seller: Boolean(sourceProduct.is_best_seller),
        is_exclusive: Boolean(sourceProduct.is_exclusive),
        category_id: sourceProduct.category_id ?? prev.category_id,
        show_in_catalog: sourceProduct.show_in_catalog !== false,
        // Keep these manual for each variant.
        images: prev.images,
        ml: prev.ml,
        slug: prev.slug,
      }
    })
  }

  function startEdit(product: AdminProduct) {
    setSelectedProductId(product.id)
    setForm({
      id: product.id,
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      price: String(product.price || ""),
      stock: String(product.stock || 0),
      scent: product.scent || "",
      olfactive_family: product.olfactive_family || "",
      olfactive_signature: product.olfactive_signature || "",
      concentration: product.concentration || "",
      mood_use: product.mood_use || "",
      images: joinCsv(product.images),
      tags: joinCsv(product.tags),
      top_notes: joinCsv(product.top_notes),
      heart_notes: joinCsv(product.heart_notes),
      base_notes: joinCsv(product.base_notes),
      is_active: product.is_active !== false,
      is_new: Boolean(product.is_new),
      is_best_seller: Boolean(product.is_best_seller),
      is_exclusive: Boolean(product.is_exclusive),
      category_id: product.category_id || "",
      ml: product.ml || "",
      variant_group_id: product.variant_group_id || "",
      show_in_catalog: product.show_in_catalog !== false,
    })
    setActiveTab("studio") // Auto-switch to studio for editing
  }

  function handleDeleteClick(id: string) {
    setDeleteModal({ isOpen: true, id })
  }

  async function handleDelete(idToDelete: string) {
    try {
      await deleteAdminProduct(idToDelete)
      toast.success("Product deleted")

      if (form.id === idToDelete) {
        setForm(EMPTY_PRODUCT_FORM)
      }

      const preferredId = selectedProductId === idToDelete ? null : selectedProductId
      await loadProducts(preferredId)
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Unable to delete product.")
    }
  }

  async function handleToggleActive(product: AdminProduct) {
    try {
      const isActive = product.is_active !== false
      await updateAdminProduct(product.id, { is_active: !isActive })
      
      if (form.id === product.id) {
        setForm(prev => ({ ...prev, is_active: !isActive }))
      }
      
      toast.success(`Product ${!isActive ? 'published' : 'hidden'}`)
      await loadProducts(selectedProductId)
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : "Unable to toggle visibility.")
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSaving(true)

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        scent: form.scent.trim(),
        olfactive_family: form.olfactive_family.trim(),
        olfactive_signature: form.olfactive_signature.trim(),
        concentration: form.concentration.trim(),
        mood_use: form.mood_use.trim(),
        images: splitCsv(form.images),
        tags: splitCsv(form.tags),
        top_notes: splitCsv(form.top_notes),
        heart_notes: splitCsv(form.heart_notes),
        base_notes: splitCsv(form.base_notes),
        is_active: form.is_active,
        is_new: form.is_new,
        is_best_seller: form.is_best_seller,
        is_exclusive: form.is_exclusive,
        category_id: form.category_id || null,
        ml: form.ml.trim() || null,
        variant_group_id: form.variant_group_id.trim() || null,
        show_in_catalog: form.show_in_catalog,
      }

      if (!payload.name || !payload.slug) {
        throw new Error("Name and slug are required.")
      }

      let savedProduct: AdminProduct
      if (form.id) {
        savedProduct = await updateAdminProduct(form.id, payload)
        toast.success("Product updated")
      } else {
        savedProduct = await createAdminProduct(payload)
        toast.success("Product created")
      }

      setForm(EMPTY_PRODUCT_FORM)
      await loadProducts(savedProduct.id)
      setActiveTab("catalog") // Back to catalog after success
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to save product.")
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.is_active !== false).length
    const inactiveProducts = products.filter((product) => product.is_active === false).length
    const lowStock = products.filter((product) => Number(product.stock || 0) < 10).length
    const flagged = products.filter(
      (product) => Boolean(product.is_new) || Boolean(product.is_best_seller) || Boolean(product.is_exclusive)
    ).length

    return {
      total: products.length,
      activeProducts,
      inactiveProducts,
      lowStock,
      flagged,
    }
  }, [products])

  const tabBtnClass = (id: string) => `
    flex items-center gap-3 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all
    ${activeTab === id 
      ? "bg-black text-white shadow-2xl shadow-black/20 scale-[1.05]" 
      : "bg-white text-neutral-400 border border-neutral-100 hover:border-black hover:text-black"
    }
  `

  return (
    <div className="space-y-12 p-4 sm:p-12 max-w-[1700px] mx-auto min-h-screen content-start">
      <header className="flex flex-wrap items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-[2px] w-12 bg-black" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Inventory Hub</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-neutral-900 italic tracking-tighter">Product Mastery</h1>
          <p className="text-neutral-500 font-light max-w-2xl text-lg italic">
            Curate your fragrances across collections, manage stock levels, and preview the luxury presentation in real-time.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setForm(EMPTY_PRODUCT_FORM)
              setSelectedProductId(null)
              setActiveTab("studio")
            }}
            className="bg-black text-white rounded-full px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-2xl shadow-black/10 hover:scale-105 active:scale-95"
            type="button"
          >
            + Create New Essence
          </button>
        </div>
      </header>


      {/* 📊 Luxury Stats Strip */}
      <section className="grid gap-6 grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Inventory", val: stats.total },
          { label: "Active Shop", val: stats.activeProducts },
          { label: "Draft/Inactive", val: stats.inactiveProducts },
          { label: "Critical Stock", val: stats.lowStock, warning: stats.lowStock > 0 },
          { label: "Premium Flagged", val: stats.flagged }
        ].map((s, i) => (
          <article key={i} className="rounded-[2.5rem] border border-neutral-100 bg-white/50 backdrop-blur-sm p-7 shadow-sm hover:shadow-xl hover:border-black/5 transition-all duration-500 group">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-black transition-colors">{s.label}</p>
            <h3 className={`mt-3 text-3xl font-serif italic tracking-tighter ${s.warning ? 'text-red-500' : 'text-neutral-900'}`}>{s.val}</h3>
          </article>
        ))}
      </section>

      {/* 📑 Premium Hub Navigator */}
      <nav className="flex items-center gap-6 border-b border-neutral-100 pb-4">
        {[
          { id: "studio", label: "Product Studio", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> },
          { id: "catalog", label: "Master Catalog", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg> },
          { id: "preview", label: "Live Visualizer", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as "studio" | "catalog" | "preview")} className={tabBtnClass(tab.id)}>
            <span className="bg-neutral-100 rounded-xl p-2 group-hover:bg-black group-hover:text-white transition-all">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 🎭 Workspace Stage */}
      <main className="min-h-[700px]">
        {activeTab === "studio" && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <ProductForm
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              onVariantAutofill={handleVariantAutofill}
              variantGroupOptions={variantGroupOptions}
              onClear={() => {
                setForm(EMPTY_PRODUCT_FORM)
                setSelectedProductId(null)
              }}
              saving={saving}
              categories={categories}
            />
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <ProductList
              products={filteredProducts}
              loading={loading}
              selectedProductId={selectedProductId}
              onSelect={(product) => setSelectedProductId(product.id)}
              onEdit={startEdit}
              onDelete={handleDeleteClick}
              onToggleActive={handleToggleActive}
              query={query}
              setQuery={setQuery}
              viewFilter={viewFilter}
              setViewFilter={setViewFilter}
              serverMlFilter={serverMlFilter}
              setServerMlFilter={setServerMlFilter}
            />
          </div>
        )}

        {activeTab === "preview" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center mb-10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">Boutique View</span>
              <h2 className="text-3xl font-serif italic">Real-Time Presentation</h2>
              <p className="text-neutral-400 text-sm italic">Validation of how your customers perceive this fragrance.</p>
            </div>
            <div className="w-full max-w-sm">
              <ProductPreview product={previewProduct} isDraft={shouldPreviewForm} />
            </div>
          </div>
        )}
      </main>

        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Product"
          message="Are you absolute sure you want to delete this product? This action cannot be undone."
          confirmText="Yes, Delete"
          cancelText="No, Keep it"
          onConfirm={() => {
            if (deleteModal.id) handleDelete(deleteModal.id)
            setDeleteModal({ isOpen: false, id: null })
          }}
          onCancel={() => setDeleteModal({ isOpen: false, id: null })}
        />
    </div>
  )
}
