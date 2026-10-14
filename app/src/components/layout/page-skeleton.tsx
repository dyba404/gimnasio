import { Skeleton } from '@/components/ui/skeleton'

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, indice) => (
          <Skeleton key={indice} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
