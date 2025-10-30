'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useBoardStore } from '@/store/board-store';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '@/components/Avatar';
import { PriorityBadge } from '@/components/PriorityBadge';
import { DueDateBadge } from '@/components/DueDateBadge';
import { HelpModal } from '@/components/HelpModal';
import { AnimatedModal } from '@/components/AnimatedModal';
import { KanbanColumnSkeleton } from '@/components/skeletons/KanbanColumnSkeleton';
import { MessageSquare, Paperclip, CheckSquare, HelpCircle, MoreVertical, Edit2, Trash2, Settings, Menu, X, Plus } from 'lucide-react';

interface Card {
  id: string;
  title: string;
  description?: string;
  order: number;
  columnId: string;
  dueDate?: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
  labels: string[];
  commentsCount?: number;
  attachmentsCount?: number;
  checklistTotal?: number;
  checklistCompleted?: number;
}

interface Column {
  id: string;
  title: string;
  order: number;
  cards?: Card[];
}

// Sortable Card Component
function SortableCard({
  card,
  onClick,
}: {
  card: Card;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasMetadata =
    card.dueDate ||
    card.commentsCount ||
    card.attachmentsCount ||
    card.checklistTotal;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all border-l-4 border-blue-500 group relative"
    >
      {/* 드래그 핸들 */}
      <div
        {...listeners}
        className="absolute top-3 right-3 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="w-6 h-5 flex flex-col justify-center gap-1 bg-gray-100 rounded p-1">
          <div className="h-0.5 bg-gray-400 rounded"></div>
          <div className="h-0.5 bg-gray-400 rounded"></div>
          <div className="h-0.5 bg-gray-400 rounded"></div>
        </div>
      </div>

      <div onClick={onClick} className="cursor-pointer pr-8">
      {/* Title */}
      <h4 className="font-semibold text-gray-900 mb-2 text-base">{card.title}</h4>

      {/* Description */}
      {card.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-medium"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Due Date */}
      {card.dueDate && (
        <div className="mb-2">
          <DueDateBadge dueDate={card.dueDate} />
        </div>
      )}

      {/* Bottom Row: Metadata + Assignee */}
      {(hasMetadata || card.assignee) && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          {/* Metadata Icons */}
          {hasMetadata && (
            <div className="flex items-center gap-3 text-gray-500">
              {/* Checklist */}
              {card.checklistTotal !== undefined && card.checklistTotal > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    {card.checklistCompleted || 0}/{card.checklistTotal}
                  </span>
                </div>
              )}

              {/* Comments */}
              {card.commentsCount !== undefined && card.commentsCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{card.commentsCount}</span>
                </div>
              )}

              {/* Attachments */}
              {card.attachmentsCount !== undefined &&
                card.attachmentsCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{card.attachmentsCount}</span>
                  </div>
                )}
            </div>
          )}

          {/* Assignee */}
          {card.assignee && (
            <div className="flex items-center gap-1.5">
              <Avatar
                name={card.assignee.name}
                avatar={card.assignee.avatar}
                size="sm"
              />
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

// Column Component
function KanbanColumn({
  column,
  onAddCard,
  onCardClick,
  onEdit,
  onDelete,
}: {
  column: Column;
  onAddCard: (columnId: string) => void;
  onCardClick: (card: Card) => void;
  onEdit?: (columnId: string) => void;
  onDelete?: (columnId: string) => void;
}) {
  const cards = column.cards || [];
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex flex-col min-w-[280px] sm:min-w-[320px] w-[85vw] sm:w-auto sm:max-w-[320px] h-full snap-center">
      {/* 컬럼 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg px-3 sm:px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <h3 className="font-bold text-white text-base">
              {column.title}
            </h3>
            <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {cards.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* 컬럼 메뉴 */}
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-md transition cursor-pointer"
                  title="컬럼 옵션"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-10 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                      {onEdit && (
                        <button
                          onClick={() => {
                            onEdit(column.id);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" /> 수정
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            onDelete(column.id);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> 삭제
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={() => onAddCard(column.id)}
              className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-md transition text-lg font-bold cursor-pointer"
              title="카드 추가"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 컬럼 본문 */}
      <div className={`bg-gray-50 rounded-b-lg p-3 flex-1 border-2 ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      } transition-colors`}>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="space-y-3 min-h-[300px]">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">카드를 추가하거나</p>
                <p className="text-sm">여기로 드래그하세요</p>
              </div>
            ) : (
              cards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  onClick={() => onCardClick(card)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;

  const { user, checkAuth, logout } = useAuthStore();
  const {
    currentBoard,
    fetchBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    updateBoard,
    deleteBoard,
    moveCard,
    isLoading,
  } = useBoardStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showEditColumnModal, setShowEditColumnModal] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editColumnTitle, setEditColumnTitle] = useState('');
  const [editBoardName, setEditBoardName] = useState('');
  const [editBoardDesc, setEditBoardDesc] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activeCard = findCard(active.id as string);
    if (!activeCard) {
      setActiveId(null);
      return;
    }

    const overCard = findCard(over.id as string);
    let targetColumnId: string;
    let newOrder = 0;

    if (overCard) {
      // Dropped on another card
      targetColumnId = overCard.columnId;
      const column = currentBoard?.columns?.find((c) => c.id === targetColumnId);
      if (column?.cards) {
        const overIndex = column.cards.findIndex((c) => c.id === over.id);
        newOrder = overIndex;
      }
    } else {
      // Dropped on a column (empty area)
      const overColumn = currentBoard?.columns?.find((c) => c.id === over.id);
      if (overColumn) {
        targetColumnId = overColumn.id;
        // Add to the end of the column
        newOrder = overColumn.cards?.length || 0;
      } else {
        setActiveId(null);
        return;
      }
    }

    // Move the card
    try {
      await moveCard(active.id as string, {
        columnId: targetColumnId,
        order: newOrder,
      });
      await fetchBoard(boardId);
    } catch (error) {
      console.error('Failed to move card:', error);
    }

    setActiveId(null);
  };

  const findCard = (cardId: string) => {
    for (const column of currentBoard?.columns || []) {
      const card = column.cards?.find((c) => c.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId) return;

    try {
      await createColumn({
        title: newColumnTitle,
        boardId,
      });
      setShowColumnModal(false);
      setNewColumnTitle('');
      await fetchBoard(boardId);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumnId) return;

    try {
      await createCard({
        title: newCardTitle,
        description: newCardDesc || undefined,
        columnId: selectedColumnId,
      });
      setShowCardModal(false);
      setNewCardTitle('');
      setNewCardDesc('');
      setSelectedColumnId('');
      await fetchBoard(boardId);
    } catch (error) {
      // Error handled in store
    }
  };

  const openAddCardModal = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowCardModal(true);
  };

  const handleEditColumn = (columnId: string) => {
    const column = currentBoard?.columns?.find((c) => c.id === columnId);
    if (column) {
      setSelectedColumnId(columnId);
      setEditColumnTitle(column.title);
      setShowEditColumnModal(true);
    }
  };

  const handleUpdateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumnId || !editColumnTitle.trim()) return;

    try {
      await updateColumn(selectedColumnId, { title: editColumnTitle });
      setShowEditColumnModal(false);
      setEditColumnTitle('');
      setSelectedColumnId('');
      await fetchBoard(boardId);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = currentBoard?.columns?.find((c) => c.id === columnId);
    if (!column) return;

    const cardCount = column.cards?.length || 0;
    const message =
      cardCount > 0
        ? `이 컬럼에 ${cardCount}개의 카드가 있습니다. 컬럼과 함께 모든 카드가 삭제됩니다. 계속하시겠습니까?`
        : '이 컬럼을 삭제하시겠습니까?';

    if (window.confirm(message)) {
      try {
        await deleteColumn(columnId);
        await fetchBoard(boardId);
      } catch (error) {
        console.error('Failed to delete column:', error);
      }
    }
  };

  const handleEditBoard = () => {
    if (currentBoard) {
      setEditBoardName(currentBoard.name);
      setEditBoardDesc(currentBoard.description || '');
      setShowEditBoardModal(true);
      setShowBoardMenu(false);
    }
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId || !editBoardName.trim()) return;

    try {
      await updateBoard(boardId, {
        name: editBoardName,
        description: editBoardDesc || undefined,
      });
      setShowEditBoardModal(false);
      setEditBoardName('');
      setEditBoardDesc('');
      await fetchBoard(boardId);
    } catch (error) {
      console.error('Failed to update board:', error);
    }
  };

  const handleDeleteBoard = async () => {
    if (!currentBoard) return;

    const columnCount = currentBoard.columns?.length || 0;
    const totalCards = currentBoard.columns?.reduce(
      (sum, col) => sum + (col.cards?.length || 0),
      0
    ) || 0;

    let message = '이 보드를 삭제하시겠습니까?';
    if (columnCount > 0 || totalCards > 0) {
      message = `이 보드에 ${columnCount}개의 컬럼과 ${totalCards}개의 카드가 있습니다. 보드와 함께 모든 데이터가 삭제됩니다. 계속하시겠습니까?`;
    }

    if (window.confirm(message)) {
      try {
        await deleteBoard(boardId);
        router.push(`/workspace/${currentBoard.workspaceId}`);
      } catch (error) {
        console.error('Failed to delete board:', error);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b-2 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-500 hover:text-blue-600 transition cursor-pointer hidden md:block"
                >
                  대시보드
                </button>
                <span className="text-gray-400 hidden md:block">/</span>
                <button
                  onClick={() =>
                    router.push(`/workspace/${currentBoard?.workspaceId}`)
                  }
                  className="text-gray-500 hover:text-blue-600 transition cursor-pointer hidden sm:block"
                >
                  워크스페이스
                </button>
                <span className="text-gray-400 hidden sm:block">/</span>
                <span className="text-blue-600 font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                  {currentBoard?.name || 'Board'}
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Board Settings Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowBoardMenu(!showBoardMenu)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  title="보드 설정"
                >
                  <Settings className="w-5 h-5" />
                </button>
                {showBoardMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowBoardMenu(false)} />
                    <div className="absolute right-0 top-12 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
                      <button
                        onClick={handleEditBoard}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" /> 보드 수정
                      </button>
                      <button
                        onClick={() => {
                          setShowBoardMenu(false);
                          handleDeleteBoard();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> 보드 삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                title="사용 가이드"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowColumnModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm cursor-pointer"
              >
                + 컬럼 추가
              </button>
              <span className="text-sm text-gray-700">{user.name}님</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                로그아웃
              </button>
            </div>

            {/* Mobile Add Column Button + Menu */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={() => setShowColumnModal(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                title="컬럼 추가"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <div className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg">
                  {user.name}님
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  대시보드로 이동
                </button>
                <button
                  onClick={() => router.push(`/workspace/${currentBoard?.workspaceId}`)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  워크스페이스로 이동
                </button>
                <button
                  onClick={() => {
                    handleEditBoard();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  보드 수정
                </button>
                <button
                  onClick={() => {
                    setShowHelpModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  사용 가이드
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleDeleteBoard();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  보드 삭제
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Board Content */}
      <main className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 페이지 타이틀 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📊 {currentBoard?.name || 'Board'}
            </h2>
            <p className="text-gray-600 text-sm">
              컬럼 간 카드를 드래그하여 작업 상태를 변경하세요
            </p>
          </div>

          {isLoading ? (
            <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth">
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth">
              {currentBoard?.columns
                ?.sort((a, b) => a.order - b.order)
                .map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    onAddCard={openAddCardModal}
                    onCardClick={(card) => router.push(`/board/${boardId}/card/${card.id}`)}
                    onEdit={handleEditColumn}
                    onDelete={handleDeleteColumn}
                  />
                ))}

              {(!currentBoard?.columns || currentBoard.columns.length === 0) && (
                <div className="flex items-center justify-center min-h-[400px] w-full">
                  <div className="text-center">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      컬럼이 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      첫 번째 컬럼을 만들어 시작하세요
                    </p>
                    <button
                      onClick={() => setShowColumnModal(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                    >
                      컬럼 만들기
                    </button>
                  </div>
                </div>
              )}
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 rotate-3">
                  <p className="font-medium text-gray-900">
                    {findCard(activeId)?.title}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
            </DndContext>
          )}
        </div>
      </main>

      {/* Add Column Modal */}
      <AnimatedModal isOpen={showColumnModal} onClose={() => setShowColumnModal(false)}>
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            새 컬럼 추가
          </h3>
          <form onSubmit={handleAddColumn}>
            <div className="mb-6">
              <label
                htmlFor="columnTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                컬럼 이름 *
              </label>
              <input
                id="columnTitle"
                type="text"
                required
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="할 일"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowColumnModal(false);
                  setNewColumnTitle('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                추가
              </button>
            </div>
          </form>
        </div>
      </AnimatedModal>

      {/* Edit Column Modal */}
      <AnimatedModal isOpen={showEditColumnModal} onClose={() => setShowEditColumnModal(false)}>
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            컬럼 수정
          </h3>
          <form onSubmit={handleUpdateColumn}>
            <div className="mb-6">
              <label
                htmlFor="editColumnTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                컬럼 이름 *
              </label>
              <input
                id="editColumnTitle"
                type="text"
                required
                value={editColumnTitle}
                onChange={(e) => setEditColumnTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="할 일"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditColumnModal(false);
                  setEditColumnTitle('');
                  setSelectedColumnId('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                수정
              </button>
            </div>
          </form>
        </div>
      </AnimatedModal>

      {/* Add Card Modal */}
      <AnimatedModal isOpen={showCardModal} onClose={() => setShowCardModal(false)}>
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            새 카드 추가
          </h3>
          <form onSubmit={handleAddCard}>
            <div className="mb-4">
              <label
                htmlFor="cardTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                제목 *
              </label>
              <input
                id="cardTitle"
                type="text"
                required
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="작업 제목"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="cardDesc"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                설명 (선택)
              </label>
              <textarea
                id="cardDesc"
                value={newCardDesc}
                onChange={(e) => setNewCardDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="작업에 대한 설명"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCardModal(false);
                  setNewCardTitle('');
                  setNewCardDesc('');
                  setSelectedColumnId('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                추가
              </button>
            </div>
          </form>
        </div>
      </AnimatedModal>

      {/* Edit Board Modal */}
      <AnimatedModal isOpen={showEditBoardModal} onClose={() => setShowEditBoardModal(false)}>
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            보드 수정
          </h3>
          <form onSubmit={handleUpdateBoard}>
            <div className="mb-4">
              <label
                htmlFor="editBoardName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이름 *
              </label>
              <input
                id="editBoardName"
                type="text"
                required
                value={editBoardName}
                onChange={(e) => setEditBoardName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024 Q4 프로젝트"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="editBoardDesc"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                설명 (선택)
              </label>
              <textarea
                id="editBoardDesc"
                value={editBoardDesc}
                onChange={(e) => setEditBoardDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="보드에 대한 설명을 입력하세요"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditBoardModal(false);
                  setEditBoardName('');
                  setEditBoardDesc('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                수정
              </button>
            </div>
          </form>
        </div>
      </AnimatedModal>

      {/* Help Modal */}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </motion.div>
  );
}
