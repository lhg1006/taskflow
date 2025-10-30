import { KanbanCardSkeleton } from './KanbanCardSkeleton';

export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col min-w-[280px] sm:min-w-[320px] w-[85vw] sm:w-auto sm:max-w-[320px] h-full snap-center">
      {/* Column header skeleton */}
      <div className="bg-gray-200 rounded-t-lg px-3 sm:px-4 py-3 shadow-md animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="h-5 w-24 bg-gray-300 rounded"></div>
            <div className="h-5 w-8 bg-gray-300/50 rounded-full"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 bg-gray-300 rounded-md"></div>
            <div className="w-7 h-7 bg-gray-300 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Column body skeleton */}
      <div className="bg-gray-50 rounded-b-lg p-3 flex-1 border-2 border-gray-200">
        <div className="space-y-3">
          <KanbanCardSkeleton />
          <KanbanCardSkeleton />
          <KanbanCardSkeleton />
        </div>
      </div>
    </div>
  );
}
