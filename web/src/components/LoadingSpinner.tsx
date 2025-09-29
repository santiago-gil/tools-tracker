export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
      <span className="ml-2 text-gray-600 text-sm">Loading…</span>
    </div>
  );
}
