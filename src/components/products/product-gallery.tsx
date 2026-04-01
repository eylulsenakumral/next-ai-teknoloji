"use client"

import { useState } from "react"
import Image from "next/image"
import { Package, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const mainImage = images[selectedIndex] ?? null
  const hasImages = images.length > 0

  return (
    <div className="flex flex-col gap-3">
      {/* Ana görsel */}
      <div
        className={cn(
          "relative w-full max-w-lg mx-auto aspect-square rounded-xl border bg-muted overflow-hidden cursor-zoom-in group",
          isZoomed && "cursor-zoom-out"
        )}
        onClick={() => setIsZoomed((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-label={isZoomed ? "Görseli küçült" : "Görseli büyüt"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setIsZoomed((prev) => !prev)
          }
        }}
      >
        {hasImages && mainImage ? (
          <>
            <Image
              src={mainImage}
              alt={`${productName} - görsel ${selectedIndex + 1}`}
              fill
              priority
              className={cn(
                "object-contain p-6 transition-transform duration-300",
                isZoomed ? "scale-150" : "scale-100 group-hover:scale-105"
              )}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow">
                <ZoomIn className="h-4 w-4" aria-hidden />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-20 w-20 text-muted-foreground/30" aria-hidden />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(images.length, 6)}, minmax(0, 1fr))`,
          }}
          role="listbox"
          aria-label="Ürün görselleri"
        >
          {images.slice(0, 6).map((img, index) => (
            <button
              key={index}
              type="button"
              role="option"
              aria-selected={selectedIndex === index}
              aria-label={`${productName} görsel ${index + 1}`}
              onClick={() => {
                setSelectedIndex(index)
                setIsZoomed(false)
              }}
              className={cn(
                "relative aspect-square rounded-lg border-2 bg-muted overflow-hidden transition-all",
                selectedIndex === index
                  ? "border-primary shadow-sm"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <Image
                src={img}
                alt={`${productName} - küçük görsel ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
