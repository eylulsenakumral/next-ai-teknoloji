"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CategoryNode, BrandItem, SupplierItem, ProductFilters } from "@/types/catalog"

interface ProductFiltersProps {
  categories: CategoryNode[]
  brands: BrandItem[]
  suppliers?: SupplierItem[]
  filters: ProductFilters
  onChange: (updated: Partial<ProductFilters>) => void
}

const depthPad: Record<number, string> = {
  0: "pl-0",
  1: "pl-3",
  2: "pl-6",
  3: "pl-8",
  4: "pl-9",
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
    <div>
      <div
        className={cn(
          "flex items-center gap-0.5",
          depthPad[depth] ?? depthPad[4]
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="p-0.5 text-[#767676] hover:text-[#333333] shrink-0"
            aria-label={expanded ? "Daralt" : "Genişlet"}
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" aria-hidden />
            ) : (
              <ChevronRight className="h-3 w-3" aria-hidden />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelect(isSelected ? "" : category.id)}
          title={category.name}
          className={cn(
            "flex-1 flex items-center justify-between py-1 px-1.5 transition-colors text-left min-w-0",
            depthFont[depth] ?? depthFont[4],
            isSelected
              ? "text-[#00179e] font-semibold"
              : "text-[#767676] hover:text-[#00179e]"
          )}
          aria-pressed={isSelected}
        >
          <span className="truncate">{category.name}</span>
          <span className="text-[10px] text-[#767676] shrink-0 ml-1 tabular-nums">
            ({category._count?.products ?? 0})
          </span>
        </button>
      </div>

      {hasChildren && expanded && (
        <div>
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
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="py-4 border-b border-[#eeeeee] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between text-[12px] font-bold text-[#333333] uppercase tracking-widest hover:text-[#00179e] transition-colors mb-3"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#767676] transition-transform duration-200",
            !open && "-rotate-90"
          )}
          aria-hidden
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

export function ProductFilters({
  categories,
  brands,
  suppliers = [],
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
        <FilterSection title="Kategoriler">
          <nav aria-label="Kategori filtresi" className="space-y-0">
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
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#767676] pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Marka ara..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full h-8 border border-[#eeeeee] bg-white pl-8 pr-3 text-[12px] text-[#333333] placeholder:text-[#767676] focus:outline-none focus:border-[#00179e] transition-colors"
            />
          </div>
          <div
            className="space-y-0 max-h-52 overflow-y-auto"
            role="group"
            aria-label="Marka filtresi"
          >
            {filteredBrands.map((brand) => {
              const checked = filters.brandId === brand.id
              return (
                <label
                  key={brand.id}
                  className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:text-[#00179e] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({ brandId: checked ? "" : brand.id, page: 1 })
                    }
                    aria-label={`${brand.name} markasını filtrele`}
                    className="h-3.5 w-3.5 border-[#eeeeee] text-[#00179e] focus:ring-[#00179e] focus:ring-offset-0 accent-[#00179e]"
                  />
                  <span className="text-[13px] text-[#767676] flex-1 truncate hover:text-[#00179e]">
                    {brand.name}
                  </span>
                  <span className="text-[11px] text-[#767676] tabular-nums">
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
              className="text-[11px] text-[#767676] mb-1 block uppercase tracking-wide"
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
              className="w-full h-8 border border-[#eeeeee] px-2.5 text-[13px] text-[#333333] focus:outline-none focus:border-[#00179e] transition-colors"
            />
          </div>
          <span className="text-[#eeeeee] mt-4 text-lg">—</span>
          <div className="flex-1">
            <label
              htmlFor="max-price"
              className="text-[11px] text-[#767676] mb-1 block uppercase tracking-wide"
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
              className="w-full h-8 border border-[#eeeeee] px-2.5 text-[13px] text-[#333333] focus:outline-none focus:border-[#00179e] transition-colors"
            />
          </div>
        </div>
      </FilterSection>

    </aside>
  )
}
