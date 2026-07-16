interface StockBadgeProps {
  inStock: boolean
}

export function StockBadge({ inStock }: StockBadgeProps) {
  if (inStock) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
      <div className="w-20 h-20 bg-[var(--color-error)] rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-center text-sm">
          Sold<br />Out
        </span>
      </div>
    </div>
  )
}
