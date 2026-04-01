"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

let toastListeners: Array<(toasts: ToastProps[]) => void> = []
let toastList: ToastProps[] = []

export function toast(props: Omit<ToastProps, "id">) {
  const id = Math.random().toString(36).slice(2)
  const newToast: ToastProps = { id, ...props }
  toastList = [...toastList, newToast]
  toastListeners.forEach((listener) => listener(toastList))

  setTimeout(() => {
    toastList = toastList.filter((t) => t.id !== id)
    toastListeners.forEach((listener) => listener(toastList))
  }, 5000)
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts)
    }
  }, [])

  function dismiss(id: string) {
    toastList = toastList.filter((t) => t.id !== id)
    toastListeners.forEach((l) => l(toastList))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg bg-card text-card-foreground",
            t.variant === "destructive" &&
              "border-destructive bg-destructive text-destructive-foreground"
          )}
        >
          <div className="flex-1 min-w-0">
            {t.title && (
              <p className="text-sm font-semibold leading-tight">{t.title}</p>
            )}
            {t.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
