"use client"

import React from "react"
import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import { ProfileProvider, useProfile } from "@/contexts/profile-context"
import { Loader2 } from "lucide-react"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <ProfileLayoutContent>{children}</ProfileLayoutContent>
    </ProfileProvider>
  )
}

function ProfileLayoutContent({ children }: { children: React.ReactNode }) {
  const { initials, fullName, user } = useProfile()

  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="mb-6 font-serif text-3xl text-neutral-900 md:text-4xl">Profile</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <ProfileSidebar initials={initials} fullName={fullName} />

          <main className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-7 min-h-[500px]">
            {user ? children : (
              <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
