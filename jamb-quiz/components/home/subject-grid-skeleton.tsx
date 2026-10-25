import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SubjectGridSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-8 pb-6 sm:px-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-6 w-40" />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card
            key={index}
            className="min-h-36 gap-0 border-border/70 bg-card/50 py-0"
          >
            <div className="p-3.5 pb-2">
              <Skeleton className="size-10 rounded-xl" />
            </div>
            <div className="space-y-2 px-3.5 pb-3.5">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-2.5 w-2/5" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
