import { ReactNode } from "react"

interface ContentCardProps {
  title: string
  paragraphs?: string[]
  children?: ReactNode
  highlight?: boolean
}

export function ContentCard({ title, paragraphs = [], children, highlight = false }: ContentCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-8 ${
        highlight
          ? "border-black bg-[linear-gradient(180deg,#1f1f1f,#070707)] text-white"
          : "border-black/10 bg-white text-black"
      }`}
    >
      <div className={`pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full blur-2xl ${highlight ? "bg-white/10" : "bg-black/5"}`} />
      <div className="relative">
        <h2 className="font-serif text-2xl md:text-3xl">{title}</h2>
      </div>
      <div
        className={`relative mt-4 space-y-4 text-sm leading-relaxed md:text-base ${
          highlight ? "text-neutral-200" : "text-neutral-700"
        }`}
      >
        {paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
        {children}
      </div>
    </article>
  )
}
