import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-black",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"
