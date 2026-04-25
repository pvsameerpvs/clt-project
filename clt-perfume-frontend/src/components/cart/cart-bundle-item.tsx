import Image from "next/image"
import { Minus, Plus, X } from "lucide-react"
import { CartItem as CartLineItem, getCartLineKey } from "@/contexts/cart-context"

interface BundleGroup {
  id: string
  name: string
  discountPercent: number
  size: number
  items: CartLineItem[]
  originalTotal: number
  offerTotal: number
}

interface CartBundleItemProps {
  bundleGroup: BundleGroup
  onRemove: (lineKeys: string[]) => void
  onUpdateQuantity: (delta: number) => void
  setQuantity: number
}

export function CartBundleItem({ bundleGroup, onRemove, onUpdateQuantity, setQuantity }: CartBundleItemProps) {
  const itemCount = bundleGroup.items.reduce((sum, item) => sum + item.quantity, 0)
  const savings = Math.max(0, bundleGroup.originalTotal - bundleGroup.offerTotal)

  return (
    <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-4 md:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Bundle Offer</p>
          <h3 className="mt-1 font-serif text-lg md:text-xl text-neutral-900 leading-tight">{bundleGroup.name}</h3>
          <p className="mt-1 text-[11px] text-neutral-500">
            {itemCount} items selected • {bundleGroup.discountPercent}% OFF
          </p>
        </div>
        <button
          onClick={() =>
            onRemove(bundleGroup.items.map(item => 
              getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)
            ))
          }
          className="text-neutral-300 transition-colors hover:text-black"
          aria-label={`Remove ${bundleGroup.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {bundleGroup.items.map((item) => (
          <div key={getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)} className="rounded-xl border border-neutral-50 bg-neutral-50/50 p-1.5">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-white">
              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
            </div>
            <p className="mt-1.5 line-clamp-1 text-[9px] text-neutral-500 text-center">{item.product.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
        <div className="flex items-center border border-neutral-200 rounded-full h-8 px-1">
          <button
            type="button"
            onClick={() => onUpdateQuantity(setQuantity - 1)}
            disabled={setQuantity <= 1}
            className="w-8 flex items-center justify-center transition-colors hover:bg-neutral-50 rounded-full disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <span className="w-6 text-center text-xs font-medium">
            {setQuantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(setQuantity + 1)}
            className="w-8 flex items-center justify-center transition-colors hover:bg-neutral-50 rounded-full"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-[10px]">
            <span className="text-neutral-400 line-through">AED {Math.round(bundleGroup.originalTotal)}</span>
            <span className="text-green-600 font-medium">Save AED {Math.round(savings)}</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="text-[10px] text-neutral-500 font-medium">AED</span>
            <span className="font-semibold text-base text-black">{Math.round(bundleGroup.offerTotal).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
