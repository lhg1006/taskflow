import { create } from 'zustand';
import toast from 'react-hot-toast';
import { workspaceApi, Workspace, CreateWorkspaceData, UpdateWorkspaceData, InviteMemberData } from '@/lib/workspace';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>;
  updateWorkspace: (id: string, data: UpdateWorkspaceData) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  inviteMember: (id: string, data: InviteMemberData) => Promise<void>;
  removeMember: (id: string, memberId: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await workspaceApi.getAll();
      set({ workspaces, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '워크스페이스 목록을 불러오는데 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  fetchWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspaceApi.getById(id);
      set({ currentWorkspace: workspace, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  createWorkspace: async (data: CreateWorkspaceData) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspaceApi.create(data);
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        isLoading: false,
      }));
      toast.success(`워크스페이스 "${workspace.name}"가 생성되었습니다`);
      return workspace;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '워크스페이스 생성에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  updateWorkspace: async (id: string, data: UpdateWorkspaceData) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspaceApi.update(id, data);
      set((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === id ? workspace : w)),
        currentWorkspace: state.currentWorkspace?.id === id ? workspace : state.currentWorkspace,
        isLoading: false,
      }));
      toast.success('워크스페이스가 수정되었습니다');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '워크스페이스 수정에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  deleteWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.delete(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
      }));
      toast.success('워크스페이스가 삭제되었습니다');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '워크스페이스 삭제에 실패했습니다';
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  inviteMember: async (id: string, data: InviteMemberData) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.inviteMember(id, data);
      // Refresh workspace to get updated members
      await get().fetchWorkspace(id);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to invite member',
        isLoading: false,
      });
      throw error;
    }
  },

  removeMember: async (id: string, memberId: string) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.removeMember(id, memberId);
      // Refresh workspace to get updated members
      await get().fetchWorkspace(id);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to remove member',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentWorkspace: (workspace: Workspace | null) => {
    set({ currentWorkspace: workspace });
  },
}));
