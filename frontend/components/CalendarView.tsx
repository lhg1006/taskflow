'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Card {
  id: string;
  title: string;
  dueDate?: string;
  isCompleted?: boolean;
  labels: string[];
  assignee?: {
    name: string;
    avatar?: string;
  };
  column?: {
    title: string;
  };
}

interface CalendarViewProps {
  cards: Card[];
  onCardClick: (cardId: string) => void;
}

export function CalendarView({ cards, onCardClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the first day of the month and number of days
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Group cards by date
  const cardsByDate = useMemo(() => {
    const grouped: Record<string, Card[]> = {};

    cards.forEach((card) => {
      if (card.dueDate) {
        const date = new Date(card.dueDate);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(card);
      }
    });

    return grouped;
  }, [cards]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayKey = (day: number) => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return checkDate < today;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // Create calendar grid
  const calendarDays = [];

  // Empty cells before the first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50 border border-gray-200" />
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = getDayKey(day);
    const dayCards = cardsByDate[dateKey] || [];
    const today = isToday(day);
    const past = isPast(day);

    calendarDays.push(
      <div
        key={day}
        className={`min-h-[120px] border border-gray-200 p-2 ${
          today ? 'bg-blue-50 border-blue-300' : past ? 'bg-gray-50' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <span
            className={`text-sm font-semibold ${
              today
                ? 'text-blue-600 bg-blue-200 px-2 py-1 rounded-full'
                : past
                ? 'text-gray-400'
                : 'text-gray-700'
            }`}
          >
            {day}
          </span>
          {dayCards.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {dayCards.length}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {dayCards.slice(0, 3).map((card) => (
            <button
              key={card.id}
              onClick={() => onCardClick(card.id)}
              className={`w-full text-left px-2 py-1 rounded text-xs truncate transition ${
                card.isCompleted
                  ? 'bg-green-100 text-green-700 line-through'
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              } border border-gray-200`}
            >
              <div className="flex items-center gap-1">
                {card.isCompleted && <span>✓</span>}
                <span className="truncate">{card.title}</span>
              </div>
            </button>
          ))}
          {dayCards.length > 3 && (
            <div className="text-xs text-gray-500 text-center py-1">
              +{dayCards.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            오늘
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`text-center font-semibold py-2 text-sm ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
        {calendarDays}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
          <span>오늘</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
          <span>지난 날짜</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-gray-200 rounded"></div>
          <span>완료된 카드</span>
        </div>
      </div>
    </div>
  );
}
