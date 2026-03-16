"use client"

import { SingleImageUpload } from "@/components/single-image-upload"

interface HeroSettingsProps {
  slides: any[]
  onChange: (slides: any[]) => void
}

export function HeroSettings({ slides, onChange }: HeroSettingsProps) {
  const updateSlide = (idx: number, field: string, value: any) => {
    const next = [...slides]
    next[idx] = { ...next[idx], [field]: value }
    onChange(next)
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-2xl font-serif text-neutral-900">Hero Section Banners</h2>
      <p className="mt-1 text-sm text-neutral-500">Update hero images, tagline and headline shown first on homepage.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {slides.map((slide, idx) => (
          <div key={idx} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 grid gap-4 relative">
            <span className="absolute -top-3 -left-3 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-md">{idx + 1}</span>
            <SingleImageUpload 
              value={slide.image} 
              onUpload={(url) => updateSlide(idx, 'image', url)}
              onRemove={() => updateSlide(idx, 'image', "")}
            />
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tagline</label>
              <input className="w-full border border-neutral-300 rounded-lg p-2 text-xs" placeholder="e.g. New Arrival" value={slide.tagline} onChange={(e) => updateSlide(idx, 'tagline', e.target.value)} />
              
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Headline (HTML)</label>
              <textarea className="w-full border border-neutral-300 rounded-lg p-2 text-xs h-16" placeholder="Main Headline" value={slide.headline} onChange={(e) => updateSlide(idx, 'headline', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
