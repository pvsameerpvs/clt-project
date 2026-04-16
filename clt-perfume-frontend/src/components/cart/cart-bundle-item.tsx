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
    <div className="mb-4 rounded-2xl border border-neutral-200 p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Bundle Offer</p>
          <h3 className="mt-1 text-xl font-serif text-neutral-900">{bundleGroup.name}</h3>
          <p className="mt-1 text-xs text-neutral-500">
            {itemCount} items selected • {bundleGroup.discountPercent}% OFF
          </p>
        </div>
        <button
          onClick={() =>
            onRemove(bundleGroup.items.map(item => 
              getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)
            ))
          }
          className="text-neutral-400 transition-colors hover:text-black"
          aria-label={`Remove ${bundleGroup.name}`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {bundleGroup.items.map((item) => (
          <div key={getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)} className="rounded-xl border border-neutral-100 bg-neutral-50 p-2">
            <div className="relative h-20 w-full overflow-hidden rounded-lg bg-white">
              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
            </div>
            <p className="mt-2 line-clamp-1 text-xs text-neutral-700">{item.product.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 inline-flex items-center overflow-hidden rounded-full border border-neutral-300">
        <button
          type="button"
          onClick={() => onUpdateQuantity(setQuantity - 1)}
          disabled={setQuantity <= 1}
          className="inline-flex h-8 w-8 items-center justify-center transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Decrease ${bundleGroup.name} quantity`}
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="inline-flex h-8 min-w-8 items-center justify-center border-x border-neutral-300 px-2 text-sm font-medium">
          {setQuantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(setQuantity + 1)}
          className="inline-flex h-8 w-8 items-center justify-center transition-colors hover:bg-neutral-50"
          aria-label={`Increase ${bundleGroup.name} quantity`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm">
        <div>
          <span className="mr-2 text-neutral-500 line-through">AED {Math.round(bundleGroup.originalTotal)}</span>
          <span className="font-semibold text-neutral-900">AED {Math.round(bundleGroup.offerTotal)}</span>
        </div>
        <span className="font-medium text-green-700">You save AED {Math.round(savings)}</span>
      </div>
    </div>
  )
}
