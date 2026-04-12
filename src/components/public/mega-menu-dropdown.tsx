"use client"

import { useState } from "react"

interface CategoryColumnProps {
  title: string
  items: string[]
}

function CategoryColumn({ title, items }: CategoryColumnProps) {
  return (
    <div className="p-4 border-r border-[var(--DTColor_Border)] last:border-r-0">
      <h4 className="font-bold text-[13px] text-[var(--DTColor_Heading)] mb-3 uppercase tracking-wide">
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item}>
            <a
              href="#"
              className="text-[13px] text-[var(--DTColor_Body)] hover:text-[var(--DTPrimaryColor)] transition-colors"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const CATEGORIES = [
  {
    title: "Bilgisayarlar",
    items: ["Masaustu Bilgisayar", "Laptop", "Tablet", "Mini PC"],
  },
  {
    title: "Elektronik",
    items: ["Telefon", "Kamera", "Kulaklik", "Ses Sistemi"],
  },
  {
    title: "Ev Aletleri",
    items: ["Camasir Makinesi", "Klima", "Mikrodalga", "Buzdolabi"],
  },
  {
    title: "Monitorler",
    items: ["Oyun Monitoru", "Profesyonel", "Ekonomik", "Ultrawide"],
  },
  {
    title: "Cevre Birimleri",
    items: ["Klavye", "Mouse", "Gamepad", "Webcam"],
  },
]

interface MegaMenuDropdownProps {
  isOpen: boolean
}

export function MegaMenuDropdown({ isOpen }: MegaMenuDropdownProps) {
  if (!isOpen) return null

  return (
    <div
      className="absolute top-full left-0 right-0 bg-white border border-[var(--DTColor_Border)] shadow-[var(--DTboxShadow)] z-50"
      style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}
    >
      {CATEGORIES.map((cat) => (
        <CategoryColumn key={cat.title} title={cat.title} items={cat.items} />
      ))}
    </div>
  )
}
