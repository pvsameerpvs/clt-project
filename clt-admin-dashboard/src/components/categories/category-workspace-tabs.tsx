"use client"

export type CategoryWorkspaceTab = "new" | "existing" | "mega"

interface CategoryWorkspaceTabsProps {
  activeTab: CategoryWorkspaceTab
  onTabChange: (tab: CategoryWorkspaceTab) => void
  totalCategories: number
  topLevelCategories: number
}

const tabConfig: Array<{
  key: CategoryWorkspaceTab
  title: string
  subtitle: string
}> = [
  {
    key: "new",
    title: "New Collection",
    subtitle: "Create or edit category",
  },
  {
    key: "existing",
    title: "Existing Collections",
    subtitle: "Browse and manage list",
  },
  {
    key: "mega",
    title: "Mega Menu Navigation",
    subtitle: "Notes and right banners",
  },
]

export function CategoryWorkspaceTabs({
  activeTab,
  onTabChange,
  totalCategories,
  topLevelCategories,
}: CategoryWorkspaceTabsProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 font-semibold uppercase tracking-[0.12em] text-neutral-700">
          Total: {totalCategories}
        </span>
        <span className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 font-semibold uppercase tracking-[0.12em] text-neutral-700">
          Top-Level: {topLevelCategories}
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {tabConfig.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.key)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active
                  ? "border-black bg-black text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
              }`}
            >
              <p className="text-sm font-semibold">{tab.title}</p>
              <p className={`mt-1 text-xs ${active ? "text-neutral-300" : "text-neutral-500"}`}>{tab.subtitle}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

