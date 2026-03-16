"use client"

import { SingleImageUpload } from "../single-image-upload"

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

export function GlobalStoreSettings({ info, onChange }: GlobalStoreSettingsProps) {
  const updateInfo = (field: keyof GlobalStoreInfo, val: any) => onChange({ ...info, [field]: val })
  const updateSocial = (field: keyof GlobalStoreInfo['social_links'], val: string) => {
    onChange({ ...info, social_links: { ...info.social_links, [field]: val } })
  }

  return (
    <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
      <h2 className="text-xl font-bold mb-6">🏢 Global Store Identity</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid gap-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Store Name</label>
            <input 
              className="w-full border rounded-xl p-3 text-sm"
              value={info.name}
              onChange={(e) => updateInfo('name', e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Slogan / Footer Logo Text</label>
            <input 
              className="w-full border rounded-xl p-3 text-sm"
              value={info.slogan}
              onChange={(e) => updateInfo('slogan', e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Short Description (About Us)</label>
            <textarea 
              className="w-full border rounded-xl p-3 text-sm h-32"
              value={info.description}
              onChange={(e) => updateInfo('description', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Contact Email</label>
              <input className="w-full border rounded-xl p-3 text-sm" value={info.email} onChange={(e) => updateInfo('email', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Contact Phone</label>
              <input className="w-full border rounded-xl p-3 text-sm" value={info.phone} onChange={(e) => updateInfo('phone', e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Physical Address</label>
            <input className="w-full border rounded-xl p-3 text-sm" value={info.address} onChange={(e) => updateInfo('address', e.target.value)} />
          </div>

          <div className="pt-4 space-y-4">
             <h3 className="text-xs font-bold text-neutral-900 border-b pb-2">Social Media Links</h3>
             <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(info.social_links).map(([platform, link]) => (
                  <div key={platform} className="grid gap-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">{platform}</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2 text-xs"
                      value={link}
                      onChange={(e) => updateSocial(platform as any, e.target.value)}
                    />
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
