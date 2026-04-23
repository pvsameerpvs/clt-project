"use client"

import { useState, useEffect } from "react"
import { useProfile } from "@/contexts/profile-context"
import { ProfileOrdersSection } from "@/components/profile/profile-orders-section"
import { ReturnRequestModal } from "@/components/profile/return-request-modal"
import { OrderRecord, ReturnRequestRecord } from "@/components/profile/profile-types"
import { getMyOrders, getMyReturnRequests, cancelMyOrder, requestOrderReturn } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { normalizeReturnRequestStatus } from "@/components/profile/profile-utils"
import { toast } from "sonner"

export default function OrdersPage() {
  const { user } = useProfile()
  const supabase = createClient()

  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [returnRequests, setReturnRequests] = useState<ReturnRequestRecord[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderActionLoadingId, setOrderActionLoadingId] = useState<string | null>(null)
  const [returnReasonByOrder, setReturnReasonByOrder] = useState<Record<string, string>>({})
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<OrderRecord | null>(null)

  useEffect(() => {
    async function loadOrders() {
      if (!user) return
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        const [ordersData, returnsData] = await Promise.all([
          getMyOrders(token),
          getMyReturnRequests(token)
        ])
        setOrders(ordersData)
        setReturnRequests(returnsData)
      } catch (err) {
        console.error("Failed to load orders", err)
      } finally {
        setOrdersLoading(false)
      }
    }
 
    loadOrders()
  }, [user, supabase])

  async function getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error("Please login again.")
    return session.access_token
  }

  function getReturnRequestStatus(orderId: string) {
    const request = returnRequests.find((r) => r.order_id === orderId)
    return request ? normalizeReturnRequestStatus(request.status) : null
  }

  function setOrderReturnReason(orderId: string, reason: string) {
    setReturnReasonByOrder((prev) => ({ ...prev, [orderId]: reason }))
  }

  async function handleCancelOrder(orderId: string) {
    try {
      setOrderActionLoadingId(orderId)
      const token = await getAccessToken()
      const result = await cancelMyOrder(token, orderId)
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: result.status } : order)))
      toast.success("Order cancelled")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel order")
    } finally {
      setOrderActionLoadingId(null)
    }
  }

  function handleOpenReturnModal(orderId: string) {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrderForReturn(order)
      setIsReturnModalOpen(true)
    }
  }

  async function handleRequestReturn(reason: string) {
    if (!selectedOrderForReturn) return
    const orderId = selectedOrderForReturn.id

    try {
      setOrderActionLoadingId(orderId)
      const token = await getAccessToken()
      const created = await requestOrderReturn(token, orderId, { reason })
      setReturnRequests((prev) => [created, ...prev])
      toast.success("Return request submitted")
      setIsReturnModalOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit return request")
    } finally {
      setOrderActionLoadingId(null)
    }
  }

  return (
    <>
      <ProfileOrdersSection
        ordersLoading={ordersLoading}
        orders={orders}
        orderActionLoadingId={orderActionLoadingId}
        returnReasonByOrder={returnReasonByOrder}
        onReturnReasonChange={setOrderReturnReason}
        onCancelOrder={handleCancelOrder}
        onRequestReturn={handleOpenReturnModal}
        getReturnRequestStatus={getReturnRequestStatus}
      />

      <ReturnRequestModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={handleRequestReturn}
        orderNumber={selectedOrderForReturn?.order_number || selectedOrderForReturn?.id.slice(0, 8).toUpperCase() || ""}
        isLoading={orderActionLoadingId === selectedOrderForReturn?.id}
      />
    </>
  )
}
