import { formatApiError } from '../utils/errors';

export function ErrorState({ error }: { error: unknown }) {
  const { message, details } = formatApiError(error);

  return (
    <div className="bg-red-50 border border-red-300 text-red-800 rounded p-4">
      <h3 className="font-semibold mb-2">Error</h3>
      <p>{message}</p>
      {details && (
        <pre className="mt-2 bg-red-100 text-xs rounded p-2 overflow-x-auto">
          {details}
        </pre>
      )}
    </div>
  );
}
