import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="h-14 bg-primary/90 border-b">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg bg-white/20" />
          <Skeleton className="h-4 w-28 bg-white/20" />
          <div className="hidden md:flex gap-2 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-md bg-white/20" />
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md bg-white/20" />
            <Skeleton className="h-8 w-24 rounded-md bg-white/20" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        <Skeleton className="h-20 w-full rounded-xl" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
