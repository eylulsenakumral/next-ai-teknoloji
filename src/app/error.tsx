"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Route Error]", error)
    fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        source: "client",
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "1rem", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2" }}>
        <AlertCircle style={{ width: 24, height: 24, color: "#dc2626" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>Bir hata oluştu</h2>
        <p style={{ fontSize: "0.875rem", color: "#767676", maxWidth: "400px" }}>
          {error.message || "Sayfa yüklenirken beklenmedik bir hata meydana geldi."}
        </p>
      </div>
      <button
        onClick={reset}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.75rem", border: "1px solid #e5e5e5", background: "white", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
      >
        <RefreshCw style={{ width: 16, height: 16 }} />
        Tekrar Dene
      </button>
    </div>
  )
}
