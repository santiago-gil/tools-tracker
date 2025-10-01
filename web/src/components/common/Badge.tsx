import type { TrackableStatus } from '../../types';

interface BadgeProps {
  status: TrackableStatus;
  children?: React.ReactNode;
}

export function Badge({ status, children }: BadgeProps) {
  const styles = {
    Yes: 'bg-green-50 text-green-700 border-green-200',
    No: 'bg-red-50 text-red-700 border-red-200',
    Partial: 'bg-amber-50 text-amber-700 border-amber-200',
    Special: 'bg-blue-50 text-blue-700 border-blue-200',
    Unknown: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {children || status}
    </span>
  );
}
