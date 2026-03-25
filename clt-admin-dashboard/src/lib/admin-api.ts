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



export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  description?: string
  image_url?: string
  scent_notes?: string[]
  created_at?: string
}

export interface AdminProduct {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  stock: number
  images?: string[]
  scent?: string
  top_notes?: string[]
  heart_notes?: string[]
  base_notes?: string[]
  tags?: string[]
  rating?: number
  review_count?: number
  is_active?: boolean
  is_new?: boolean
  is_best_seller?: boolean
  is_exclusive?: boolean
  created_at?: string
  category_id?: string | null
  category?: { name?: string | null } | Array<{ name?: string | null }> | null
}


export interface SiteSettings {
  id?: string
  hero_slides: Array<{
    image: string
    tagline: string
    headline: string
  }>
  ticker_text: string
  pocket_friendly_configs: number[]
  collections: Array<{
    href: string
    image: string
    cover_image?: string
    subtitle: string
    title: string
    action: string
    product_slugs?: string[]
  }>
  brand_story: {
    title: string
    description: string
    image: string
    features: Array<{ title: string, text: string }>
  }
  offers: Array<{
    title: string
    description: string
    action: string
    href: string
    badge?: string
    bgColor?: string
    product_slugs?: string[]
    discount_percentage?: number
    is_active?: boolean
    bundle_sizes?: number[]
    bundle_discounts?: Record<string, number>
  }>
  navigation: Record<string, NavSection>
  global_store_info?: {
    name: string
    slogan: string
    description: string
    email: string
    phone: string
    address: string
    social_links: {
      instagram: string
      facebook: string
      twitter: string
      youtube: string
      linkedin: string
    }
  }
}

export interface NavSection {
  categories: NavCategory[]
  notes: Array<{ name: string, image: string, href?: string, product_slugs?: string[] }>
  banners: Array<{ title: string, image: string, href?: string, product_slugs?: string[] }>
}

export interface NavCategory {
  name: string
  slug: string
  subcategories: string[]
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
  profile?:
    | { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }
    | Array<{ first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }>
    | null
  items?: Array<{
    product_name: string
    quantity: number
    price: number
    product_image?: string | null
    product_slug?: string | null
  }>
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

export interface AdminCustomerProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  role: string
  createdAt: string
}

export interface AdminCustomerOrder {
  id: string
  order_number?: string
  total: number
  subtotal: number
  tax: number
  shipping_fee: number
  status: string
  created_at: string
  shipping_address?: Record<string, unknown> | null
}

export interface AdminCustomerDetails {
  customer: AdminCustomerProfile
  orders: AdminCustomerOrder[]
  shippingAddresses: Array<Record<string, unknown>>
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const

export type AdminOrderStatus = (typeof ORDER_STATUSES)[number]

export interface AdminOrderFilters {
  scope?: "today" | "all"
  status?: string
  query?: string
  dateFrom?: string
  dateTo?: string
}

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

export function getAdminOrders(filters?: AdminOrderFilters) {
  const params = new URLSearchParams()

  if (filters?.scope) params.set("scope", filters.scope)
  if (filters?.status) params.set("status", filters.status)
  if (filters?.query) params.set("q", filters.query)
  if (filters?.dateFrom) params.set("date_from", filters.dateFrom)
  if (filters?.dateTo) params.set("date_to", filters.dateTo)

  const query = params.toString()
  const path = `/api/admin/orders/search${query ? `?${query}` : ""}`
  return adminFetch<AdminOrder[]>(path)
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

export function getAdminCustomerDetails(customerId: string) {
  return adminFetch<AdminCustomerDetails>(`/api/admin/customers/${encodeURIComponent(customerId)}`)
}

export function getSiteSettings() {
  return adminFetch<SiteSettings>("/api/settings")
}

export function updateSiteSettings(payload: Partial<SiteSettings>) {
  return adminFetch<SiteSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

// === CATEGORIES ===

export function getAdminCategories() {
  return adminFetch<Category[]>("/api/admin/categories")
}

export function createAdminCategory(payload: Partial<Category>) {
  return adminFetch<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateAdminCategory(categoryId: string, payload: Partial<Category>) {
  return adminFetch<Category>(`/api/admin/categories/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function deleteAdminCategory(categoryId: string) {
  return adminFetch<{ success: boolean }>(`/api/admin/categories/${categoryId}`, {
    method: "DELETE",
  })
}

// === NEW PRO CONTROLS ===

export interface Subscriber {
  id: string
  email: string
  created_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  active: boolean
  expires_at?: string
  created_at: string
}

export function getAdminSubscribers() {
  return adminFetch<Subscriber[]>("/api/admin/newsletter")
}

export function getAdminMessages() {
  return adminFetch<ContactMessage[]>("/api/admin/messages")
}

export function markMessageAsRead(messageId: string) {
  return adminFetch<ContactMessage>(`/api/admin/messages/${messageId}/read`, {
    method: "PUT"
  })
}

export function getAdminPromoCodes() {
  return adminFetch<PromoCode[]>("/api/admin/promo-codes")
}

export function createAdminPromoCode(payload: Partial<PromoCode>) {
  return adminFetch<PromoCode>("/api/admin/promo-codes", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export function deleteAdminPromoCode(promoId: string) {
  return adminFetch<{ success: boolean }>(`/api/admin/promo-codes/${promoId}`, {
    method: "DELETE"
  })
}
