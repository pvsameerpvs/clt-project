import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

interface RelatedPage {
  title: string
  href: string
  description: string
}

interface RelatedPagesProps {
  title?: string
  pages: RelatedPage[]
}

export function RelatedPages({ title = "Explore More", pages }: RelatedPagesProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-serif text-2xl md:text-3xl">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page, index) => (
          <Link
            key={page.href}
            href={page.href}
            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-black/25 hover:shadow-[0_24px_40px_-28px_rgba(0,0,0,0.55)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/30 to-transparent" />
            <span className="pointer-events-none absolute right-5 top-5 rounded-full border border-black/10 bg-white/80 px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-neutral-500 shadow-sm">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-neutral-500">
              Company Page
            </div>

            <div className="flex items-start justify-between gap-3">
              <h3 className="pr-8 font-serif text-[22px] leading-snug text-neutral-900">{page.title}</h3>
              <ArrowUpRight className="h-4 w-4 text-neutral-500 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black" />
            </div>
            <p className="mt-3 min-h-14 text-sm leading-relaxed text-neutral-600">{page.description}</p>

            <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700">View Page</span>
              <span className="h-px w-10 bg-black/30 transition-all duration-300 group-hover:w-14 group-hover:bg-black/60" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
