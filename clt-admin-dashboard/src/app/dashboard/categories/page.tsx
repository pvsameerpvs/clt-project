"use client"

import { useEffect, useState } from "react"
import {
  Category,
  AdminProduct,
  getAdminCategories,
  getAdminProducts,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getSiteSettings,
  updateSiteSettings,
  SiteSettings,
  NavSection,
  NavCategory,
} from "@/lib/admin-api"
import { CategoryForm } from "@/components/categories/category-form"
import { CategoryList } from "@/components/categories/category-list"
import {
  CategoryWorkspaceTabs,
  CategoryWorkspaceTab,
} from "@/components/categories/category-workspace-tabs"
import { MegaMenuPanel } from "@/components/categories/mega-menu-panel"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function normalizeCategory(item: unknown): NavCategory | null {
  if (typeof item === "string") {
    const name = item.trim()
    if (!name) return null
    return { name, slug: slugify(name), subcategories: [] }
  }

  if (!item || typeof item !== "object") return null
  const source = item as { name?: unknown; slug?: unknown; subcategories?: unknown }
  const name =
    typeof source.name === "string" && source.name.trim()
      ? source.name.trim()
      : typeof source.slug === "string"
        ? source.slug.replace(/-/g, " ").trim()
        : ""

  const slug =
    typeof source.slug === "string" && source.slug.trim()
      ? slugify(source.slug)
      : slugify(name)
  if (!name || !slug) return null

  const subcategories = Array.isArray(source.subcategories)
    ? source.subcategories
        .map((sub) => (typeof sub === "string" ? sub.trim() : ""))
        .filter(Boolean)
    : []

  return { name, slug, subcategories }
}

function normalizeNavSection(section: NavSection | unknown): NavSection {
  const source = (section && typeof section === "object" ? section : {}) as Partial<NavSection>

  return {
    categories: Array.isArray(source.categories)
      ? source.categories
          .map((item) => normalizeCategory(item))
          .filter((item): item is NavCategory => Boolean(item))
      : [],
    notes: Array.isArray(source.notes) ? source.notes : [],
    banners: Array.isArray(source.banners) ? source.banners : [],
  }
}

function normalizeNavigation(input: unknown): Record<string, NavSection> {
  if (!input || typeof input !== "object") return {}
  return Object.entries(input as Record<string, unknown>).reduce<Record<string, NavSection>>(
    (acc, [key, value]) => {
      acc[key] = normalizeNavSection(value)
      return acc
    },
    {}
  )
}

function ensureNavigationSections(navigation: Record<string, NavSection>, sectionKeys: string[]) {
  const next = { ...navigation }
  for (const sectionKey of sectionKeys) {
    if (!next[sectionKey]) {
      next[sectionKey] = { categories: [], notes: [], banners: [] }
    }
  }
  return next
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [navigation, setNavigation] = useState<SiteSettings["navigation"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingMenu, setSavingMenu] = useState(false)
  const [form, setForm] = useState<Partial<Category>>({})
  const [activeTab, setActiveTab] = useState<CategoryWorkspaceTab>("new")
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })

  async function load() {
    try {
      setLoading(true)
      const [nextCategories, nextProducts, settings] = await Promise.all([
        getAdminCategories(),
        getAdminProducts(),
        getSiteSettings(),
      ])
      setCategories(nextCategories)
      setProducts(nextProducts)
      const topLevelSlugs = nextCategories.filter((category) => !category.parent_id).map((category) => category.slug)
      const normalizedNavigation = normalizeNavigation(settings.navigation)
      setNavigation(ensureNavigationSections(normalizedNavigation, topLevelSlugs))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.slug) {
      toast.error("Name and Slug are required")
      return
    }

    try {
      setSaving(true)
      if (form.id) {
        await updateAdminCategory(form.id, form)
        toast.success("Category updated")
      } else {
        await createAdminCategory(form)
        toast.success("Category created")
      }
      setForm({})
      await load()
      setActiveTab("existing")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAdminCategory(id)
      toast.success("Category deleted")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category")
    }
  }

  const updateNav = (
    sectionKey: string,
    field: keyof NavSection,
    value: NavSection[keyof NavSection]
  ) => {
    setNavigation((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] || { categories: [], notes: [], banners: [] }),
          [field]: value,
        },
      }
    })
  }

  async function handleSaveMegaMenu() {
    if (!navigation) return
    try {
      setSavingMenu(true)
      await updateSiteSettings({ navigation })
      toast.success("Mega menu navigation saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save mega menu settings")
    } finally {
      setSavingMenu(false)
    }
  }

  const topLevelSlugs = categories.filter((category) => !category.parent_id).map((category) => category.slug)
  const sectionKeys = topLevelSlugs.length
    ? topLevelSlugs
    : navigation
      ? Object.keys(navigation)
      : []

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 sm:p-6">
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
          <p className="text-neutral-500 mt-1">
            Manage everything in tabs: New Collection, Existing Collections, and Mega Menu Navigation.
          </p>
        </header>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-700">How It Works</h2>
          <div className="mt-2 space-y-1 text-sm text-neutral-600">
            <p>1) Top-level category appears in navbar. Example: <span className="font-mono">men</span></p>
            <p>2) Any nested category appears under Shop By Category hierarchy.</p>
            <p>3) Assign products to leaf categories for precise filtering and menu placement.</p>
            <p>4) Shop By Notes and Right Banners are managed in the Mega Menu Navigation tab.</p>
          </div>
        </div>


        <CategoryWorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCategories={categories.length}
          topLevelCategories={topLevelSlugs.length}
        />

        {activeTab === "new" && (
          <CategoryForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onClear={() => setForm({})}
            saving={saving}
            categories={categories}
          />
        )}

        {activeTab === "existing" && (
          <CategoryList
            categories={categories}
            loading={loading}
            onEdit={(category) => {
              setForm(category)
              setActiveTab("new")
            }}
            onDelete={(id) => setDeleteModal({ isOpen: true, id })}
          />
        )}

        {activeTab === "mega" && (
          <MegaMenuPanel
            navigation={navigation}
            categories={categories}
            products={products}
            sectionKeys={sectionKeys}
            onUpdate={updateNav}
            onSave={handleSaveMegaMenu}
            saving={savingMenu}
            success={false}
          />
        )}

        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Category"
          message="Are you sure? This won't delete products, but they will become uncategorized."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={() => {
            if (deleteModal.id) handleDelete(deleteModal.id)
          }}
          onCancel={() => setDeleteModal({ isOpen: false, id: null })}
        />
      </section>
    </div>
  )
}
