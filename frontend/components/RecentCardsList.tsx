'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DueDateBadge } from './DueDateBadge';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  labels?: string[];
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  column: {
    id: string;
    title: string;
    board: {
      id: string;
      name: string;
    };
  };
  updatedAt: string;
  isCompleted?: boolean;
}

interface RecentCardsListProps {
  cards: Card[];
}

export const RecentCardsList = ({ cards }: RecentCardsListProps) => {
  const router = useRouter();

  if (cards.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동 카드</h3>
        <div className="flex items-center justify-center h-32 text-gray-500">
          최근 활동이 없습니다
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동 카드</h3>
      <div className="space-y-3">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ scale: 1.01 }}
            onClick={() => router.push(`/board/${card.column.board.id}/card/${card.id}`)}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold ${card.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {card.title}
                  </h4>
                  {card.isCompleted && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      완료
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {card.column.board.name} / {card.column.title}
                </p>
                {card.labels && card.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {card.labels.map((label, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
                {card.dueDate && (
                  <div className="mb-2">
                    <DueDateBadge dueDate={card.dueDate} />
                  </div>
                )}
              </div>
              <div className="ml-4 text-right">
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(card.updatedAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
                {card.assignee && (
                  <div className="mt-2 flex items-center justify-end">
                    {card.assignee.avatar ? (
                      <img
                        src={card.assignee.avatar}
                        alt={card.assignee.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                        {card.assignee.name[0]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
