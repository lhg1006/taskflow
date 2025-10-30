export function KanbanCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-300 animate-pulse">
      {/* Title skeleton */}
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>

      {/* Description skeleton */}
      <div className="space-y-2 mb-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Labels skeleton */}
      <div className="flex gap-1 mb-2">
        <div className="h-5 w-16 bg-gray-200 rounded"></div>
        <div className="h-5 w-20 bg-gray-200 rounded"></div>
      </div>

      {/* Metadata skeleton */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-4 w-12 bg-gray-200 rounded"></div>
          <div className="h-4 w-12 bg-gray-200 rounded"></div>
        </div>
        {/* Avatar skeleton */}
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
}
