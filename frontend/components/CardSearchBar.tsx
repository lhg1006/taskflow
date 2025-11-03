'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Avatar } from './Avatar';
import { DueDateBadge } from './DueDateBadge';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Card {
  id: string;
  title: string;
  description: string;
  assignee?: User;
  creator: User;
  labels: string[];
  dueDate?: string;
  column: {
    id: string;
    title: string;
  };
}

interface CardSearchBarProps {
  boardId: string;
  members: User[];
  onCardClick?: (cardId: string) => void;
}

export const CardSearchBar = ({ boardId, members, onCardClick }: CardSearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const availableLabels = [
    '긴급',
    '버그',
    '기능',
    '개선',
    '디자인',
    '백엔드',
    '프론트엔드',
    '문서',
  ];

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (isExpanded && (keyword || selectedAssigneeId || selectedLabels.length > 0 || dueDateFilter)) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [keyword, selectedAssigneeId, selectedLabels, dueDateFilter, isExpanded]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      params.append('boardId', boardId);
      if (keyword) params.append('keyword', keyword);
      if (selectedAssigneeId) params.append('assigneeId', selectedAssigneeId);
      if (selectedLabels.length > 0) {
        selectedLabels.forEach(label => params.append('labels', label));
      }
      if (dueDateFilter) params.append('dueDateFilter', dueDateFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cards/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLabelToggle = (label: string) => {
    setSelectedLabels(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const clearFilters = () => {
    setKeyword('');
    setSelectedAssigneeId('');
    setSelectedLabels([]);
    setDueDateFilter('');
    setSearchResults([]);
  };

  const hasActiveFilters = keyword || selectedAssigneeId || selectedLabels.length > 0 || dueDateFilter;

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            if (!isExpanded) setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          placeholder="카드 검색..."
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />

        <div className="absolute right-2 top-1.5 flex gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded hover:bg-gray-100 ${hasActiveFilters ? 'text-blue-600' : 'text-gray-400'}`}
            title="필터"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
          {isExpanded && hasActiveFilters && (
            <button
              onClick={() => {
                clearFilters();
                setIsExpanded(false);
              }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
              title="닫기"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      {isExpanded && showFilters && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-4">
            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당자
              </label>
              <select
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Labels Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                라벨
              </label>
              <div className="flex flex-wrap gap-2">
                {availableLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => handleLabelToggle(label)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedLabels.includes(label)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마감일
              </label>
              <select
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="overdue">지연됨</option>
                <option value="upcoming">다가오는 일주일</option>
                <option value="none">마감일 없음</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isExpanded && hasActiveFilters && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-40">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              검색 중...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {searchResults.map((card) => (
                <div
                  key={card.id}
                  onClick={() => {
                    onCardClick?.(card.id);
                    setIsExpanded(false);
                  }}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {card.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {card.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {card.column.title}
                        </span>
                        {card.labels.map((label) => (
                          <span
                            key={label}
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {card.assignee && (
                        <Avatar
                          name={card.assignee.name}
                          src={card.assignee.avatar}
                          size="xs"
                        />
                      )}
                      {card.dueDate && (
                        <DueDateBadge dueDate={card.dueDate} size="sm" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};
