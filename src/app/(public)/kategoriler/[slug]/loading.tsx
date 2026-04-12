import { Skeleton } from "@/components/ui/skeleton"

export default function CategoryDetailLoading() {
  return (
    <div className="bg-[#f9f9f9] min-h-screen">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="bg-gradient-to-r from-[#2189ff] to-[#4da6ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex items-start gap-5">
            <Skeleton className="hidden sm:block w-16 h-16 shrink-0 bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-64 bg-white/20" />
              <Skeleton className="h-4 w-96 max-w-full bg-white/15" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24 bg-white/15" />
                <Skeleton className="h-4 w-28 bg-white/15" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex-1 h-px bg-[#eeeeee]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 bg-white border border-[#eeeeee] p-4">
              <Skeleton className="w-11 h-11 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex-1 h-px bg-[#eeeeee]" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#eeeeee] flex flex-col animate-pulse">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3.5 space-y-2.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-9 w-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
