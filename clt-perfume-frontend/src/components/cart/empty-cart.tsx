import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function EmptyCart() {
  return (
    <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
        <ShoppingBag className="h-10 w-10 text-neutral-300" />
      </div>
      <h1 className="mb-4 text-3xl font-serif text-neutral-900">Your Bag is Empty</h1>
      <p className="mb-8 max-w-sm text-center font-light text-neutral-500">
        Discover our exclusive collections and find the perfect signature scent.
      </p>
      <Link href="/">
        <Button className="h-14 rounded-none bg-black px-8 text-xs font-medium uppercase tracking-widest text-white transition-all hover:bg-neutral-800">
          Continue Shopping
        </Button>
      </Link>
    </div>
  )
}
