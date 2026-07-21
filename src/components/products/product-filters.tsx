"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CategoryNode, BrandItem, SupplierItem, ProductFilters } from "@/types/catalog"

interface ProductFiltersProps {
  categories: CategoryNode[]
  brands: BrandItem[]
  suppliers?: SupplierItem[]
  filters: ProductFilters
  onChange: (updated: Partial<ProductFilters>) => void
}

const depthFont: Record<number, string> = {
  0: "text-[13px]",
  1: "text-[12px]",
  2: "text-[11px]",
  3: "text-[11px]",
  4: "text-[10px]",
}

function CategoryItem({
  category,
  selectedId,
  onSelect,
  depth = 0,
}: {
  category: CategoryNode
  selectedId: string
  onSelect: (id: string) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(
    selectedId === category.id ||
      category.children?.some((c) => c.id === selectedId)
  )
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedId === category.id

  return (
    <div className={cn(
      "relative",
      depth > 0 && "ml-2.5 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-primary)]/20 before:rounded-full"
    )}>
      <div
        className={cn(
          "flex items-center gap-1.5 py-2.5 px-3 rounded-lg transition-all duration-150",
          isSelected
            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="shrink-0 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors duration-200"
            aria-label={expanded ? "Daralt" : "Genişlet"}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                expanded && "rotate-90"
              )}
              aria-hidden
            />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelect(isSelected ? "" : category.id)}
          title={category.name}
          className={cn(
            "flex-1 flex items-center justify-between text-left min-w-0",
            depthFont[depth] ?? depthFont[4],
            isSelected
              ? "font-semibold"
              : ""
          )}
          aria-pressed={isSelected}
        >
          <span className="truncate">{category.name}</span>
          <span
            className={cn(
              "shrink-0 ml-2 tabular-nums rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-150",
              isSelected
                ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
            )}
          >
            {category._count?.products ?? 0}
          </span>
        </button>
      </div>

      {hasChildren && expanded && (
        <div className="ml-2.5 mt-0.5 space-y-0.5">
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
  showReset = false,
  onReset,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  showReset?: boolean
  onReset?: () => void
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="py-4 border-b border-[#e9e9e9] last:border-0">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 text-[12px] font-bold text-[var(--color-foreground)] uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors duration-150"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
          {title}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform duration-200",
              !open && "-rotate-90"
            )}
            aria-hidden
          />
        </button>
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors duration-150"
          >
            Tümü
          </button>
        )}
      </div>
      {open && <div>{children}</div>}
    </div>
  )
}

export function ProductFilters({
  categories,
  brands,
  filters,
  onChange,
}: ProductFiltersProps) {
  const [brandSearch, setBrandSearch] = useState("")

  const filteredBrands = brandSearch
    ? brands.filter((b) =>
        b.name.toLowerCase().includes(brandSearch.toLowerCase())
      )
    : brands

  return (
    <aside aria-label="Ürün filtreleri" className="space-y-0">
      {/* Kategoriler */}
      {categories.length > 0 && (
        <FilterSection
          title="Kategoriler"
          showReset={!!filters.categoryId}
          onReset={() => onChange({ categoryId: "", page: 1 })}
        >
          <nav aria-label="Kategori filtresi" className="space-y-0.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.map((cat) => (
              <CategoryItem
                key={cat.id}
                category={cat}
                selectedId={filters.categoryId}
                onSelect={(id) => onChange({ categoryId: id, page: 1 })}
              />
            ))}
          </nav>
        </FilterSection>
      )}

      {/* Markalar */}
      {brands.length > 0 && (
        <FilterSection title="Markalar">
          {/* Marka arama */}
          <div className="relative mb-3">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)] pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Marka ara..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full h-8 border border-[#e9e9e9] bg-white rounded-lg pl-8 pr-3 text-[12px] text-[var(--color-foreground)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all"
            />
          </div>
          <div
            className="space-y-0 max-h-52 overflow-y-auto pr-2 custom-scrollbar"
            role="group"
            aria-label="Marka filtresi"
          >
            {filteredBrands.map((brand) => {
              const checked = filters.brandId === brand.id
              return (
                <label
                  key={brand.id}
                  className="flex items-center gap-2.5 py-2 px-2 cursor-pointer rounded-lg hover:bg-[var(--color-primary)]/5 transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({ brandId: checked ? "" : brand.id, page: 1 })
                    }
                    aria-label={`${brand.name} markasını filtrele`}
                    className="h-3.5 w-3.5 border-[#e9e9e9] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0 accent-[var(--color-primary)] rounded"
                  />
                  <span className="text-[13px] text-[var(--color-text-muted)] flex-1 truncate hover:text-[var(--color-primary)] transition-colors duration-150">
                    {brand.name}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                    ({brand.productCount})
                  </span>
                </label>
              )
            })}
          </div>
        </FilterSection>
      )}


      {/* Fiyat aralığı */}
      <FilterSection title="Fiyat Aralığı">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label
              htmlFor="min-price"
              className="text-[11px] text-[var(--color-text-muted)] mb-1 block uppercase tracking-wide"
            >
              Min ₺
            </label>
            <input
              id="min-price"
              type="number"
              min={0}
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value, page: 1 })}
              className="w-full h-8 border border-[#e9e9e9] rounded-lg px-2.5 text-[13px] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all"
            />
          </div>
          <span className="text-[#e9e9e9] mt-4 text-lg">—</span>
          <div className="flex-1">
            <label
              htmlFor="max-price"
              className="text-[11px] text-[var(--color-text-muted)] mb-1 block uppercase tracking-wide"
            >
              Max ₺
            </label>
            <input
              id="max-price"
              type="number"
              min={0}
              placeholder="∞"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value, page: 1 })}
              className="w-full h-8 border border-[#e9e9e9] rounded-lg px-2.5 text-[13px] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all"
            />
          </div>
        </div>
      </FilterSection>

    </aside>
  )
}
