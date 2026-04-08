"use client"

import { useEffect, useState } from "react"
import {
  getAdminReviews,
  approveAdminReview,
  deleteAdminReview,
  AdminReview,
} from "@/lib/admin-api"
import { Star, Trash2, CheckCircle, Clock, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-200 fill-neutral-100"}`}
        />
      ))}
      <span className="ml-1 text-xs text-neutral-500">{RATING_LABELS[rating]}</span>
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all")
  const [search, setSearch] = useState("")

  async function loadReviews() {
    setLoading(true)
    try {
      const data = await getAdminReviews()
      setReviews(data)
    } catch {
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  async function handleApprove(id: string) {
    try {
      await approveAdminReview(id)
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r))
      )
      toast.success("Review approved and published")
    } catch {
      toast.error("Failed to approve review")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return
    try {
      await deleteAdminReview(id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
      toast.success("Review deleted")
    } catch {
      toast.error("Failed to delete review")
    }
  }

  const filtered = reviews.filter((r) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "approved" && r.is_approved) ||
      (filter === "pending" && !r.is_approved)
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      r.user_name.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q) ||
      (r.product_name || "").toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const total = reviews.length
  const approved = reviews.filter((r) => r.is_approved).length
  const pending = reviews.filter((r) => !r.is_approved).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reviews</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage customer product reviews</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadReviews} className="gap-2 rounded-full">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Reviews", value: total, color: "text-neutral-900" },
          { label: "Approved", value: approved, color: "text-green-600" },
          { label: "Pending", value: pending, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">{label}</p>
            <p className={`text-3xl font-light mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex rounded-xl overflow-hidden border border-neutral-200 bg-white shrink-0">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors capitalize ${
                filter === f ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, product, or review text..."
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400 text-sm">
            Loading reviews...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
            <Star className="h-10 w-10 mb-3 text-neutral-200" />
            <p className="text-sm">No reviews found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Customer</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Product</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Rating</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 hidden md:table-cell">Review</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Status</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((review) => (
                <tr key={review.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors">
                  {/* Customer */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {review.user_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={review.user_avatar} alt={review.user_name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-bold text-neutral-500 shrink-0">
                          {review.user_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{review.user_name}</p>
                        {review.user_email && (
                          <p className="text-xs text-neutral-400 truncate">{review.user_email}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Product */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-neutral-700 text-sm">{review.product_name || review.product_id}</p>
                  </td>

                  {/* Rating */}
                  <td className="px-6 py-4">
                    <StarRating rating={review.rating} />
                  </td>

                  {/* Review Text */}
                  <td className="px-6 py-4 hidden md:table-cell max-w-xs">
                    <p className="text-neutral-600 text-sm line-clamp-2">{review.content}</p>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {review.is_approved ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-100">
                        <CheckCircle className="h-3 w-3" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-xs text-neutral-400 whitespace-nowrap">
                    {new Date(review.created_at).toLocaleDateString("en-AE", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {!review.is_approved && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(review.id)}
                          className="h-8 px-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(review.id)}
                        className="h-8 w-8 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
