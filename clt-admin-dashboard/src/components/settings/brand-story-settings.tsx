"use client"

import { useState } from "react"
import { SingleImageUpload } from "@/components/single-image-upload"
import { BrandPreview } from "@/components/preview/brand-preview"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface BrandStorySettingsProps {
  story: any
  onChange: (story: any) => void
}

export function BrandStorySettings({ story, onChange }: BrandStorySettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const updateFeature = (idx: number, field: string, value: string) => {
    const nextFeatures = [...story.features]
    nextFeatures[idx] = { ...nextFeatures[idx], [field]: value }
    onChange({ ...story, features: nextFeatures })
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-neutral-900">Brand Story Preview</h2>
          <p className="mt-1 text-sm text-neutral-500">The core philosophy section of your homepage.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-full">
          Edit Content
        </Button>
      </div>

      <BrandPreview story={story} onEditClick={() => setIsModalOpen(true)} />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Edit Brand Story</DialogTitle>
            <DialogDescription>
              Modify the philosophy text, main image, and key brand features.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Main Title (HTML)</label>
                <input 
                  className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all" 
                  value={story.title} 
                  onChange={(e) => onChange({ ...story, title: e.target.value })} 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Long Description</label>
                <textarea 
                  className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-sm h-32 focus:ring-2 focus:ring-black outline-none transition-all resize-none" 
                  value={story.description} 
                  onChange={(e) => onChange({ ...story, description: e.target.value })} 
                />
              </div>
              
              <SingleImageUpload 
                label="Main Philosophy Image"
                value={story.image} 
                onUpload={(url) => onChange({ ...story, image: url })} 
                onRemove={() => onChange({ ...story, image: "" })}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Core Features</label>
              <div className="grid gap-4">
                {story.features?.map((feat: any, idx: number) => (
                  <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold">{idx + 1}</span>
                       <input 
                        className="w-full text-xs font-bold bg-transparent outline-none focus:border-black border-b border-transparent transition-all" 
                        value={feat.title} 
                        placeholder="Feature Title" 
                        onChange={(e) => updateFeature(idx, 'title', e.target.value)} 
                       />
                    </div>
                    <textarea 
                      className="w-full text-[11px] bg-transparent h-16 outline-none resize-none px-7" 
                      value={feat.text} 
                      placeholder="Describe this feature..." 
                      onChange={(e) => updateFeature(idx, 'text', e.target.value)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="px-8 rounded-full">
              Finish Editing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
