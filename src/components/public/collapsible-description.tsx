"use client"

import { useState } from "react"

export function CollapsibleDescription({ text, maxLength = 300 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false)
  const needsTruncation = text.length > maxLength

  if (!needsTruncation) {
    return (
      <section aria-labelledby="description-heading" className="space-y-3">
        <h2
          id="description-heading"
          className="text-[17px] font-bold text-[var(--color-foreground)] border-b border-[var(--color-border)] pb-2"
        >
          Ürün Açıklaması
        </h2>
        <div className="bg-white border border-[var(--color-border)] p-5 text-[13px] text-[#555555] leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </section>
    )
  }

  const truncated = text.slice(0, maxLength).split(" ").slice(0, -1).join(" ")

  return (
    <section aria-labelledby="description-heading" className="space-y-3">
      <h2
        id="description-heading"
        className="text-[17px] font-bold text-[var(--color-foreground)] border-b border-[var(--color-border)] pb-2"
      >
        Ürün Açıklaması
      </h2>
      <div className="bg-white border border-[var(--color-border)] p-5 text-[13px] text-[#555555] leading-relaxed whitespace-pre-wrap">
        {expanded ? text : truncated}
        {expanded ? " " : "... "}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[var(--color-primary)] font-semibold hover:underline"
        >
          {expanded ? "Daha Az Göster" : "Devamını Oku"}
        </button>
      </div>
    </section>
  )
}
