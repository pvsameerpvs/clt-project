"use client"

import { useEffect, useState } from "react"
import { Loader2, Package, ShoppingBag, TrendingUp, Users, RefreshCcw } from "lucide-react"
import { AdminDashboardData, getAdminDashboard } from "@/lib/admin-api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function DashboardOverviewPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await getAdminDashboard()
      setData(dashboardData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="text-sm font-medium text-neutral-500 italic">Curating your insights...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-red-600">
        <h3 className="font-bold uppercase tracking-widest text-[10px] mb-2">Error Syncing Data</h3>
        <p className="text-sm">{error || "Unable to load dashboard metrics at this time."}</p>
        <Button onClick={loadData} variant="outline" className="mt-4 border-red-200 text-red-600 hover:bg-red-100">
          Try Connection Again
        </Button>
      </div>
    )
  }

  const maxMonth = Math.max(...data.revenueByMonth.map((m) => m.total), 1)

  const stats = [
    { label: "Gross Revenue", value: `AED ${(data.totalRevenue + data.totalRefunds).toLocaleString()}`, icon: TrendingUp, color: "text-neutral-900", bg: "bg-neutral-50" },
    { label: "Total Refunds", value: `AED ${data.totalRefunds.toLocaleString()}`, icon: RefreshCcw, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Net Revenue", value: `AED ${data.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total VAT Collected", value: `AED ${data.totalVAT.toLocaleString()}`, icon: ShoppingBag, color: "text-neutral-900", bg: "bg-neutral-100" },
    { label: "Card Payments", value: `AED ${data.cardRevenue.toLocaleString()}`, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "COD Payments", value: `AED ${data.codRevenue.toLocaleString()}`, icon: RefreshCcw, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Pending Payment", value: `AED ${data.pendingRevenue.toLocaleString()}`, icon: Loader2, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Orders", value: data.totalOrders.toLocaleString(), icon: Package, color: "text-neutral-600", bg: "bg-neutral-50" },
    { label: "Paid Orders", value: data.totalPaidOrders.toLocaleString(), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50/50" },
    { label: "Refunded Orders", value: data.totalRefundedOrders.toLocaleString(), icon: RefreshCcw, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Unpaid Orders", value: data.totalUnpaidOrders.toLocaleString(), icon: Loader2, color: "text-red-400", bg: "bg-red-50" },
    { label: "Inventory", value: data.totalProducts.toLocaleString(), icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif text-neutral-900 tracking-tight">Overview Studio</h1>
          <p className="mt-1 text-sm text-neutral-500 font-light italic">
            Visualizing the essence of your business growth.
          </p>
        </div>
        <Button 
          onClick={loadData} 
          variant="outline" 
          className="rounded-full gap-2 border-neutral-200 hover:bg-neutral-50"
        >
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refine Data
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-neutral-200 overflow-hidden group hover:border-black transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  {stat.label}
                </p>
                <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Insights section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-neutral-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
             <TrendingUp className="h-32 w-32" />
          </div>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Growth Analytics</CardTitle>
            <CardDescription className="text-xs">Revenue performance over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-end gap-3 sm:gap-6 pt-10">
              {data.revenueByMonth.map((month) => {
                const height = Math.max((month.total / maxMonth) * 100, month.total > 0 ? 5 : 2)
                return (
                  <div key={month.month} className="group/bar relative flex flex-1 flex-col items-center gap-3">
                    <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-black text-white px-2 py-1 rounded text-[10px] font-bold">
                       AED {month.total.toLocaleString()}
                    </div>
                    <div className="relative w-full rounded-2xl bg-neutral-50 p-1 sm:p-2 h-full flex items-end border border-neutral-100">
                      <div 
                        style={{ height: `${height}%` }} 
                        className="w-full rounded-xl bg-black transition-all duration-700 ease-out group-hover/bar:bg-neutral-700 shadow-lg shadow-black/5" 
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover/bar:text-black transition-colors">
                      {month.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Latest transactions needing your attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentOrders.length === 0 && (
                <div className="flex h-32 flex-col items-center justify-center text-center">
                  <p className="text-xs text-neutral-400 italic">No recent orders to display.</p>
                </div>
              )}
              {data.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="group/order relative flex items-center justify-between p-3 rounded-2xl border border-neutral-100 hover:border-black hover:bg-white transition-all duration-200">
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest group-hover/order:underline">#{order.orderNumber}</p>
                    <p className="text-[10px] text-neutral-500 italic">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">AED {order.total}</p>
                    <span className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest mt-1",
                      order.status === 'delivered' ? "bg-emerald-50 text-emerald-600" : 
                      order.status === 'refunded' ? "bg-amber-50 text-amber-600" :
                      order.status === 'cancelled' ? "bg-red-50 text-red-600" :
                      "bg-neutral-100 text-neutral-500"
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              <Button variant="link" className="w-full text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 hover:text-black">
                View All Transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
