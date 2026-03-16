"use client"

import { useEffect, useState } from "react"
import { Category, getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from "@/lib/admin-api"
import { CategoryForm } from "@/components/categories/category-form"
import { CategoryList } from "@/components/categories/category-list"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Category>>({})

  async function load() {
    try {
      setLoading(true)
      setCategories(await getAdminCategories())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.slug) return setError("Name and Slug are required")

    try {
      setSaving(true)
      setError(null)
      if (form.id) {
        await updateAdminCategory(form.id, form)
      } else {
        await createAdminCategory(form)
      }
      setForm({})
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure? This won't delete products, but they will become uncategorized.")) return
    try {
      await deleteAdminCategory(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category")
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
        <p className="text-neutral-500 mt-1">Manage the collections and groupings for your fragrance catalog.</p>
      </header>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-medium">{error}</div>}

      <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
        <CategoryForm 
          form={form} 
          setForm={setForm} 
          onSubmit={handleSubmit} 
          onClear={() => setForm({})} 
          saving={saving} 
        />
        
        <CategoryList 
          categories={categories} 
          loading={loading} 
          onEdit={setForm} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  )
}
