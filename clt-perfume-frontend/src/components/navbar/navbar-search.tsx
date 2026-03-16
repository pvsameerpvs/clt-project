"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface NavbarSearchProps {
  className?: string
}

export function NavbarSearch({ className }: NavbarSearchProps) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input 
        type="search" 
        placeholder="Search for product or brand" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
        className="w-full rounded-full pl-6 pr-12 h-12 border-neutral-300 focus-visible:ring-black/5 text-neutral-600 font-light"
      />
      <Search 
        onClick={() => query.trim() && router.push(`/search?q=${encodeURIComponent(query.trim())}`)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5 cursor-pointer hover:text-black transition-colors" 
      />
    </div>
  )
}
