"use client"

import { useEffect, useState } from "react"
import { Product } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Star, X, CheckCircle2, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { API_BASE_URL } from "@/lib/api"

export function ProductReviews({ product }: { product: Product }) {
  const staticReviews = product.reviews || []
  const { user, accessToken } = useAuth()

  const [liveReviews, setLiveReviews] = useState<{ id: string; product_id: string; product_name: string | null; user_name: string; user_avatar: string | null; rating: number; content: string; created_at: string }[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [visibleCount, setVisibleCount] = useState(6)

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

  // Get display name from Supabase user metadata (Google / email)
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Anonymous"


  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  // Load approved reviews from backend
  useEffect(() => {
    if (!product.id) return
    fetch(`${API_BASE_URL}/api/reviews?product_id=${encodeURIComponent(product.id)}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLiveReviews(data) })
      .catch(() => {})
  }, [product.id])

  // Merge static + live reviews, deduplicate by id
  const reviews = [
    ...staticReviews,
    ...liveReviews.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      user: r.user_name,
      avatar: r.user_avatar || undefined,
      rating: r.rating,
      date: new Date(r.created_at).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" }),
      content: r.content,
    }))
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating || !content || !user) return
    setSubmitting(true)
    setSubmitError("")
    try {
      if (!accessToken) throw new Error("Not authenticated")

      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          user_name: displayName,
          user_email: user.email,
          user_avatar: avatarUrl || null,
          rating,
          content: content.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to submit")
      }

      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again."
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSubmitted(false)
    setRating(0)
    setHoverRating(0)
    setContent("")
    setSubmitError("")
  }

  const totalReviewCount = product.review_count || reviews.length || 0
  const avgRating = product.rating

  return (
    <div className="border-t border-neutral-200 pt-16 mb-20">
      <div className="flex flex-col md:flex-row gap-12">

        {/* Left: Summary + CTA */}
        <div className="md:w-1/3">
          <h2 className="text-2xl font-serif mb-4">Reviews</h2>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-6xl font-light text-neutral-900">{avgRating || "—"}</span>
            <div className="flex flex-col">
              <div className="flex text-black mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(avgRating || 0) ? 'fill-black' : 'text-neutral-200 fill-transparent'}`} />
                ))}
              </div>
              <span className="text-sm text-neutral-500">{totalReviewCount} Reviews</span>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            className="w-full rounded-full border-neutral-300 hover:border-black hover:bg-black hover:text-white transition-all duration-200"
          >
            Write a Review
          </Button>
        </div>

        {/* Right: Review List */}
        <div className="md:w-2/3 space-y-8">
          {reviews.length > 0 ? (
            <>
              {reviews.slice(0, visibleCount).map(review => (
                <div key={review.id} className="pb-8 border-b border-neutral-100 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      {review.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={review.avatar} alt={review.user} className="h-10 w-10 rounded-full object-cover shrink-0" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(review.user)}&background=f5f5f5&color=171717`} alt={review.user} className="h-10 w-10 rounded-full object-cover shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-neutral-900">{review.user}</div>
                        <div className="text-xs text-neutral-400">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-black text-black' : 'text-neutral-200 fill-transparent'}`} />
                        ))}
                      </div>
                      {/* If review belongs to a different product, show a tiny badge */}
                      {('product_id' in review && review.product_id && review.product_id !== product.id) && (
                        <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded-full border border-neutral-100">
                          For {('product_name' in review && review.product_name) ? review.product_name : "Another Product"}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-neutral-600 font-light mt-4 leading-relaxed pl-14">
                    {review.content}
                  </p>
                </div>
              ))}
              
              {reviews.length > visibleCount && (
                <div className="pt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="rounded-full px-8 py-5 border-neutral-200 hover:border-black transition-colors"
                  >
                    See More Reviews
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl">
              <p className="text-neutral-500">No reviews yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Review Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-neutral-100 shrink-0">
              <div>
                <h3 className="text-xl font-serif text-neutral-900">Write a Review</h3>
                <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-widest">{product.name}</p>
              </div>
              <button
                onClick={handleClose}
                className="h-9 w-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-neutral-600" />
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="overflow-y-auto flex-1">
              {submitted ? (
                /* ── Success State ── */
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />
                  <h4 className="text-xl font-serif mb-2">Thank You!</h4>
                  <p className="text-sm text-neutral-500 mb-6">Your review is pending approval and will appear shortly.</p>
                  <Button onClick={handleClose} className="rounded-full px-8 bg-black hover:bg-neutral-800 text-white">
                    Done
                  </Button>
                </div>

              ) : !user ? (
                /* ── Not logged in ── */
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <LogIn className="h-12 w-12 text-neutral-300 mb-4" />
                  <h4 className="text-lg font-serif mb-2 text-neutral-900">Sign in to leave a review</h4>
                  <p className="text-sm text-neutral-500 mb-6">You need to be logged in to write a review for this product.</p>
                  <Link href="/login">
                    <Button className="rounded-full px-8 bg-black hover:bg-neutral-800 text-white">
                      Sign In
                    </Button>
                  </Link>
                </div>

              ) : (
                /* ── Review Form ── */
                <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-6">

                  {/* Auto-filled Profile Row */}
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=000000&color=ffffff&bold=true`} alt={displayName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-sm text-neutral-900">{displayName}</div>
                      <div className="text-xs text-neutral-400">Posting as your account</div>
                    </div>
                  </div>

                  {/* Star Rating Picker */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 block mb-3">
                      Your Rating <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star
                            className={`h-9 w-9 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-200 fill-neutral-100"
                            }`}
                          />
                        </button>
                      ))}
                      {(hoverRating || rating) > 0 && (
                        <span className="text-sm font-semibold text-amber-600 ml-2">
                          {ratingLabels[hoverRating || rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Review Body */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 block mb-2">
                      Your Review <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      placeholder="Share what you loved about this fragrance..."
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      required
                    />
                  </div>

                {/* Error Message */}
                  {submitError && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{submitError}</p>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={!rating || !content || submitting}
                    className="w-full h-12 rounded-full bg-black hover:bg-neutral-800 text-white uppercase tracking-widest text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
