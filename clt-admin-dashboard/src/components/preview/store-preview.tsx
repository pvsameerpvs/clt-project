"use client"

import { Facebook, Instagram, Twitter, Youtube, Linkedin, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"

const SOCIAL_LINK_KEYS = ["instagram", "facebook", "twitter", "youtube", "linkedin", "tiktok"] as const
const socialIconClassName = "h-3 w-3"

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.6 3c.3 2.1 1.5 3.4 3.6 3.6v3.1c-1.2.1-2.4-.3-3.6-1v5.7c0 3.1-2.1 5.6-5.3 5.6-3 0-5.5-2.1-5.5-5.1 0-3.4 3.2-5.7 6.5-4.9v3.2c-1.4-.4-3.2.2-3.2 1.8 0 1.1.9 1.9 2 1.9 1.4 0 2.2-.8 2.2-2.5V3h3.3Z" />
    </svg>
  )
}

function renderSocialIcon(platform: (typeof SOCIAL_LINK_KEYS)[number]) {
  if (platform === "instagram") return <Instagram className={socialIconClassName} />
  if (platform === "facebook") return <Facebook className={socialIconClassName} />
  if (platform === "twitter") return <Twitter className={socialIconClassName} />
  if (platform === "youtube") return <Youtube className={socialIconClassName} />
  if (platform === "linkedin") return <Linkedin className={socialIconClassName} />
  return <TikTokIcon className={socialIconClassName} />
}

interface StoreInfo {
  slogan?: string
  description?: string
  email?: string
  phone?: string
  address?: string
  social_links?: Partial<Record<(typeof SOCIAL_LINK_KEYS)[number], string>>
  social_links_enabled?: Partial<Record<(typeof SOCIAL_LINK_KEYS)[number], boolean>>
}

interface StorePreviewProps {
  info: StoreInfo
  onEditClick: () => void
}

export function StorePreview({ info, onEditClick }: StorePreviewProps) {
  const socialLinks = info?.social_links || {}

  return (
    <div className="group relative">
      <footer className="bg-black text-white rounded-3xl overflow-hidden border border-neutral-800">
        <div className="p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-serif tracking-widest text-white">
                {info?.slogan || "CLE PERFUMES."}
              </h3>
              <p className="max-w-md font-light leading-relaxed text-neutral-400 text-xs text-justify">
                {info?.description || "Elevating the everyday with scents that define your presence."}
              </p>
              
              <div className="flex gap-3 pt-2">
                {SOCIAL_LINK_KEYS.map((platform) => {
                  const link = socialLinks[platform]
                  const isEnabled = info?.social_links_enabled?.[platform] !== false

                  return link && isEnabled ? (
                     <div key={platform} className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-[10px]">
                        {renderSocialIcon(platform)}
                     </div>
                   ) : null
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-[10px] text-neutral-400">
               <div className="space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-widest">Contact</h4>
                  <p>{info?.email}</p>
                  <p>{info?.phone}</p>
               </div>
               <div className="space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-widest">Location</h4>
                  <p>{info?.address}</p>
               </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Edit Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-3xl z-20 pointer-events-none group-hover:pointer-events-auto">
         <Button 
            className="flex items-center gap-2 rounded-full bg-white px-8 py-6 text-black hover:bg-neutral-200 shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300"
            onClick={onEditClick}
         >
            <Edit3 className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Edit Store Identity</span>
         </Button>
      </div>
    </div>
  )
}
