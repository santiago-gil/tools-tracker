export interface SKRecommendedBadgeProps {
  isRecommended: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function SKRecommendedBadge({
  isRecommended,
  children,
  className = '',
  onClick,
}: SKRecommendedBadgeProps) {
  const baseClasses =
    'flex items-center p-4 border rounded-lg transition-all duration-200 w-fit';
  const recommendedClasses = 'badge-holographic';
  const defaultClasses =
    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:badge-holographic';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.key === ' ') {
        event.preventDefault(); // Prevent scrolling on space
      }
      onClick?.();
    }
  };

  return (
    <div
      className={`${baseClasses} ${isRecommended ? recommendedClasses : defaultClasses} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {children}
    </div>
  );
}
