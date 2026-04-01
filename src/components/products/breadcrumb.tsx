import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const all = [{ label: "Ana Sayfa", href: "/" }, ...items]

  return (
    <nav aria-label="Sayfa konumu" className={cn("flex items-center gap-1 text-sm", className)}>
      {all.map((item, index) => {
        const isLast = index === all.length - 1
        return (
          <span key={index} className="flex items-center gap-1">
            {index === 0 && (
              <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {index === 0 ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  item.label
                )}
              </Link>
            ) : (
              <span
                className={cn(
                  "text-muted-foreground",
                  isLast && "truncate max-w-[300px]",
                  index === 0 && "sr-only"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                aria-hidden
              />
            )}
          </span>
        )
      })}
    </nav>
  )
}
