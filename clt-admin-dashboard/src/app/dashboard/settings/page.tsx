"use client"

import { useEffect, useState } from "react"
import {
  getSiteSettings,
  updateSiteSettings,
  SiteSettings,
  NavSection,
  NavCategory,
} from "@/lib/admin-api"
import { HeroSettings } from "@/components/settings/hero-settings"
import { BrandStorySettings } from "@/components/settings/brand-story-settings"
import { CollectionsSettings } from "@/components/settings/collections-settings"
import { PocketFriendlySettings } from "@/components/settings/pocket-friendly-settings"
import { GlobalStoreSettings } from "@/components/settings/global-store-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

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

function normalizeSettings(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    navigation: normalizeNavigation(settings.navigation),
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const siteSettings = await getSiteSettings()
        const normalized = normalizeSettings(siteSettings)
        setSettings(normalized)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings")
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
      setError(null)
      setSuccess(false)
      await updateSiteSettings(settings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
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
    <div className="mx-auto grid max-w-[1100px] gap-5 px-4 pb-24 pt-4 sm:px-6">
      <Card className="relative overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-neutral-200/50 blur-3xl" />
        <CardHeader className="relative">
          <p className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">CLE Perfumes</p>
          <CardTitle className="mt-3 text-3xl sm:text-4xl">Homepage Settings Studio</CardTitle>
          <CardDescription className="mt-3 max-w-2xl font-light">
            Responsive and clean settings editor for your frontend homepage content.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="sticky top-3 z-20 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <a href="#ticker" className={sectionLinkClass}>Ticker</a>
            <a href="#hero" className={sectionLinkClass}>Hero</a>
            <a href="#pocket" className={sectionLinkClass}>Pocket</a>
            <a href="#store" className={sectionLinkClass}>Store Info</a>
            <a href="#brand" className={sectionLinkClass}>Brand Story</a>
            <a href="#collections" className={sectionLinkClass}>Collections</a>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Apply All Changes"}
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-medium">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-200 font-medium">✨ Website updated successfully!</div>}

      <div className="grid gap-8">
        {/* Ticker Settings */}
        <Card id="ticker">
          <CardHeader>
            <CardTitle>Top Scrolling Announcement</CardTitle>
            <CardDescription>Controls the moving text bar on top of the homepage.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
            className="h-24"
            value={settings?.ticker_text || ""}
            onChange={(e) => setSettings((prev) => (prev ? ({ ...prev, ticker_text: e.target.value }) : null))}
            placeholder="Enter the text that scrolls at the top..."
          />
          </CardContent>
        </Card>

        {settings && (
          <>
            <div id="hero">
              <HeroSettings 
                slides={settings.hero_slides} 
                onChange={(slides) => setSettings({ ...settings, hero_slides: slides })} 
              />
            </div>

            <div id="pocket">
              <PocketFriendlySettings 
                configs={settings.pocket_friendly_configs}
                onChange={(configs) => setSettings({ ...settings, pocket_friendly_configs: configs })}
              />
            </div>

            <div id="store">
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
                onChange={(info) => setSettings({ ...settings, global_store_info: info })}
              />
            </div>

            <div id="brand">
              <BrandStorySettings 
                story={settings.brand_story} 
                onChange={(story) => setSettings({ ...settings, brand_story: story })} 
              />
            </div>

            <div id="collections">
              <CollectionsSettings 
                collections={settings.collections} 
                offers={settings.offers}
                onCollectionsChange={(cols) => setSettings({ ...settings, collections: cols })}
                onOffersChange={(offers) => setSettings({ ...settings, offers })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
