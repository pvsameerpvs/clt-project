"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/auth/actions"
import { getAdminBaseUrl } from "@/lib/admin-url"
import { createClient } from "@/lib/supabase/client"
import { ShoppingBag, Package, CheckCircle2, Clock } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      setProfile(profile)

      const { data: orderData } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      setOrders(orderData || [])
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>

  const isAdmin = profile?.role === "admin"
  const adminAppUrl = getAdminBaseUrl()

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: User Info */}
        <div className="col-span-1 space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-serif mb-6">Your Profile</h1>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div className="pt-4 flex flex-col gap-2">
                <form action={signOut}>
                  <Button type="submit" variant="outline" className="w-full rounded-xl">Sign Out</Button>
                </form>
                {isAdmin && (
                  <a href={adminAppUrl}>
                    <Button type="button" className="w-full rounded-xl bg-black text-white">Admin Panel</Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order History */}
        <div className="col-span-1 lg:col-span-2">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif">Order History</h2>
              <ShoppingBag className="text-neutral-300" />
            </div>

            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold uppercase tracking-tighter">#{order.order_number || order.id.slice(0, 8)}</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-[10px] font-bold uppercase text-neutral-600">
                          {order.status === 'delivered' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                          {order.status}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-400">{new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="mt-2 text-xs font-light text-neutral-500">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-serif">AED {Number(order.total).toLocaleString()}</p>
                      <Link href={`/dashboard/orders/${order.id}`} className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 hover:text-black transition-colors">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-neutral-100 rounded-3xl">
                <Package className="h-10 w-10 text-neutral-200 mx-auto mb-4" />
                <p className="text-neutral-400 font-light">You haven&apos;t placed any orders yet.</p>
                <Link href="/" className="mt-4 inline-block text-xs font-bold uppercase tracking-widest hover:underline">Start Shopping</Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
