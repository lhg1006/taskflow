'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { notificationApi } from '@/lib/api';
import { getRelativeTime } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';
import { AnimatedModal } from '@/components/AnimatedModal';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  card?: {
    id: string;
    title: string;
    column?: {
      boardId: string;
    };
  };
  workspaceInvitation?: {
    id: string;
    status: string; // PENDING, ACCEPTED, REJECTED
    role: string;
    workspace: {
      id: string;
      name: string;
      description?: string;
    };
  };
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications and unread count
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 10 seconds for more real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      // Also refresh notifications if dropdown is open
      if (isOpen) {
        fetchNotifications();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationApi.getAll(false);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.read) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications(notifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    // Handle workspace invitations - show modal
    if (notification.type === 'WORKSPACE_INVITATION' && notification.workspaceInvitation) {
      setSelectedInvitation(notification);
      setShowInvitationModal(true);
      return;
    }

    // Navigate to card if available
    if (notification.card && notification.card.column?.boardId) {
      setIsOpen(false);
      // Navigate to the card page
      router.push(`/board/${notification.card.column.boardId}/card/${notification.card.id}`);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!selectedInvitation || !selectedInvitation.workspaceInvitation) return;

    try {
      await notificationApi.acceptInvitation(selectedInvitation.workspaceInvitation.id);
      setShowInvitationModal(false);
      setIsOpen(false);
      // Refresh notifications to get updated status
      await fetchNotifications();
      await fetchUnreadCount();
      // Navigate to the workspace
      router.push(`/workspace/${selectedInvitation.workspaceInvitation.workspace.id}`);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert('초대 수락에 실패했습니다.');
    }
  };

  const handleRejectInvitation = async () => {
    if (!selectedInvitation || !selectedInvitation.workspaceInvitation) return;

    try {
      await notificationApi.rejectInvitation(selectedInvitation.workspaceInvitation.id);
      setShowInvitationModal(false);
      // Refresh notifications to get updated status
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      alert('초대 거절에 실패했습니다.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.delete(id);
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition cursor-pointer"
        title="알림"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">알림</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  모두 읽음
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  알림을 불러오는 중...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  알림이 없습니다
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        {notification.card && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            📋 {notification.card.title}
                          </p>
                        )}
                        {notification.workspaceInvitation && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            🏢 {notification.workspaceInvitation.workspace.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                        )}
                        {notification.type !== 'WORKSPACE_INVITATION' && (
                          <button
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            className="text-gray-400 hover:text-red-600 transition cursor-pointer p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Invitation Modal */}
      <AnimatedModal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
      >
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            워크스페이스 초대
          </h3>

          {selectedInvitation?.workspaceInvitation && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 mb-2">워크스페이스</p>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  {selectedInvitation.workspaceInvitation.workspace.name}
                </p>
                {selectedInvitation.workspaceInvitation.workspace.description && (
                  <p className="text-sm text-gray-600">
                    {selectedInvitation.workspaceInvitation.workspace.description}
                  </p>
                )}
              </div>

              {selectedInvitation.workspaceInvitation.status === 'PENDING' && (
                <p className="text-sm text-gray-700">
                  이 워크스페이스의 멤버가 되어 보드와 카드를 관리할 수 있습니다.
                </p>
              )}

              {selectedInvitation.workspaceInvitation.status === 'ACCEPTED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    ✅ 수락된 제안
                  </p>
                  <p className="text-xs text-green-700">
                    이미 이 워크스페이스의 멤버입니다.
                  </p>
                </div>
              )}

              {selectedInvitation.workspaceInvitation.status === 'REJECTED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    ❌ 거절된 제안
                  </p>
                  <p className="text-xs text-red-700">
                    이 초대를 거절하셨습니다.
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedInvitation?.workspaceInvitation?.status === 'PENDING' ? (
            <div className="flex gap-3">
              <button
                onClick={handleRejectInvitation}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer font-medium"
              >
                거절
              </button>
              <button
                onClick={handleAcceptInvitation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer font-medium"
              >
                수락
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInvitationModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer font-medium"
            >
              닫기
            </button>
          )}
        </div>
      </AnimatedModal>
    </div>
  );
}
