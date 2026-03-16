"use client"

import { useEffect, useState } from "react"
import { getSiteSettings, updateSiteSettings, SiteSettings, NavSection } from "@/lib/admin-api"
import { HeroSettings } from "@/components/settings/hero-settings"
import { NavSettings } from "@/components/settings/nav-settings"
import { BrandStorySettings } from "@/components/settings/brand-story-settings"
import { CollectionsSettings } from "@/components/settings/collections-settings"
import { PocketFriendlySettings } from "@/components/settings/pocket-friendly-settings"
import { GlobalStoreSettings } from "@/components/settings/global-store-settings"

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setSettings(await getSiteSettings())
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

  const updateNav = (type: 'mens' | 'womens', field: keyof NavSection, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      navigation: {
        ...settings.navigation,
        [type]: { ...settings.navigation[type], [field]: value }
      }
    })
  }

  if (loading) return <div className="p-8 text-neutral-400 font-medium">Synchronizing settings with database...</div>

  return (
    <div className="grid gap-6 p-6 max-w-6xl mx-auto pb-24">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Store Content Manager</h1>
          <p className="text-sm text-neutral-500">Control images, text, and navigation live on your website.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-lg"
        >
          {saving ? "Saving..." : "Apply All Changes"}
        </button>
      </header>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-medium">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-200 font-medium">✨ Website updated successfully!</div>}

      <div className="grid gap-12">
        {/* Ticker Settings */}
        <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">📢 Top Scrolling Announcement</h2>
          <textarea 
            className="w-full border border-neutral-300 rounded-xl p-4 h-24 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
            value={settings?.ticker_text || ""}
            onChange={(e) => setSettings(s => s ? ({ ...s, ticker_text: e.target.value }) : null)}
            placeholder="Enter the text that scrolls at the top..."
          />
        </section>

        {settings && (
          <>
            <HeroSettings 
              slides={settings.hero_slides} 
              onChange={(slides) => setSettings({ ...settings, hero_slides: slides })} 
            />

            <PocketFriendlySettings 
              configs={settings.pocket_friendly_configs}
              onChange={(configs) => setSettings({ ...settings, pocket_friendly_configs: configs })}
            />

            <NavSettings 
              navigation={settings.navigation} 
              onUpdate={updateNav} 
            />

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

            <BrandStorySettings 
              story={settings.brand_story} 
              onChange={(story) => setSettings({ ...settings, brand_story: story })} 
            />

            <CollectionsSettings 
              collections={settings.collections} 
              offers={settings.offers}
              onCollectionsChange={(cols) => setSettings({ ...settings, collections: cols })}
              onOffersChange={(offers) => setSettings({ ...settings, offers: offers })}
            />
          </>
        )}
      </div>
    </div>
  )
}
