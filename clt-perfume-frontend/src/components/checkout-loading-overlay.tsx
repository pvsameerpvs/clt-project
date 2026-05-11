import Image from "next/image"

export function CheckoutLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-[3px] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Animated perfume bottle / logo with pulse */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-neutral-200/40 animate-ping" />
          <div className="relative h-20 w-20 rounded-full bg-white shadow-lg border border-neutral-100 flex items-center justify-center overflow-hidden">
            <Image
              src="/logo-cle-loader.png"
              alt="CLE Perfume"
              width={64}
              height={64}
              className="object-contain animate-pulse"
              priority
            />
          </div>
        </div>

        {/* Elegant loading text */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium tracking-[0.15em] uppercase text-neutral-900">
            Securing your scent
          </p>
          <p className="text-xs text-neutral-400 tracking-wide">
            Please do not close or refresh this page
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
