"use client"

import { useEffect, useState } from "react"
import { getAdminSubscribers, Subscriber } from "@/lib/admin-api"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminSubscribers()
        setSubscribers(data || [])
      } catch (err) {
        toast.error("Failed to load subscribers.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 400 }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Newsletter Circle</h1>
        <p style={{ color: "#6b7280" }}>Manage your marketing audience and subscribers.</p>
      </header>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ textAlign: "left", padding: "16px 20px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Email Address</th>
              <th style={{ textAlign: "left", padding: "16px 20px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Subscribed On</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                  <Mail size={40} style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }} />
                  No subscribers yet.
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id}>
                  <td style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", fontSize: 14 }}>{sub.email}</td>
                  <td style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", fontSize: 14, color: "#6b7280" }}>
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: 20, textAlign: "right" }}>
        <button 
          onClick={() => {
            if (subscribers.length === 0) return toast.error("No subscribers to export")
            const csv = subscribers.map(s => s.email).join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "newsletter_subscribers.csv"
            a.click()
            toast.success("CSV export started")
          }}
          style={{ background: "#111", color: "#fff", padding: "10px 16px", borderRadius: 10, cursor: "pointer", border: "none" }}
        >
          Export CSV
        </button>
      </div>
    </div>
  )
}
