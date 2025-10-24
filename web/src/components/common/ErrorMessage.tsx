export interface ErrorMessageProps {
  message: string;
  className?: string;
  id?: string;
}

export function ErrorMessage({ message, className = '', id }: ErrorMessageProps) {
  return (
    <p
      id={id}
      className={`text-xs text-red-600 mt-1 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </p>
  );
}
