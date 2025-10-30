export function BoardCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-300 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
        {/* Arrow skeleton */}
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </div>
      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      {/* Stats skeleton */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 w-1 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}
