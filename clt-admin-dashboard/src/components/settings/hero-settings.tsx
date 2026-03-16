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
    <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🖼️ Hero Section Banners</h2>
      <div className="grid md:grid-cols-3 gap-6">
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
