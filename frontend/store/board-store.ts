import { create } from 'zustand';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';

interface Board {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  columns?: Column[];
}

interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  cards?: Card[];
}

interface Card {
  id: string;
  title: string;
  description?: string;
  order: number;
  columnId: string;
  assigneeId?: string;
  creatorId: string;
  dueDate?: string;
  labels: string[];
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface BoardStore {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;

  fetchBoards: (workspaceId: string) => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;
  createBoard: (data: {
    name: string;
    description?: string;
    workspaceId: string;
  }) => Promise<Board>;
  updateBoard: (
    boardId: string,
    data: { name?: string; description?: string }
  ) => Promise<Board>;
  deleteBoard: (boardId: string) => Promise<void>;

  createColumn: (data: {
    title: string;
    boardId: string;
    order?: number;
  }) => Promise<Column>;
  updateColumn: (
    columnId: string,
    data: { title?: string; order?: number }
  ) => Promise<Column>;
  deleteColumn: (columnId: string) => Promise<void>;

  createCard: (data: {
    title: string;
    description?: string;
    columnId: string;
    assigneeId?: string;
    order?: number;
    dueDate?: string;
    labels?: string[];
  }) => Promise<Card>;
  updateCard: (
    cardId: string,
    data: {
      title?: string;
      description?: string;
      assigneeId?: string;
      order?: number;
      dueDate?: string;
      labels?: string[];
    }
  ) => Promise<Card>;
  moveCard: (
    cardId: string,
    data: { columnId: string; order: number }
  ) => Promise<Card>;
  deleteCard: (cardId: string) => Promise<void>;

  clearError: () => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,

  fetchBoards: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/boards?workspaceId=${workspaceId}`);
      set({ boards: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch boards',
        isLoading: false,
      });
    }
  },

  fetchBoard: async (boardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/boards/${boardId}`);
      set({ currentBoard: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch board',
        isLoading: false,
      });
    }
  },

  createBoard: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/boards', data);
      set((state) => ({
        boards: [...state.boards, response.data],
        isLoading: false,
      }));
      toast.success(`보드 "${response.data.name}"가 생성되었습니다`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '보드 생성에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  updateBoard: async (boardId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.patch(`/boards/${boardId}`, data);
      set((state) => ({
        boards: state.boards.map((b) =>
          b.id === boardId ? response.data : b
        ),
        currentBoard:
          state.currentBoard?.id === boardId
            ? response.data
            : state.currentBoard,
        isLoading: false,
      }));
      toast.success('보드가 수정되었습니다');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '보드 수정에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  deleteBoard: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/boards/${boardId}`);
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        currentBoard:
          state.currentBoard?.id === boardId ? null : state.currentBoard,
        isLoading: false,
      }));
      toast.success('보드가 삭제되었습니다');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '보드 삭제에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  createColumn: async (data) => {
    set({ error: null });
    try {
      const response = await apiClient.post('/columns', data);

      // Update current board with new column
      set((state) => {
        if (state.currentBoard && state.currentBoard.id === data.boardId) {
          return {
            currentBoard: {
              ...state.currentBoard,
              columns: [...(state.currentBoard.columns || []), response.data],
            },
          };
        }
        return state;
      });

      toast.success(`컬럼 "${response.data.title}"이 추가되었습니다`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '컬럼 생성에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
      });
      throw error;
    }
  },

  updateColumn: async (columnId, data) => {
    set({ error: null });
    try {
      const response = await apiClient.patch(`/columns/${columnId}`, data);

      // Update column in current board
      set((state) => {
        if (state.currentBoard?.columns) {
          return {
            currentBoard: {
              ...state.currentBoard,
              columns: state.currentBoard.columns.map((col) =>
                col.id === columnId ? { ...col, ...response.data } : col
              ),
            },
          };
        }
        return state;
      });

      toast.success('컬럼이 수정되었습니다');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '컬럼 수정에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
      });
      throw error;
    }
  },

  deleteColumn: async (columnId) => {
    set({ error: null });
    try {
      await apiClient.delete(`/columns/${columnId}`);

      // Remove column from current board
      set((state) => {
        if (state.currentBoard?.columns) {
          return {
            currentBoard: {
              ...state.currentBoard,
              columns: state.currentBoard.columns.filter(
                (col) => col.id !== columnId
              ),
            },
          };
        }
        return state;
      });

      toast.success('컬럼이 삭제되었습니다');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '컬럼 삭제에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
      });
      throw error;
    }
  },

  createCard: async (data) => {
    set({ error: null });
    try {
      const response = await apiClient.post('/cards', data);

      // Add card to column in current board
      set((state) => {
        if (state.currentBoard?.columns) {
          return {
            currentBoard: {
              ...state.currentBoard,
              columns: state.currentBoard.columns.map((col) =>
                col.id === data.columnId
                  ? { ...col, cards: [...(col.cards || []), response.data] }
                  : col
              ),
            },
          };
        }
        return state;
      });

      toast.success(`카드 "${response.data.title}"가 추가되었습니다`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '카드 생성에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
      });
      throw error;
    }
  },

  updateCard: async (cardId, data) => {
    set({ error: null });
    try {
      const response = await apiClient.patch(`/cards/${cardId}`, data);

      // Update card in current board
      set((state) => {
        if (state.currentBoard?.columns) {
          return {
            currentBoard: {
              ...state.currentBoard,
              columns: state.currentBoard.columns.map((col) => ({
                ...col,
                cards: col.cards?.map((card) =>
                  card.id === cardId ? { ...card, ...response.data } : card
                ),
              })),
            },
          };
        }
        return state;
      });

      toast.success('카드가 수정되었습니다');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '카드 수정에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
      });
      throw error;
    }
  },

  moveCard: async (cardId, data) => {
    set({ error: null });
    try {
      const response = await apiClient.patch(`/cards/${cardId}/move`, data);

      // Move card in current board
      set((state) => {
        if (state.currentBoard?.columns) {
          // Remove card from old column
          const updatedColumns = state.currentBoard.columns.map((col) => ({
            ...col,
            cards: col.cards?.filter((card) => card.id !== cardId),
          }));

          // Add card to new column
          const finalColumns = updatedColumns.map((col) =>
            col.id === data.columnId
              ? {
                  ...col,
                  cards: [
                    ...(col.cards || []).slice(0, data.order),
                    response.data,
                    ...(col.cards || []).slice(data.order),
                  ],
                }
              : col
          );

          return {
            currentBoard: {
              ...state.currentBoard,
              columns: finalColumns,
            },
          };
        }
        return state;
      });

      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to move card',
      });
      throw error;
    }
  },

  deleteCard: async (cardId) => {
    set({ error: null });
    try {
      await apiClient.delete(`/cards/${cardId}`);

      // Remove card from current board
      set((state) => {
        if (state.currentBoard?.columns) {
          return {
            currentBoard: {
              ...state.currentBoard,
              columns: state.currentBoard.columns.map((col) => ({
                ...col,
                cards: col.cards?.filter((card) => card.id !== cardId),
              })),
            },
          };
        }
        return state;
      });

      toast.success('카드가 삭제되었습니다');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '카드 삭제에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
