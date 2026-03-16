import * as React from "react"
import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[110px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-black",
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"
