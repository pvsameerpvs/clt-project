import Image from "next/image"
import Link from "next/link"

interface HeroAction {
  label: string
  href: string
}

interface PageHeroProps {
  eyebrow: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  tags?: string[]
  primaryAction?: HeroAction
  secondaryAction?: HeroAction
}

export function PageHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  tags = [],
  primaryAction,
  secondaryAction,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-black/[0.03] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-64 w-64 rounded-full bg-black/[0.03] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/40 to-transparent" />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6 motion-safe:animate-[companyFadeUp_700ms_ease-out]">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/80 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-black" />
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-600">{eyebrow}</p>
          </div>
          <h1 className="font-serif text-3xl leading-tight text-neutral-900 md:text-5xl">{title}</h1>
          <p className="max-w-xl text-sm leading-relaxed text-neutral-700 md:text-base">{description}</p>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-700 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap gap-3 pt-2">
              {primaryAction ? (
                <Link
                  href={primaryAction.href}
                  className="rounded-full border border-black bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-transparent hover:text-black"
                >
                  {primaryAction.label}
                </Link>
              ) : null}
              {secondaryAction ? (
                <Link
                  href={secondaryAction.href}
                  className="rounded-full border border-neutral-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-700 transition hover:border-black hover:text-black"
                >
                  {secondaryAction.label}
                </Link>
              ) : null}
            </div>
          )}
        </div>

        <div className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-black/10 bg-neutral-100 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.35)] md:min-h-[420px] motion-safe:animate-[companyFadeUp_850ms_ease-out]">
          <Image src={imageSrc} alt={imageAlt} fill priority className="object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-black/0 to-white/30" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
        </div>
      </div>
    </section>
  )
}
