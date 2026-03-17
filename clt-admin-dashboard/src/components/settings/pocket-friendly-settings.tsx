"use client"

import { useState } from "react"
import { PocketPreview } from "@/components/preview/pocket-preview"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface PocketFriendlySettingsProps {
  configs: number[]
  onChange: (configs: number[]) => void
}

export function PocketFriendlySettings({ configs, onChange }: PocketFriendlySettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const addPoint = () => onChange([...configs, 0])
  const removePoint = (index: number) => onChange(configs.filter((_, i) => i !== index))
  const updatePoint = (index: number, val: string) => {
    const newConfigs = [...configs]
    newConfigs[index] = Number(val)
    onChange(newConfigs)
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-neutral-900">Pocket-Friendly Preview</h2>
          <p className="mt-1 text-sm text-neutral-500">Quick price filter cards on homepage.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-full">
          Edit Thresholds
        </Button>
      </div>

      <PocketPreview configs={configs} onEditClick={() => setIsModalOpen(true)} />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Edit Price Thresholds</DialogTitle>
            <DialogDescription>
              Add or remove the price points displayed in the &quot;Pocket&quot; section.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-4 mt-6">
            {configs.map((price, index) => (
              <div key={index} className="flex gap-2 items-center bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Under</span>
                <input 
                  type="number"
                  className="w-16 border-b border-neutral-300 bg-transparent text-center font-bold outline-none focus:border-black transition-colors"
                  value={price}
                  onChange={(e) => updatePoint(index, e.target.value)}
                />
                <span className="text-[10px] font-bold text-neutral-400 uppercase">AED</span>
                <button 
                  onClick={() => removePoint(index)}
                  className="ml-2 text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            <button 
              onClick={addPoint}
              className="border-2 border-dashed border-neutral-200 p-4 rounded-2xl text-[10px] font-bold text-neutral-400 hover:border-black hover:text-black transition-all flex flex-col items-center justify-center gap-1 min-w-[100px]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Point</span>
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="px-8 rounded-full">
              Apply Thresholds
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
