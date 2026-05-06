"use client"

import { useState } from "react"
import { StorePreview } from "@/components/preview/store-preview"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface GlobalStoreInfo {
  name: string
  slogan: string
  description: string
  email: string
  phone: string
  address: string
  social_links: {
    instagram: string
    facebook: string
    twitter: string
    youtube: string
    linkedin: string
  }
}

interface GlobalStoreSettingsProps {
  info: GlobalStoreInfo
  onChange: (info: GlobalStoreInfo) => void
}

const SOCIAL_LINK_KEYS = ["instagram", "facebook", "twitter", "youtube", "linkedin"] as const

export function GlobalStoreSettings({ info, onChange }: GlobalStoreSettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const updateInfo = <T extends keyof GlobalStoreInfo>(field: T, val: GlobalStoreInfo[T]) => {
    onChange({ ...info, [field]: val })
  }

  const updateSocial = (field: keyof GlobalStoreInfo['social_links'], val: string) => {
    onChange({ ...info, social_links: { ...info.social_links, [field]: val } })
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-neutral-900">Global Store Preview</h2>
          <p className="mt-1 text-sm text-neutral-500">Footer and contact information UI.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-full">
          Edit Identity
        </Button>
      </div>

      <StorePreview info={info} onEditClick={() => setIsModalOpen(true)} />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Edit Store Identity</DialogTitle>
            <DialogDescription>
              Manage your brand name, slogan, contact details, and social presence.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Store Name</label>
                <input 
                  className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                  value={info.name}
                  onChange={(e) => updateInfo('name', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Slogan / Footer Logo Text</label>
                <input 
                  className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                  value={info.slogan}
                  onChange={(e) => updateInfo('slogan', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">About Us (Short Description)</label>
                <textarea 
                  className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-sm h-32 focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                  value={info.description}
                  onChange={(e) => updateInfo('description', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Email</label>
                  <input className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-sm" value={info.email} onChange={(e) => updateInfo('email', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Phone</label>
                  <input className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-sm" value={info.phone} onChange={(e) => updateInfo('phone', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Physical Address</label>
                <input className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-sm" value={info.address} onChange={(e) => updateInfo('address', e.target.value)} />
              </div>

              <div className="pt-4 space-y-4">
                 <h3 className="text-xs font-bold text-neutral-900 border-b pb-2 uppercase tracking-widest px-1">Social Media Links</h3>
                 <div className="grid sm:grid-cols-2 gap-4">
                    {SOCIAL_LINK_KEYS.map((platform) => (
                      <div key={platform} className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">{platform}</label>
                        <input 
                          className="w-full border border-neutral-200 bg-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-black outline-none transition-all"
                          value={info.social_links[platform]}
                          onChange={(e) => updateSocial(platform, e.target.value)}
                        />
                      </div>
                    ))}
                 </div>
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
