"use client"

import { createClient } from "@/lib/supabase/client"

const DEFAULT_API_BASE_URL = "http://localhost:4000"

export interface RevenueBucket {
  month: string
  label: string
  total: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
}

export interface AdminDashboardData {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  revenueByMonth: RevenueBucket[]
  recentOrders: RecentOrder[]
}

export interface AdminProduct {
  id: string
  slug: string
  name: string
  price: number
  stock: number
  is_active?: boolean
  created_at?: string
  category?: { name?: string | null } | Array<{ name?: string | null }> | null
}

export interface AdminOrder {
  id: string
  order_number?: string
  total: number
  subtotal: number
  tax: number
  shipping_fee: number
  status: string
  created_at: string
  shipping_address?: Record<string, unknown>
  profile?: { first_name?: string | null; last_name?: string | null; email?: string | null } | Array<{ first_name?: string | null; last_name?: string | null; email?: string | null }> | null
  items?: Array<{ product_name: string; quantity: number; price: number }>
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  customerName: string
  customerEmail: string
  shippingAddress: Record<string, unknown>
  items: Array<{ name: string; quantity: number; price: number; total: number }>
  subtotal: number
  vatAmount: number
  shipping: number
  total: number
}

export interface AdminCustomer {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  role: string
  createdAt: string
  orderCount: number
  totalSpent: number
  lastOrderAt: string | null
}

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const

export type AdminOrderStatus = (typeof ORDER_STATUSES)[number]

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL
}

async function getAccessToken() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(error.message)
  }

  const token = data.session?.access_token
  if (!token) {
    throw new Error("No active session. Please login again.")
  }

  return token
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    let errorMessage = "Request failed"
    try {
      const body = await response.json()
      if (body?.error) errorMessage = body.error
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}

export function getAdminDashboard() {
  return adminFetch<AdminDashboardData>("/api/admin/dashboard")
}

export function getAdminProducts() {
  return adminFetch<AdminProduct[]>("/api/admin/products")
}

export function createAdminProduct(payload: Partial<AdminProduct>) {
  return adminFetch<AdminProduct>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateAdminProduct(productId: string, payload: Partial<AdminProduct>) {
  return adminFetch<AdminProduct>(`/api/admin/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function deleteAdminProduct(productId: string) {
  return adminFetch<{ success: boolean }>(`/api/admin/products/${productId}`, {
    method: "DELETE",
  })
}

export function getAdminOrders() {
  return adminFetch<AdminOrder[]>("/api/admin/orders")
}

export function getAdminOrderDetails(orderId: string) {
  return adminFetch<AdminOrder>(`/api/admin/orders/${orderId}`)
}

export function getAdminOrderInvoice(orderId: string) {
  return adminFetch<InvoiceData>(`/api/admin/orders/${orderId}/invoice`)
}

export function updateAdminOrderStatus(orderId: string, status: AdminOrderStatus) {
  return adminFetch<AdminOrder>(`/api/admin/orders/${orderId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })
}

export function getAdminCustomers() {
  return adminFetch<AdminCustomer[]>("/api/admin/customers")
}
