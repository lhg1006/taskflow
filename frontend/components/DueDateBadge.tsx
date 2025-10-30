import { Clock } from 'lucide-react';

interface DueDateBadgeProps {
  dueDate: string;
}

export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let colorClass = 'bg-gray-100 text-gray-700';
  let text = '';

  if (diffDays < 0) {
    colorClass = 'bg-red-100 text-red-700';
    text = `${Math.abs(diffDays)}일 지남`;
  } else if (diffDays === 0) {
    colorClass = 'bg-orange-100 text-orange-700';
    text = '오늘';
  } else if (diffDays === 1) {
    colorClass = 'bg-yellow-100 text-yellow-700';
    text = '내일';
  } else if (diffDays <= 3) {
    colorClass = 'bg-yellow-100 text-yellow-700';
    text = `D-${diffDays}`;
  } else if (diffDays <= 7) {
    colorClass = 'bg-blue-100 text-blue-700';
    text = `D-${diffDays}`;
  } else {
    colorClass = 'bg-gray-100 text-gray-700';
    text = due.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
    >
      <Clock className="w-3 h-3" />
      {text}
    </span>
  );
}
