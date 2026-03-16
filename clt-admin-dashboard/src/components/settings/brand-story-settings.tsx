"use client"

import { SingleImageUpload } from "@/components/single-image-upload"

interface BrandStorySettingsProps {
  story: any
  onChange: (story: any) => void
}

export function BrandStorySettings({ story, onChange }: BrandStorySettingsProps) {
  const updateFeature = (idx: number, field: string, value: string) => {
    const nextFeatures = [...story.features]
    nextFeatures[idx] = { ...nextFeatures[idx], [field]: value }
    onChange({ ...story, features: nextFeatures })
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-2xl font-serif text-neutral-900">Brand Story Section</h2>
      <p className="mt-1 text-sm text-neutral-500">Controls the dark philosophy block and story features.</p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <label className="text-xs font-bold text-neutral-400 uppercase">Main Title</label>
          <input className="w-full border border-neutral-300 rounded-lg p-3 text-sm font-bold" value={story.title} onChange={(e) => onChange({ ...story, title: e.target.value })} />
          
          <label className="text-xs font-bold text-neutral-400 uppercase">Description</label>
          <textarea className="w-full border border-neutral-300 rounded-lg p-3 text-sm h-32" value={story.description} onChange={(e) => onChange({ ...story, description: e.target.value })} />
          
          <SingleImageUpload 
            label="Philosophy Image"
            value={story.image} 
            onUpload={(url) => onChange({ ...story, image: url })} 
            onRemove={() => onChange({ ...story, image: "" })}
          />
        </div>
        <div className="grid gap-4">
           <label className="text-xs font-bold text-neutral-400 uppercase">Key Features</label>
          {story.features.map((feat: any, idx: number) => (
            <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <input className="w-full border-b mb-2 text-xs font-bold bg-transparent outline-none focus:border-black" value={feat.title} placeholder="Feature Title" onChange={(e) => updateFeature(idx, 'title', e.target.value)} />
              <textarea className="w-full text-xs bg-transparent h-12 outline-none" value={feat.text} placeholder="Feature Description" onChange={(e) => updateFeature(idx, 'text', e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
