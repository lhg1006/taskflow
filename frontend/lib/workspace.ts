import { api } from './api';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
}

export interface InviteMemberData {
  email: string;
  role?: 'ADMIN' | 'MEMBER';
}

export const workspaceApi = {
  create: async (data: CreateWorkspaceData): Promise<Workspace> => {
    const response = await api.post('/workspaces', data);
    return response.data;
  },

  getAll: async (): Promise<Workspace[]> => {
    const response = await api.get('/workspaces');
    return response.data;
  },

  getById: async (id: string): Promise<Workspace> => {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateWorkspaceData): Promise<Workspace> => {
    const response = await api.patch(`/workspaces/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workspaces/${id}`);
  },

  inviteMember: async (id: string, data: InviteMemberData): Promise<WorkspaceMember> => {
    const response = await api.post(`/workspaces/${id}/invite`, data);
    return response.data;
  },

  removeMember: async (id: string, memberId: string): Promise<void> => {
    await api.delete(`/workspaces/${id}/members/${memberId}`);
  },

  getMembers: async (id: string): Promise<WorkspaceMember[]> => {
    const response = await api.get(`/workspaces/${id}`);
    return response.data.members || [];
  },
};
