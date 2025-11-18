'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { DueDateBadge } from './DueDateBadge';

interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  column: {
    id: string;
    title: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface ArchivedCardsModalProps {
  boardId: string;
  onClose: () => void;
}

export function ArchivedCardsModal({ boardId, onClose }: ArchivedCardsModalProps) {
  const [archivedCards, setArchivedCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArchivedCards();
  }, [boardId]);

  const fetchArchivedCards = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cards/board/${boardId}/archived`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch archived cards');
      }

      const data = await response.json();
      setArchivedCards(data);
    } catch (error) {
      console.error('Failed to fetch archived cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnarchive = async (cardId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/unarchive`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to unarchive card');
      }

      // Remove from list
      setArchivedCards(archivedCards.filter((card) => card.id !== cardId));
    } catch (error) {
      console.error('Failed to unarchive card:', error);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (window.confirm('아카이브된 카드를 영구적으로 삭제하시겠습니까?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete card');
        }

        // Remove from list
        setArchivedCards(archivedCards.filter((card) => card.id !== cardId));
      } catch (error) {
        console.error('Failed to delete card:', error);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Archive className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">아카이브된 카드</h2>
              <span className="text-sm text-gray-500">
                ({archivedCards.length}개)
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : archivedCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Archive className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">아카이브된 카드가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedCards.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`font-medium text-gray-900 ${
                              card.isCompleted ? 'line-through text-gray-500' : ''
                            }`}
                          >
                            {card.title}
                          </h3>
                          {card.isCompleted && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              완료
                            </span>
                          )}
                        </div>
                        {card.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {card.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="font-medium">{card.column.title}</span>
                          {card.dueDate && (
                            <DueDateBadge dueDate={card.dueDate} size="sm" />
                          )}
                          {card.assignee && (
                            <span className="flex items-center gap-1">
                              담당자: {card.assignee.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUnarchive(card.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="복원"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              복원 버튼을 클릭하면 카드가 원래 컬럼으로 복원됩니다
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
