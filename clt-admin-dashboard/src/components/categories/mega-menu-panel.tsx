"use client"

import { useMemo, useState } from "react"
import { Category, NavSection } from "@/lib/admin-api"
import { NavSettings } from "@/components/settings/nav-settings"

interface MegaMenuPanelProps {
  navigation: Record<string, NavSection> | null
  categories: Category[]
  sectionKeys: string[]
  onUpdate: (
    sectionKey: string,
    field: keyof NavSection,
    value: NavSection[keyof NavSection]
  ) => void
  onSave: () => Promise<void>
  saving: boolean
  success: boolean
}

export function MegaMenuPanel({
  navigation,
  categories,
  sectionKeys,
  onUpdate,
  onSave,
  saving,
  success,
}: MegaMenuPanelProps) {
  const [selectedSection, setSelectedSection] = useState<string>("")
  const activeSection =
    selectedSection && sectionKeys.includes(selectedSection) ? selectedSection : (sectionKeys[0] || "")
  const activeSections = activeSection ? [activeSection] : []
  const sectionCounts = useMemo(() => {
    const counts = new Map<string, { notes: number; banners: number }>()
    if (!navigation) return counts
    for (const key of sectionKeys) {
      const data = navigation[key]
      counts.set(key, {
        notes: Array.isArray(data?.notes) ? data.notes.length : 0,
        banners: Array.isArray(data?.banners) ? data.banners.length : 0,
      })
    }
    return counts
  }, [navigation, sectionKeys])

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h2 className="text-xl font-semibold">Mega Menu Navigation</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Shop By Category comes from Product Categories. Manage Shop By Notes and Right Banners here.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Quick Access Cards</p>
        <p className="mt-1 text-sm text-neutral-500">Select a menu card, edit notes/banners, then save.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {sectionKeys.map((sectionKey) => {
            const selected = activeSection === sectionKey
            const counts = sectionCounts.get(sectionKey) || { notes: 0, banners: 0 }
            return (
              <button
                key={sectionKey}
                type="button"
                onClick={() => setSelectedSection(sectionKey)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? "border-black bg-black text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.06em]">{sectionKey.replace(/-/g, " ")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.1em]">
                  <span className={`rounded-full border px-2 py-0.5 ${selected ? "border-white/40 text-white" : "border-neutral-300 text-neutral-600"}`}>
                    Notes: {counts.notes}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 ${selected ? "border-white/40 text-white" : "border-neutral-300 text-neutral-600"}`}>
                    Banners: {counts.banners}
                  </span>
                </div>
              </button>
            )
          })}
          {sectionKeys.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
              Create top-level categories first. Menu cards will appear here.
            </div>
          )}
        </div>
      </div>

      {navigation && (
        <NavSettings
          navigation={navigation}
          onUpdate={onUpdate}
          catalogCategories={categories}
          showCategoryControls={false}
          sections={activeSections}
          compact
        />
      )}

      <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-500">Save mega menu updates.</p>
        <button
          type="button"
          className="h-10 rounded-full bg-black px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Mega Menu"}
        </button>
      </div>

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
          Mega Menu settings updated successfully.
        </div>
      )}
    </section>
  )
}
