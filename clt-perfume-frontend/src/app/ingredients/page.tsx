import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowUpRight,
  Beaker,
  Droplets,
  FlaskConical,
  Leaf,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks, perfumeIngredients } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "Ingredients | CLE Perfumes",
  description: "Full ingredients list for Cle DXB perfumes.",
}

const ingredientGroups = [
  {
    id: "base-composition",
    title: "Base Composition",
    note: "Core structure of the fragrance blend.",
    icon: Beaker,
    accent: "bg-neutral-300",
    items: ["ALCOHOL", "AQUA (WATER)", "PARFUM (FRAGRANCE)"],
  },
  {
    id: "aromatic-molecules",
    title: "Aromatic Molecules",
    note: "Key compounds contributing to the olfactive profile.",
    icon: Sparkles,
    accent: "bg-neutral-500",
    items: [
      "LINALOOL",
      "LINALYL ACETATE",
      "GERANIOL",
      "LIMONENE",
      "CITRONELLOL",
      "HYDROXYCITRONELLAL",
      "GERANYL ACETATE",
      "TERPINEOL",
      "PINENE",
      "CITRAL",
      "BETA-CARYOPHYLLENE",
      "TERPINOLENE",
      "ALPHA-TERPINENE",
      "FARNESOL",
    ],
  },
  {
    id: "functional-components",
    title: "Functional Components",
    note: "Support stability and formula performance.",
    icon: ShieldCheck,
    accent: "bg-neutral-700",
    items: [
      "CITRUS AURANTIUM BERGAMIA (BERGAMOT) PEEL OIL",
      "BUTYL METHOXYDIBENZOYLMETHANE",
      "PENTAERYTHRITYL TETRA-DI-T-BUTYL HYDROXYHYDROCINNAMATE",
    ],
  },
  {
    id: "colorants",
    title: "Colorants",
    note: "Color coding used in select compositions.",
    icon: Palette,
    accent: "bg-black",
    items: ["CI 19140 (YELLOW 5)", "CI 14700 (RED 4)", "CI 60730 (EXT. VIOLET 2)"],
  },
]

const qualityMetrics = [
  { label: "Total Ingredients", value: String(perfumeIngredients.length), icon: FlaskConical },
  { label: "Formula Type", value: "Eau De Parfum", icon: Droplets },
  { label: "Declared Transparently", value: "100%", icon: ShieldCheck },
  { label: "Formula Direction", value: "Clean Focus", icon: Leaf },
]

export default function IngredientsPage() {
  return (
    <div className="bg-white text-black">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/35 to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-4 h-56 w-56 rounded-full bg-black/[0.035] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-black/[0.035] blur-3xl" />

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-600">Ingredients Library</p>
            </div>

            <h1 className="font-serif text-3xl leading-tight text-neutral-900 md:text-5xl">
              Full Formula Transparency, Structured For Clarity
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-neutral-700 md:text-base">
              Cle DXB publishes the full perfume declaration in a premium, readable format. Review each ingredient
              category with confidence before selecting your fragrance.
            </p>

            <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Compliance Style</p>
                <p className="mt-1 font-serif text-lg text-neutral-900">INCI Naming</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">List Coverage</p>
                <p className="mt-1 font-serif text-lg text-neutral-900">{perfumeIngredients.length} Ingredients</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/clean-eau-de-parfum"
                className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-white hover:text-black"
              >
                Clean Eau De Parfum
                <ArrowUpRight className="h-3 w-3" />
              </Link>
              <Link
                href="/sustainability"
                className="rounded-full border border-neutral-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-700 transition hover:border-black hover:text-black"
              >
                Sustainability
              </Link>
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-black/10 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.45)] md:min-h-[440px]">
            <Image src="/curated-perfume-men.png" alt="Ingredients showcase" fill priority className="object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-black/0 to-white/35" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/35" />

            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/40 bg-white/80 px-3 py-2 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Sections</p>
                <p className="font-serif text-base text-neutral-900">4 Categories</p>
              </div>
              <div className="rounded-xl border border-white/40 bg-white/80 px-3 py-2 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Transparency</p>
                <p className="font-serif text-base text-neutral-900">Complete List</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {qualityMetrics.map((metric) => (
            <article key={metric.label} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <metric.icon className="h-4 w-4 text-neutral-500" />
              <p className="mt-2 font-serif text-xl text-neutral-900">{metric.value}</p>
              <p className="text-[11px] uppercase tracking-[0.15em] text-neutral-500">{metric.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 md:px-8">
        <div className="flex flex-wrap gap-2">
          {ingredientGroups.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 transition hover:border-black hover:text-black"
            >
              {group.title}
            </a>
          ))}
          <a
            href="#complete-declared-list"
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 transition hover:border-black hover:text-black"
          >
            Complete Declared List
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-serif text-2xl text-neutral-900 md:text-3xl">How To Read This List</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 md:text-base">
            <p>
              Ingredients are grouped by function so the list is easier to review while preserving full INCI naming.
            </p>
            <p>For sensitivity concerns, always patch test and review all ingredients before purchase.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {ingredientGroups.map((group, index) => (
            <article
              id={group.id}
              key={group.title}
              className="relative overflow-hidden rounded-3xl border border-black/10 bg-white p-5 shadow-sm md:p-6"
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${group.accent}`} />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700">
                    <group.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl text-neutral-900">{group.title}</h2>
                    <p className="mt-1 text-sm text-neutral-600">{group.note}</p>
                  </div>
                </div>
                <span className="rounded-full border border-neutral-200 px-2 py-1 text-[10px] font-semibold tracking-[0.17em] text-neutral-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-4 inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                {group.items.length} Ingredients
              </div>

              <ul className={`mt-5 grid grid-cols-1 gap-2 ${group.items.length > 6 ? "md:grid-cols-2" : ""}`}>
                {group.items.map((ingredient) => (
                  <li
                    key={ingredient}
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 transition hover:border-neutral-300 hover:shadow-sm"
                  >
                    {ingredient}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="complete-declared-list" className="mx-auto max-w-7xl px-4 pb-12 md:px-8 md:pb-16">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700">
                <FlaskConical className="h-4 w-4" />
              </span>
              <h2 className="font-serif text-2xl text-neutral-900 md:text-3xl">Complete Declared List</h2>
            </div>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
              {perfumeIngredients.length} Total
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
            {perfumeIngredients.map((ingredient, index) => (
              <div
                key={ingredient}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-[10px] font-semibold text-neutral-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-neutral-800">{ingredient}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) =>
          ["/clean-eau-de-parfum", "/sustainability", "/returns-refund-policy"].includes(item.href),
        )}
      />
    </div>
  )
}
