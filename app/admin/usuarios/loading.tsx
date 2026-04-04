import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function UsuariosLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-28 sm:h-8 sm:w-32" />
          <Skeleton className="h-4 w-48 sm:w-56" />
        </div>
        <Skeleton className="h-9 w-full sm:w-36" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-2 sm:py-3">
            <CardContent className="flex items-center gap-2 px-3 py-0 sm:gap-3 sm:px-4">
              <Skeleton className="hidden h-9 w-9 rounded-lg sm:block" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-10 sm:h-7 sm:w-12" />
                <Skeleton className="h-3 w-16 sm:w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-9 flex-1" />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Skeleton className="h-9 sm:w-[130px]" />
              <Skeleton className="h-9 sm:w-[170px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 border-b px-2 py-3 last:border-b-0 sm:gap-4 sm:px-4"
              >
                <Skeleton className="h-8 w-8 shrink-0 rounded-full sm:h-9 sm:w-9" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28 sm:w-36" />
                  <Skeleton className="h-3 w-16 sm:hidden" />
                </div>
                <Skeleton className="hidden h-5 w-20 sm:block" />
                <Skeleton className="hidden h-5 w-40 md:block" />
                <Skeleton className="hidden h-5 w-16 sm:block" />
                <Skeleton className="h-5 w-14" />
                <Skeleton className="hidden h-5 w-20 lg:block" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
          {/* Pagination skeleton */}
          <div className="flex items-center justify-between border-t px-3 py-2.5 sm:px-4 sm:py-3">
            <Skeleton className="h-4 w-20 sm:w-32" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-4 w-8 sm:hidden" />
              <Skeleton className="hidden h-7 w-7 sm:block" />
              <Skeleton className="hidden h-7 w-7 sm:block" />
              <Skeleton className="hidden h-7 w-7 sm:block" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
