"use client"

import { useState, useEffect } from "react"
import { useProfile } from "@/contexts/profile-context"
import { ProfileReturnsSection } from "@/components/profile/profile-returns-section"
import { OrderRecord, ReturnRequestRecord } from "@/components/profile/profile-types"
import { getMyOrders, getMyReturnRequests, cancelMyOrder, requestOrderReturn } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { normalizeReturnRequestStatus } from "@/components/profile/profile-utils"
import { toast } from "sonner"

export default function ReturnsPage() {
  const { user } = useProfile()
  const supabase = createClient()

  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [returnRequests, setReturnRequests] = useState<ReturnRequestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [orderActionLoadingId, setOrderActionLoadingId] = useState<string | null>(null)
  const [returnReasonByOrder, setReturnReasonByOrder] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadData() {
      if (!user) return
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      try {
        const [o, r] = await Promise.all([getMyOrders(token), getMyReturnRequests(token)])
        setOrders(o)
        setReturnRequests(r)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user, supabase])

  function setOrderReturnReason(orderId: string, reason: string) {
    setReturnReasonByOrder(prev => ({ ...prev, [orderId]: reason }))
  }

  async function handleCancelOrder(orderId: string) {
    try {
      setOrderActionLoadingId(orderId)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        toast.error("Session expired. Please login again.")
        return
      }

      const result = await cancelMyOrder(token, orderId)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: result.status } : o))
      toast.success("Order cancelled")
    } catch (e) {
      toast.error("Failed to cancel order")
    } finally {
      setOrderActionLoadingId(null)
    }
  }

  async function handleRequestReturn(orderId: string) {
    try {
      setOrderActionLoadingId(orderId)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        toast.error("Session expired. Please login again.")
        return
      }

      const reason = returnReasonByOrder[orderId] || ""
      const created = await requestOrderReturn(token, orderId, { reason })
      setReturnRequests(prev => [created, ...prev])
      toast.success("Return request submitted")
    } catch (e) {
      toast.error("Failed to submit return request")
    } finally {
      setOrderActionLoadingId(null)
    }
  }

  function hasOpenReturnRequest(orderId: string) {
    return returnRequests.some(r => r.order_id === orderId && ["pending", "approved"].includes(normalizeReturnRequestStatus(r.status)))
  }

  return (
    <ProfileReturnsSection
      ordersLoading={loading}
      returnsLoading={loading}
      orders={orders}
      returnRequests={returnRequests}
      orderActionLoadingId={orderActionLoadingId}
      returnReasonByOrder={returnReasonByOrder}
      onReturnReasonChange={setOrderReturnReason}
      onCancelOrder={handleCancelOrder}
      onRequestReturn={handleRequestReturn}
      hasOpenReturnRequest={hasOpenReturnRequest}
    />
  )
}
