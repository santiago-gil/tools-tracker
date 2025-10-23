export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_: unknown, i: number) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-100 rounded w-32" />
            </div>
            <div className="flex gap-3">
              <div className="h-6 bg-gray-200 rounded-full w-12" />
              <div className="h-6 bg-gray-200 rounded-full w-12" />
              <div className="h-6 bg-gray-200 rounded-full w-12" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
