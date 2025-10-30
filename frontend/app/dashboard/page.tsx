'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { HelpModal } from '@/components/HelpModal';
import { AnimatedModal } from '@/components/AnimatedModal';
import { WorkspaceCardSkeleton } from '@/components/skeletons/WorkspaceCardSkeleton';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { HelpCircle, Menu, X } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, checkAuth } = useAuthStore();
  const { workspaces, fetchWorkspaces, createWorkspace, isLoading } = useWorkspaceStore();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user, fetchWorkspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorkspace({
        name: newWorkspaceName,
        description: newWorkspaceDesc || undefined,
      });
      setShowCreateModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      // 생성 후 목록 새로고침
      fetchWorkspaces();
    } catch (error) {
      // Error handled in store
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
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="bg-white shadow-md border-b-2 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                📋 TaskFlow
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                환영합니다, {user.name}님!
              </span>
              <NotificationDropdown />
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 text-gray-600 hover:text-blue-600 transition cursor-pointer"
                title="도움말"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                로그아웃
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
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
            <div className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <div className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg">
                  {user.name}님
                </div>
                <button
                  onClick={() => {
                    setShowHelpModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  도움말
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">🏢 워크스페이스</h2>
              <p className="text-xs sm:text-sm text-gray-600">프로젝트 별로 워크스페이스를 관리하세요</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md font-semibold cursor-pointer text-sm sm:text-base"
            >
              + 새 워크스페이스
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <WorkspaceCardSkeleton />
              <WorkspaceCardSkeleton />
              <WorkspaceCardSkeleton />
              <WorkspaceCardSkeleton />
              <WorkspaceCardSkeleton />
              <WorkspaceCardSkeleton />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  워크스페이스가 없습니다
                </h3>
                <p className="text-gray-600 mb-4">
                  첫 번째 워크스페이스를 만들어 시작하세요
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  워크스페이스 만들기
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {workspaces.map((workspace, index) => (
                <motion.div
                  key={workspace.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/workspace/${workspace.id}`)}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-l-4 border-blue-500 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                      🏢 {workspace.name}
                    </h3>
                    <div className="text-2xl opacity-50 group-hover:opacity-100 transition">
                      →
                    </div>
                  </div>
                  {workspace.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {workspace.description}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>👥 {workspace.members?.length || 0} 멤버</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Create Workspace Modal */}
      <AnimatedModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              새 워크스페이스 만들기
            </h3>
            <form onSubmit={handleCreateWorkspace}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="마케팅 팀"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택)
                </label>
                <textarea
                  id="description"
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="워크스페이스에 대한 설명을 입력하세요"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWorkspaceName('');
                    setNewWorkspaceDesc('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? '생성 중...' : '만들기'}
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
