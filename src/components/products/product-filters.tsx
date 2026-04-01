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
          "flex items-center gap-1",
          depth > 0 && "pl-4"
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
          className={cn(
            "flex-1 flex items-center justify-between py-1.5 px-2 text-[13px] transition-colors text-left",
            isSelected
              ? "text-[#00179e] font-semibold"
              : "text-[#767676] hover:text-[#00179e]"
          )}
          aria-pressed={isSelected}
        >
          <span className="truncate">{category.name}</span>
          <span className="text-[11px] text-[#767676] shrink-0 ml-1 tabular-nums">
            ({category._count?.products ?? 0})
          </span>
        </button>
      </div>

      {hasChildren && expanded && (
        <div className="mt-0.5">
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

      {/* Tedarikçiler */}
      {suppliers.length > 0 && (
        <FilterSection title="Tedarikçiler">
          <div
            className="space-y-0 max-h-40 overflow-y-auto"
            role="group"
            aria-label="Tedarikçi filtresi"
          >
            {suppliers.map((supplier) => {
              const checked = filters.supplierId === supplier.id
              return (
                <label
                  key={supplier.id}
                  className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:text-[#00179e] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({ supplierId: checked ? "" : supplier.id, page: 1 })
                    }
                    aria-label={`${supplier.name} tedarikçisini filtrele`}
                    className="h-3.5 w-3.5 border-[#eeeeee] text-[#00179e] focus:ring-[#00179e] focus:ring-offset-0 accent-[#00179e]"
                  />
                  <span className="text-[13px] text-[#767676] flex-1 truncate hover:text-[#00179e]">
                    {supplier.name}
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

      {/* Stok Durumu */}
      <FilterSection title="Stok Durumu">
        <div className="flex flex-col gap-1" role="group" aria-label="Stok durumu filtresi">
          {[
            { value: "", label: "Tümü" },
            { value: "in", label: "Stokta" },
            { value: "out", label: "Stok Yok" },
          ].map(({ value, label }) => {
            const stockValue = filters.inStock === true ? "in" : filters.inStock === false ? "out" : ""
            const isSelected = stockValue === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (value === "in") onChange({ inStock: true, page: 1 })
                  else if (value === "out") onChange({ inStock: false, page: 1 })
                  else onChange({ inStock: undefined as unknown as boolean, page: 1 })
                }}
                className={cn(
                  "flex items-center gap-2.5 py-1.5 px-2 text-[13px] transition-colors text-left rounded",
                  isSelected
                    ? "text-[#00179e] font-semibold bg-[#00179e]/5"
                    : "text-[#767676] hover:text-[#00179e]"
                )}
                aria-pressed={isSelected}
              >
                {label}
              </button>
            )
          })}
        </div>
      </FilterSection>
    </aside>
  )
}
