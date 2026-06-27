export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-[20px] border border-line bg-white p-5 shadow-soft">
      <div className="skeleton h-10 w-10 rounded-full" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={`skeleton h-3 rounded-full ${
              index === 0 ? "w-2/3" : index === rows - 1 ? "w-1/2" : "w-full"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-tapp-fade space-y-5">
      <div>
        <div className="skeleton h-3 w-32 rounded-full" />
        <div className="skeleton mt-3 h-9 w-64 rounded-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_430px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard rows={6} />
      </div>
    </div>
  );
}
