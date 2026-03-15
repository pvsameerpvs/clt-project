"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  AdminProduct,
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
} from "@/lib/admin-api"

type ProductFormState = {
  id?: string
  name: string
  slug: string
  price: string
  stock: string
  is_active: boolean
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  slug: "",
  price: "",
  stock: "",
  is_active: true,
}

function getCategoryName(product: AdminProduct) {
  if (!product.category) return "Uncategorized"
  if (Array.isArray(product.category)) return product.category[0]?.name || "Uncategorized"
  return product.category.name || "Uncategorized"
}

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0)),
    [products]
  )

  async function loadProducts() {
    try {
      setLoading(true)
      setError(null)
      setProducts(await getAdminProducts())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSaving(true)
      setError(null)

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        is_active: form.is_active,
      }

      if (!payload.name || !payload.slug) {
        throw new Error("Name and slug are required.")
      }

      if (form.id) {
        await updateAdminProduct(form.id, payload)
      } else {
        await createAdminProduct(payload)
      }

      setForm(EMPTY_FORM)
      await loadProducts()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save product")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(productId: string) {
    const confirmed = window.confirm("Delete this product?")
    if (!confirmed) return

    try {
      setError(null)
      await deleteAdminProduct(productId)
      setProducts((prev) => prev.filter((item) => item.id !== productId))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete product")
    }
  }

  function startEdit(product: AdminProduct) {
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      is_active: product.is_active !== false,
    })
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Products</h1>
        <button onClick={loadProducts} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
          Refresh
        </button>
      </header>

      {error && (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: 12, padding: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
        <form
          onSubmit={handleSubmit}
          style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff", display: "grid", gap: 10, height: "fit-content" }}
        >
          <h3 style={{ margin: 0 }}>{form.id ? "Edit Product" : "Create Product"}</h3>

          <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={{ border: "1px solid #d1d5db", borderRadius: 10, padding: 9 }} />
          <input placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} style={{ border: "1px solid #d1d5db", borderRadius: 10, padding: 9 }} />
          <input type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} style={{ border: "1px solid #d1d5db", borderRadius: 10, padding: 9 }} />
          <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} style={{ border: "1px solid #d1d5db", borderRadius: 10, padding: 9 }} />

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            Product is active
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ border: "none", background: "#111", color: "#fff", borderRadius: 10, padding: "9px 12px", cursor: "pointer" }}>
              {saving ? "Saving..." : form.id ? "Update" : "Create"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(EMPTY_FORM)}
                style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, padding: "9px 12px", cursor: "pointer" }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff", overflowX: "auto" }}>
          {loading ? (
            <p style={{ margin: 0, color: "#6b7280" }}>Loading products...</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", fontSize: 12, color: "#6b7280" }}>
                  <th style={{ padding: "8px 4px" }}>Product</th>
                  <th style={{ padding: "8px 4px" }}>Category</th>
                  <th style={{ padding: "8px 4px" }}>Price</th>
                  <th style={{ padding: "8px 4px" }}>Stock</th>
                  <th style={{ padding: "8px 4px" }}>Status</th>
                  <th style={{ padding: "8px 4px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 4px" }}>
                      <div style={{ fontWeight: 600 }}>{product.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>/{product.slug}</div>
                    </td>
                    <td style={{ padding: "10px 4px" }}>{getCategoryName(product)}</td>
                    <td style={{ padding: "10px 4px" }}>AED {Number(product.price || 0).toLocaleString()}</td>
                    <td style={{ padding: "10px 4px" }}>{product.stock || 0}</td>
                    <td style={{ padding: "10px 4px" }}>{product.is_active === false ? "Inactive" : "Active"}</td>
                    <td style={{ padding: "10px 4px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(product)} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(product.id)} style={{ border: "1px solid #fecaca", color: "#dc2626", background: "#fff", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
