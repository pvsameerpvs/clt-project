"use client"

import { Toaster as Sonner } from "sonner"

export function ToastProvider() {
  return (
    <Sonner
      position="top-center"
      richColors
      expand={false}
      theme="light"
      closeButton
      style={{
        fontFamily: "inherit",
      }}
      toastOptions={{
        style: {
          borderRadius: "12px",
          padding: "12px 16px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
        },
        className: "sonner-toast",
      }}
    />
  )
}
