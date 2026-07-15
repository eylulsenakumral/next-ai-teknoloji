"use client"

import { MessageSquare } from "lucide-react"

export function AskAiButton({ productName }: { productName: string }) {
  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent("open-chat", {
        detail: { product: productName },
      })
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0040a4] hover:text-[#003080] bg-[#0040a4]/5 hover:bg-[#0040a4]/10 px-3 py-1.5 rounded-full transition-colors"
    >
      <MessageSquare className="w-3.5 h-3.5" />
      Bu ürün hakkında AI&apos;ye Soru Sor
    </button>
  )
}
