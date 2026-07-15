"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Global Error]", error)
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
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Bir şeyler ters gitti</h2>
          <p style={{ color: "#767676", marginBottom: "1.5rem", textAlign: "center" }}>
            Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "0.75rem", background: "#0040a4", color: "white", border: "none", cursor: "pointer", fontWeight: 500 }}
          >
            Sayfayı Yenile
          </button>
        </div>
      </body>
    </html>
  )
}
