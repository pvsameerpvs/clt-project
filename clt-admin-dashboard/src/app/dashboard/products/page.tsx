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
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [viewFilter, setViewFilter] = useState<ProductViewFilter>("all")
  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

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

  async function loadProducts(preferredProductId?: string | null) {
    try {
      setLoading(true)
      setError(null)
 
      const [nextProducts, nextCategories] = await Promise.all([
        getAdminProducts(),
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
      setError(loadError instanceof Error ? loadError.message : "Unable to load products.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

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
    })
  }

  async function handleDelete(productId: string) {
    if (!window.confirm("Delete this product?")) return

    try {
      setError(null)
      await deleteAdminProduct(productId)

      if (form.id === productId) {
        setForm(EMPTY_PRODUCT_FORM)
      }

      const preferredId = selectedProductId === productId ? null : selectedProductId
      await loadProducts(preferredId)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete product.")
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSaving(true)
      setError(null)

      const payload = {
        name: form.name.trim(),
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
        category_id: form.category_id || null,
      }

      if (!payload.name || !payload.slug) {
        throw new Error("Name and slug are required.")
      }

      let savedProduct: AdminProduct
      if (form.id) {
        savedProduct = await updateAdminProduct(form.id, payload)
      } else {
        savedProduct = await createAdminProduct(payload)
      }

      setForm(EMPTY_PRODUCT_FORM)
      await loadProducts(savedProduct.id)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save product.")
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

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-neutral-500 mt-1">
            User-friendly product management with frontend-style preview before you publish.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setForm(EMPTY_PRODUCT_FORM)
              setSelectedProductId(null)
            }}
            className="bg-white border rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            type="button"
          >
            New Product
          </button>
          <button
            onClick={() => loadProducts()}
            className="bg-white border rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            type="button"
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">{error}</div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Total</p>
          <h3 className="mt-2 text-2xl font-semibold">{stats.total}</h3>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Active</p>
          <h3 className="mt-2 text-2xl font-semibold">{stats.activeProducts}</h3>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Inactive</p>
          <h3 className="mt-2 text-2xl font-semibold">{stats.inactiveProducts}</h3>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Low Stock</p>
          <h3 className="mt-2 text-2xl font-semibold">{stats.lowStock}</h3>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Featured Flags</p>
          <h3 className="mt-2 text-2xl font-semibold">{stats.flagged}</h3>
        </article>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)_minmax(300px,360px)] items-start">
        <ProductForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClear={() => {
            setForm(EMPTY_PRODUCT_FORM)
            setSelectedProductId(null)
          }}
          saving={saving}
          categories={categories}
        />

        <ProductList
          products={filteredProducts}
          loading={loading}
          selectedProductId={selectedProductId}
          onSelect={(product) => setSelectedProductId(product.id)}
          onEdit={startEdit}
          onDelete={handleDelete}
          query={query}
          setQuery={setQuery}
          viewFilter={viewFilter}
          setViewFilter={setViewFilter}
        />

        <ProductPreview product={previewProduct} isDraft={shouldPreviewForm} />
      </div>
    </div>
  )
}
