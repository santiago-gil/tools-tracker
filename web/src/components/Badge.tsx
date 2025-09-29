interface BadgeProps {
  status: string;
}

export function Badge({ status }: BadgeProps) {
  const map: Record<string, string> = {
    Yes: 'bg-[#e6ffed] text-[#047857] border border-[#bbf7d0]',
    No: 'bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]',
    Partial: 'bg-[#fff7ed] text-[#b45309] border border-[#fed7aa]',
    Special: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    Unknown: 'bg-gray-100 text-gray-800 border border-gray-200',
  };

  const statusTextMap: Record<string, string> = {
    Yes: 'Y',
    No: 'N',
    Partial: '?',
    Special: '*',
    Unknown: '-',
  };

  return (
    <span
      className={`whitespace-nowrap text-xs font-mono px-2.5 py-0.5 rounded-full ${map[status] ?? map.Unknown}`}
    >
      {statusTextMap[status] || status}
    </span>
  );
}
