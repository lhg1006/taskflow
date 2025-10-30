import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export as apiClient for compatibility
export const apiClient = api;

// Comment API
export const commentApi = {
  // Create a comment
  create: async (data: { cardId: string; content: string }) => {
    const response = await api.post('/comments', data);
    return response.data;
  },

  // Get comments for a card
  getByCardId: async (cardId: string) => {
    const response = await api.get(`/comments?cardId=${cardId}`);
    return response.data;
  },

  // Update a comment
  update: async (id: string, data: { content: string }) => {
    const response = await api.patch(`/comments/${id}`, data);
    return response.data;
  },

  // Delete a comment
  delete: async (id: string) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },
};

// Attachment API
export const attachmentApi = {
  // Upload an attachment
  upload: async (cardId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cardId', cardId);

    const response = await api.post('/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get attachments for a card
  getByCardId: async (cardId: string) => {
    const response = await api.get(`/attachments?cardId=${cardId}`);
    return response.data;
  },

  // Download an attachment
  download: async (id: string, filename: string) => {
    const response = await api.get(`/attachments/${id}/download`, {
      responseType: 'blob',
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Delete an attachment
  delete: async (id: string) => {
    const response = await api.delete(`/attachments/${id}`);
    return response.data;
  },
};

// Activity API
export const activityApi = {
  // Get activities for a card
  getByCardId: async (cardId: string) => {
    const response = await api.get(`/activities?cardId=${cardId}`);
    return response.data;
  },
};

// Notification API
export const notificationApi = {
  // Get user notifications
  getAll: async (unreadOnly = false) => {
    const response = await api.get(`/notifications?unreadOnly=${unreadOnly}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  // Accept workspace invitation
  acceptInvitation: async (invitationId: string) => {
    const response = await api.post(`/workspaces/invitations/${invitationId}/accept`);
    return response.data;
  },

  // Reject workspace invitation
  rejectInvitation: async (invitationId: string) => {
    const response = await api.post(`/workspaces/invitations/${invitationId}/reject`);
    return response.data;
  },
};
