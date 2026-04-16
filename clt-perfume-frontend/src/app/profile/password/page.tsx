"use client"

import { signOut } from "@/app/auth/actions"

export default function PasswordPage() {
  return (
    <section>
      <h2 className="mb-3 font-serif text-2xl text-neutral-900">Security</h2>
      <p className="mb-6 text-sm text-neutral-600">You can manage your password settings here. For security, we recommend regular updates.</p>
      
      <div className="rounded-xl bg-neutral-50 p-6 border border-neutral-100 uppercase tracking-widest text-[10px] font-bold text-neutral-400 text-center">
         Password change functionality coming soon
      </div>
    </section>
  )
}
