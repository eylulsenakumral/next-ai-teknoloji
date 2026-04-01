"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Admin Error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-1">Bir hata oluştu</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message || "Sayfa yüklenirken beklenmedik bir hata meydana geldi."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
            Hata kodu: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4" />
        Tekrar dene
      </Button>
    </div>
  )
}
