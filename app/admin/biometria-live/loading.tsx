import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function BiometriaLiveLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-44 sm:h-8 sm:w-52" />
          <Skeleton className="h-4 w-60 sm:w-72" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-2 sm:py-3">
            <CardContent className="flex items-center gap-2 px-3 py-0 sm:gap-3 sm:px-4">
              <Skeleton className="hidden h-9 w-9 rounded-lg sm:block" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-8 sm:h-7 sm:w-10" />
                <Skeleton className="h-3 w-16 sm:w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event cards */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="py-2">
              <CardContent className="flex items-center gap-3 px-3 py-0 sm:px-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40 sm:w-52" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
