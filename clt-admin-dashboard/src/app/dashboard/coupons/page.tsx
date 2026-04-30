"use client"

import { useEffect, useState } from "react"
import { getAdminPromoCodes, createAdminPromoCode, updateAdminPromoCode, deleteAdminPromoCode, PromoCode } from "@/lib/admin-api"
import { Loader2, Ticket, Plus, Trash2, Edit2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<PromoCode | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    expires_at: ""
  })

  async function load() {
    try {
      const data = await getAdminPromoCodes()
      setCoupons(data || [])
    } catch (err) {
      toast.error("Failed to load promo codes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingCoupon) {
        await updateAdminPromoCode(editingCoupon.id, {
          code: newCoupon.code,
          discount_type: newCoupon.discount_type as 'percentage' | 'fixed',
          discount_value: Number(newCoupon.discount_value),
          expires_at: newCoupon.expires_at || undefined
        })
        toast.success("Coupon updated")
      } else {
        await createAdminPromoCode({
          code: newCoupon.code,
          discount_type: newCoupon.discount_type as 'percentage' | 'fixed',
          discount_value: Number(newCoupon.discount_value),
          expires_at: newCoupon.expires_at || undefined
        })
        toast.success("Coupon created")
      }
      setShowForm(false)
      setEditingCoupon(null)
      setNewCoupon({ code: "", discount_type: "percentage", discount_value: "", expires_at: "" })
      load()
    } catch (err) {
      toast.error(`Failed to ${editingCoupon ? 'update' : 'create'} coupon`)
    }
  }

  function startEdit(coupon: PromoCode) {
    setEditingCoupon(coupon)
    setNewCoupon({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : ""
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    try {
      await deleteAdminPromoCode(id)
      setCoupons(coupons.filter(c => c.id !== id))
      toast.success("Coupon deleted")
    } catch (err) {
      toast.error("Failed to delete coupon")
    }
  }

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 400 }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Promo Codes</h1>
          <p style={{ color: "#6b7280" }}>Create and manage discounts for your customers.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#111", color: "#fff", padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 500 }}
          >
            <Plus size={18} />
            New Coupon
          </button>
        )}
      </header>

      {showForm && (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24, marginBottom: 32 }}>
          <h3 style={{ margin: "0 0 20px" }}>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Discount'}</h3>
          <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Coupon Code</label>
              <input 
                required
                value={newCoupon.code}
                onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                placeholder="e.g. EID2026"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Type</label>
              <select 
                value={newCoupon.discount_type}
                onChange={e => setNewCoupon({...newCoupon, discount_type: e.target.value})}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff" }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Price (AED)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Value</label>
              <input 
                required
                type="number"
                value={newCoupon.discount_value}
                onChange={e => setNewCoupon({...newCoupon, discount_value: e.target.value})}
                placeholder="e.g. 20"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Expires At (Optional)</label>
              <input 
                type="date"
                value={newCoupon.expires_at}
                onChange={e => setNewCoupon({...newCoupon, expires_at: e.target.value})}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 12, marginTop: 8 }}>
              <button type="submit" style={{ flex: 1, background: "#111", color: "#fff", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 600 }}>
                {editingCoupon ? 'Update Coupon' : 'Save Coupon'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingCoupon(null); }} style={{ flex: 0.5, background: "#fff", border: "1px solid #d1d5db", padding: "12px", borderRadius: 12, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {coupons.length === 0 ? (
          <div style={{ gridColumn: "span 3", padding: 60, textAlign: "center", border: "2px dashed #e5e7eb", borderRadius: 20 }}>
            <Ticket size={40} style={{ display: "block", margin: "0 auto 12px", opacity: 0.2 }} />
            <p style={{ color: "#9ca3af" }}>No active coupons.</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#f3f4f6", padding: 10, borderRadius: 10 }}>
                  <Ticket size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, letterSpacing: 1 }}>{coupon.code}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#10b981", fontWeight: 600 }}>Active</p>
                </div>
              </div>
              
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `AED ${coupon.discount_value}`} OFF
              </div>
              
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Created {new Date(coupon.created_at).toLocaleDateString()}
                {coupon.expires_at && ` · Expires ${new Date(coupon.expires_at).toLocaleDateString()}`}
              </div>

              <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
                <button 
                  onClick={() => startEdit(coupon)}
                  style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 5, transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#111"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                  title="Edit Coupon"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setDeleteModal({ isOpen: true, id: coupon.id })}
                  style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 5, transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                  title="Delete Coupon"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Coupon"
        message="Are you sure you want to delete this promo code? Customers will no longer be able to use it."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleteModal.id) handleDelete(deleteModal.id)
        }}
        onCancel={() => setDeleteModal({ isOpen: false, id: null })}
      />
    </div>
  )
}
