"use client"

import { useEffect, useState } from "react"
import { getAdminMessages, markMessageAsRead, ContactMessage } from "@/lib/admin-api"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const data = await getAdminMessages()
      setMessages(data || [])
    } catch (err) {
      toast.error("Failed to load messages.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleMarkRead(id: string) {
    try {
      await markMessageAsRead(id)
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m))
      toast.success("Message marked as read")
    } catch (err) {
      toast.error("Failed to update message status")
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
    <div style={{ maxWidth: 1000 }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Customer Inquiries</h1>
        <p style={{ color: "#6b7280" }}>Read and manage messages sent from the Contact page.</p>
      </header>

      <div style={{ display: "grid", gap: 16 }}>
        {messages.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", border: "2px dashed #e5e7eb", borderRadius: 20 }}>
            <Mail size={40} style={{ display: "block", margin: "0 auto 12px", opacity: 0.2 }} />
            <p style={{ color: "#9ca3af" }}>No messages found.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              style={{ 
                background: "#fff", 
                border: "1px solid #e5e7eb", 
                borderLeft: msg.is_read ? "1px solid #e5e7eb" : "4px solid #111",
                borderRadius: 16, 
                padding: 24,
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{msg.subject}</h3>
                  <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                    From: <strong>{msg.name}</strong> ({msg.email})
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{new Date(msg.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div style={{ background: "#f9fafb", padding: 16, borderRadius: 12, fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
                {msg.message}
              </div>

              {!msg.is_read && (
                <button 
                  onClick={() => handleMarkRead(msg.id)}
                  style={{ 
                    marginTop: 16, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6, 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: "#111", 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  <CheckCircle2 size={14} />
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
