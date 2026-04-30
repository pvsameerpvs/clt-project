"use client"

import { useEffect, useState } from "react"
import {
  getSiteSettings,
  updateSiteSettings,
  SiteSettings,
  NavSection,
  NavCategory,
} from "@/lib/admin-api"
import { TickerPreview } from "@/components/preview/ticker-preview"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { HeroSettings } from "@/components/settings/hero-settings"
import { BrandStorySettings } from "@/components/settings/brand-story-settings"
import { CollectionsSettings } from "@/components/settings/collections-settings"
import { PocketFriendlySettings } from "@/components/settings/pocket-friendly-settings"
import { GlobalStoreSettings } from "@/components/settings/global-store-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

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
  const source = item as {
    name?: unknown
    slug?: unknown
    subcategories?: unknown
  }

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
  const categories = Array.isArray(source.categories)
    ? source.categories
        .map((category) => normalizeCategory(category))
        .filter((category): category is NavCategory => Boolean(category))
    : []

  return {
    categories,
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

function normalizeHeroHref(href: unknown) {
  const value = typeof href === "string" ? href.trim() : ""
  if (!value) return ""
  if (value.startsWith("/categories/")) return value.replace(/^\/categories\//, "/collections/")
  if (value.startsWith("/products/")) return value.replace(/^\/products\//, "/product/")
  if (!/^https?:\/\//i.test(value) && !value.startsWith("/")) return `/${value}`
  return value
}

function normalizeSettings(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    hero_slides: Array.isArray(settings.hero_slides)
      ? settings.hero_slides.map((slide) => ({
          ...slide,
          href: normalizeHeroHref(slide.href),
        }))
      : [],
    navigation: normalizeNavigation(settings.navigation),
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const siteSettings = await getSiteSettings()
        const normalized = normalizeSettings(siteSettings)
        setSettings(normalized)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!settings) return
    try {
      setSaving(true)
      await updateSiteSettings(settings)
      toast.success("Your changes are now live!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-10 text-sm text-neutral-500 shadow-sm">
          Synchronizing settings with database...
        </div>
      </div>
    )
  }

  const sectionLinkClass =
    "whitespace-nowrap rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-700 transition-colors hover:border-black hover:text-black"

  return (
    <div className="mx-auto grid max-w-7xl gap-6 pt-0">
      <Card className="relative overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-neutral-200/50 blur-3xl" />
        <CardHeader className="relative">
          <p className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 font-bold">CLE Perfume</p>
          <CardTitle className="mt-3 text-3xl sm:text-4xl">Homepage Settings Studio</CardTitle>
          <CardDescription className="mt-3 max-w-2xl font-light italic">
            Synchronize your visual presence and brand identity directly with your storefront.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 sm:-mx-8 sm:px-8 bg-neutral-50/80 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto border border-neutral-200 bg-white p-2 rounded-2xl shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <a href="#hero" className={sectionLinkClass}>Hero</a>
            <a href="#collections" className={sectionLinkClass}>Collections</a>
            <a href="#brand" className={sectionLinkClass}>Brand Story</a>
            <a href="#ticker" className={sectionLinkClass}>Ticker</a>
            <a href="#pocket" className={sectionLinkClass}>Pocket</a>
            <a href="#store" className={sectionLinkClass}>Store Info</a>
          </div>
          <Button onClick={handleSave} disabled={saving} className="rounded-full px-8 shadow-lg shadow-black/10">
            {saving ? "Saving Changes..." : "Publish Website"}
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-12 items-start">
        {/* Ordered Settings Flow */}
        <div className="space-y-12">
          {settings && (
            <>
              {/* 1. Announcement Bar */}
              <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm scroll-mt-32" id="ticker">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif text-neutral-900">1. Announcement Bar</h2>
                    <p className="mt-1 text-sm text-neutral-500 font-light">The scrolling text at the very top of your website.</p>
                  </div>
                  <Button onClick={() => setIsTickerModalOpen(true)} variant="outline" className="rounded-full px-6">
                    Edit Text
                  </Button>
                </div>

                <TickerPreview 
                  text={settings?.ticker_text || ""} 
                  onEditClick={() => setIsTickerModalOpen(true)} 
                />

                <Dialog open={isTickerModalOpen} onOpenChange={setIsTickerModalOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-serif">Edit Announcement</DialogTitle>
                      <DialogDescription>
                        This text scrolls continuously at the top of every page.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Announcement Text</label>
                        <textarea
                          className="w-full border border-neutral-200 bg-white rounded-2xl p-4 text-sm h-32 focus:ring-2 focus:ring-black outline-none transition-all resize-none font-medium"
                          value={settings?.ticker_text || ""}
                          onChange={(e) => setSettings((prev) => (prev ? ({ ...prev, ticker_text: e.target.value }) : null))}
                          placeholder="Enter the text that scrolls at the top..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t mt-6">
                      <Button onClick={() => setIsTickerModalOpen(false)} variant="secondary" className="px-8 rounded-full">
                        Apply Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </section>

              {/* 2. Live Hero Preview */}
              <div id="hero" className="scroll-mt-32">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif text-neutral-900">2. Live Hero Preview</h2>
                </div>
                <HeroSettings 
                  slides={settings.hero_slides} 
                  onChange={(slides) => setSettings(prev => prev ? ({ ...prev, hero_slides: slides }) : null)} 
                />
              </div>

              {/* 3. Curated Selections Preview */}
              <div id="collections" className="scroll-mt-32">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif text-neutral-900">3. Curated Selections Preview</h2>
                </div>
                <CollectionsSettings 
                  collections={settings.collections} 
                  offers={settings.offers}
                  onCollectionsChange={(cols) => setSettings(prev => prev ? ({ ...prev, collections: cols }) : null)}
                  onOffersChange={(offers) => setSettings(prev => prev ? ({ ...prev, offers }) : null)}
                />
              </div>

              {/* 4. Brand Story Preview */}
              <div id="brand" className="scroll-mt-32">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif text-neutral-900">4. Brand Story Preview</h2>
                </div>
                <BrandStorySettings 
                  story={settings.brand_story} 
                  onChange={(story) => setSettings(prev => prev ? ({ ...prev, brand_story: story }) : null)} 
                />
              </div>

              {/* 5. Pocket-Friendly Preview */}
              <div id="pocket" className="scroll-mt-32">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif text-neutral-900">5. Pocket-Friendly Preview</h2>
                </div>
                <PocketFriendlySettings 
                  configs={settings.pocket_friendly_configs}
                  onChange={(configs) => setSettings(prev => prev ? ({ ...prev, pocket_friendly_configs: configs }) : null)}
                />
              </div>

              {/* 6. Global Store Preview */}
              <div id="store" className="scroll-mt-32">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif text-neutral-900">6. Global Store Preview</h2>
                </div>
                <GlobalStoreSettings 
                  info={settings.global_store_info || {
                    name: "CLE PERFUMES",
                    slogan: "CLE PERFUMES.",
                    description: "",
                    email: "",
                    phone: "",
                    address: "",
                    social_links: { instagram: "", facebook: "", twitter: "", youtube: "", linkedin: "" }
                  }}
                  onChange={(info) => setSettings(prev => prev ? ({ ...prev, global_store_info: info }) : null)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
