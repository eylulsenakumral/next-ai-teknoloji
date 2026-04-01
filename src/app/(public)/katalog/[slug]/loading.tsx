import { Skeleton } from "@/components/ui/skeleton"

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-9 w-4/5 rounded" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-7 w-36 rounded-full" />
          {/* CTA */}
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>

      {/* Specs */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-40 rounded" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  )
}
