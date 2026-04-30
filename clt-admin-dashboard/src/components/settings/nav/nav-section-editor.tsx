"use client"

import { Plus } from "lucide-react"
import { ReactNode } from "react"

interface NavSectionEditorProps {
  title: string
  description: string
  onAdd: () => void
  addLabel: string
  children: ReactNode
}

export function NavSectionEditor({
  title,
  description,
  onAdd,
  addLabel,
  children,
}: NavSectionEditorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{title}</p>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-700 hover:border-black hover:text-black"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" />
          {addLabel}
        </button>
      </div>
      <div className="space-y-4">
        <p className="text-[10px] text-neutral-500 italic">
          {description}
        </p>
        <div className="grid gap-4">
          {children}
        </div>
      </div>
    </div>
  )
}
