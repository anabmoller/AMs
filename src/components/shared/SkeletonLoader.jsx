export function SkeletonCard() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-white/[0.08] rounded w-3/4 mb-3" />
      <div className="h-3 bg-white/[0.05] rounded w-1/2 mb-2" />
      <div className="h-3 bg-white/[0.05] rounded w-2/3" />
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 animate-pulse">
      <div className="h-3 bg-white/[0.05] rounded w-1/2 mb-3" />
      <div className="h-8 bg-white/[0.08] rounded w-2/3 mb-2" />
      <div className="h-3 bg-white/[0.05] rounded w-1/3" />
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
