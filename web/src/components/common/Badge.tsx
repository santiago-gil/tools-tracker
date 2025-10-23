import type { TrackableStatus } from '../../types';

const statusConfig: Record<
  TrackableStatus,
  { bg: string; text: string; border: string }
> = {
  Yes: {
    bg: 'var(--badge-yes-bg)',
    text: 'var(--badge-yes-text)',
    border: 'var(--badge-yes-border)',
  },
  No: {
    bg: 'var(--badge-no-bg)',
    text: 'var(--badge-no-text)',
    border: 'var(--badge-no-border)',
  },
  Partial: {
    bg: 'var(--badge-partial-bg)',
    text: 'var(--badge-partial-text)',
    border: 'var(--badge-partial-border)',
  },
  Special: {
    bg: 'var(--badge-special-bg)',
    text: 'var(--badge-special-text)',
    border: 'var(--badge-special-border)',
  },
  Unknown: {
    bg: 'var(--badge-unknown-bg)',
    text: 'var(--badge-unknown-text)',
    border: 'var(--badge-unknown-border)',
  },
};

interface BadgeProps {
  status: TrackableStatus;
  compact?: boolean;
}

export function Badge({ status, compact }: BadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`badge-enhanced ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      {status}
    </span>
  );
}
