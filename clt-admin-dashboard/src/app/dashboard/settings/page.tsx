"use client"

import { useState } from "react"

const DEFAULT_API_BASE_URL = "http://localhost:4000"

export default function SettingsPage() {
  const [checking, setChecking] = useState(false)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<"ok" | "error" | null>(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL

  async function runHealthCheck() {
    try {
      setChecking(true)
      setStatusText(null)
      setStatusType(null)

      const response = await fetch(`${apiBaseUrl}/api/health`)
      if (!response.ok) throw new Error("Health check failed")

      const data = (await response.json()) as { status?: string; timestamp?: string }
      setStatusType("ok")
      setStatusText(`Backend status: ${data.status || "ok"} at ${data.timestamp || "unknown"}`)
    } catch (error) {
      setStatusType("error")
      setStatusText(error instanceof Error ? error.message : "Unable to reach backend")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>Settings</h1>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff", display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>API Configuration</h3>
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>NEXT_PUBLIC_API_URL</p>
        <code style={{ display: "block", fontSize: 13, background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: 10 }}>
          {apiBaseUrl}
        </code>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff", display: "grid", gap: 10, maxWidth: 520 }}>
        <h3 style={{ margin: 0 }}>Backend Health</h3>
        <button onClick={runHealthCheck} disabled={checking} style={{ width: "fit-content", border: "none", background: "#111", color: "#fff", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
          {checking ? "Checking..." : "Run Health Check"}
        </button>
        {statusText && (
          <p
            style={{
              margin: 0,
              border: statusType === "ok" ? "1px solid #bbf7d0" : "1px solid #fecaca",
              background: statusType === "ok" ? "#f0fdf4" : "#fef2f2",
              color: statusType === "ok" ? "#166534" : "#b91c1c",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
            }}
          >
            {statusText}
          </p>
        )}
      </section>
    </div>
  )
}
