import { AlertCircle } from 'lucide-react';

type Priority = 'urgent' | 'high' | 'medium' | 'low';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig = {
  urgent: {
    label: '긴급',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: true,
  },
  high: {
    label: '높음',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: false,
  },
  medium: {
    label: '보통',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: false,
  },
  low: {
    label: '낮음',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: false,
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}
    >
      {config.icon && <AlertCircle className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
