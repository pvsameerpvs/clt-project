import { Product } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

export function ProductReviews({ product }: { product: Product }) {
  return (
    <div className="border-t border-neutral-200 pt-16 mb-20">
      <div className="flex flex-col md:flex-row gap-12">
        <div className="md:w-1/3">
          <h2 className="text-2xl font-serif mb-4">Reviews</h2>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-6xl font-light text-neutral-900">{product.rating}</span>
            <div className="flex flex-col">
              <div className="flex text-black mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-black' : 'text-neutral-200 fill-transparent'}`} />
                ))}
              </div>
              <span className="text-sm text-neutral-500">{product.reviews.length} Reviews</span>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-full border-neutral-300">
            Write a Review
          </Button>
        </div>
        
        <div className="md:w-2/3 space-y-8">
          {product.reviews.length > 0 ? (
            product.reviews.map(review => (
              <div key={review.id} className="pb-8 border-b border-neutral-100 last:border-0">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center font-serif text-neutral-500 font-medium">
                        {review.user.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{review.user}</div>
                        <div className="text-xs text-neutral-400">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-black text-black' : 'text-neutral-200 fill-transparent'}`} />
                      ))}
                    </div>
                </div>
                <p className="text-neutral-600 font-light mt-4 leading-relaxed pl-14">
                  {review.content}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl">
              <p className="text-neutral-500">No reviews yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
