"use client"

import { NavSection } from "@/lib/admin-api"
import { SingleImageUpload } from "@/components/single-image-upload"

interface NavSettingsProps {
  navigation: { mens: NavSection; womens: NavSection }
  onUpdate: (type: 'mens' | 'womens', field: keyof NavSection, value: any) => void
}

export function NavSettings({ navigation, onUpdate }: NavSettingsProps) {
  return (
    <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🧭 Mega Menu Navigation</h2>
      <div className="grid lg:grid-cols-2 gap-8">
        {(['mens', 'womens'] as const).map((gender) => (
          <div key={gender} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
            <h3 className="text-lg font-bold uppercase mb-4 text-center border-b pb-2">{gender} Collection Menu</h3>
            
            <div className="mb-6">
              <p className="text-xs font-bold mb-2 uppercase text-neutral-400">Categories (Comma separated)</p>
              <textarea 
                className="w-full border border-neutral-300 rounded-lg p-3 text-xs h-24"
                value={navigation[gender].categories.join(', ')}
                onChange={(e) => onUpdate(gender, 'categories', e.target.value.split(',').map((s: string) => s.trim()))}
              />
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold mb-2 uppercase text-neutral-400">Scent Notes</p>
              <div className="grid grid-cols-2 gap-3">
                {navigation[gender].notes.map((note, nIdx) => (
                  <div key={nIdx} className="bg-white p-3 rounded-lg border border-neutral-200">
                    <input className="w-full border-b mb-1 text-[10px] font-bold" value={note.name} onChange={(e) => {
                      const next = [...navigation[gender].notes]; next[nIdx].name = e.target.value; onUpdate(gender, 'notes', next)
                    }} />
                    <SingleImageUpload 
                      value={note.image} 
                      onUpload={(url) => {
                        const next = [...navigation[gender].notes]; next[nIdx].image = url; onUpdate(gender, 'notes', next)
                      }} 
                      onRemove={() => {
                        const next = [...navigation[gender].notes]; next[nIdx].image = ""; onUpdate(gender, 'notes', next)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
