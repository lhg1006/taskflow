'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useBoardStore } from '@/store/board-store';
import { AnimatedModal } from '@/components/AnimatedModal';
import { BoardCardSkeleton } from '@/components/skeletons/BoardCardSkeleton';
import { Avatar } from '@/components/Avatar';
import { workspaceApi, WorkspaceMember } from '@/lib/workspace';
import { Settings, Edit2, Trash2, Menu, X, UserPlus, Users } from 'lucide-react';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const { user, checkAuth, logout } = useAuthStore();
  const { workspaces, fetchWorkspaces, updateWorkspace, deleteWorkspace } = useWorkspaceStore();
  const { boards, fetchBoards, createBoard, isLoading } = useBoardStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditWorkspaceModal, setShowEditWorkspaceModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspaceDesc, setEditWorkspaceDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

  // Find current user's role in this workspace
  const currentUserMember = members.find((m) => m.user.id === user?.id);
  const canManageMembers = currentUserMember?.role === 'OWNER' || currentUserMember?.role === 'ADMIN';

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user, fetchWorkspaces]);

  useEffect(() => {
    if (workspaceId) {
      fetchBoards(workspaceId);
      fetchMembers();
    }
  }, [workspaceId, fetchBoards]);

  const fetchMembers = async () => {
    try {
      const data = await workspaceApi.getMembers(workspaceId);
      setMembers(data);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      // If 403, user is not a member of this workspace
      if (error?.response?.status === 403) {
        alert('이 워크스페이스에 접근할 권한이 없습니다.');
        router.push('/dashboard');
      }
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBoard({
        name: newBoardName,
        description: newBoardDesc || undefined,
        workspaceId,
      });
      setShowCreateModal(false);
      setNewBoardName('');
      setNewBoardDesc('');
      // 생성 후 목록 새로고침
      fetchBoards(workspaceId);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleEditWorkspace = () => {
    if (currentWorkspace) {
      setEditWorkspaceName(currentWorkspace.name);
      setEditWorkspaceDesc(currentWorkspace.description || '');
      setShowEditWorkspaceModal(true);
      setShowWorkspaceMenu(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !editWorkspaceName.trim()) return;

    try {
      await updateWorkspace(workspaceId, {
        name: editWorkspaceName,
        description: editWorkspaceDesc || undefined,
      });
      setShowEditWorkspaceModal(false);
      setEditWorkspaceName('');
      setEditWorkspaceDesc('');
      await fetchWorkspaces();
    } catch (error) {
      console.error('Failed to update workspace:', error);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;

    const boardCount = boards.length;
    let message = '이 워크스페이스를 삭제하시겠습니까?';
    if (boardCount > 0) {
      message = `이 워크스페이스에 ${boardCount}개의 보드가 있습니다. 워크스페이스와 함께 모든 보드와 데이터가 삭제됩니다. 계속하시겠습니까?`;
    }

    if (window.confirm(message)) {
      try {
        await deleteWorkspace(workspaceId);
        router.push('/dashboard');
      } catch (error) {
        console.error('Failed to delete workspace:', error);
      }
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      await workspaceApi.inviteMember(workspaceId, {
        email: inviteEmail,
        role: inviteRole,
      });
      setShowInviteMemberModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      await fetchMembers();
      await fetchWorkspaces();
    } catch (error) {
      console.error('Failed to invite member:', error);
      alert('멤버 초대에 실패했습니다. 이메일을 확인해주세요.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('이 멤버를 제거하시겠습니까?')) return;

    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      await fetchMembers();
      await fetchWorkspaces();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('멤버 제거에 실패했습니다.');
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
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b-2 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-500 hover:text-blue-600 transition cursor-pointer hidden sm:block"
                >
                  대시보드
                </button>
                <span className="text-gray-400 hidden sm:block">/</span>
                <span className="text-blue-600 font-semibold truncate max-w-[200px] sm:max-w-none">
                  {currentWorkspace?.name || 'Workspace'}
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Workspace Settings Menu */}
              {canManageMembers && (
                <div className="relative">
                  <button
                    onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                    title="워크스페이스 설정"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                {showWorkspaceMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowWorkspaceMenu(false)} />
                    <div className="absolute right-0 top-12 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]">
                      {canManageMembers && (
                        <button
                          onClick={() => {
                            setShowInviteMemberModal(true);
                            setShowWorkspaceMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" /> 멤버 초대
                        </button>
                      )}
                      {canManageMembers && (
                        <button
                          onClick={handleEditWorkspace}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" /> 워크스페이스 수정
                        </button>
                      )}
                      {currentUserMember?.role === 'OWNER' && (
                        <button
                          onClick={() => {
                            setShowWorkspaceMenu(false);
                            handleDeleteWorkspace();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> 워크스페이스 삭제
                        </button>
                      )}
                    </div>
                  </>
                )}
                </div>
              )}
              <span className="text-sm text-gray-700">
                {user.name}님
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                로그아웃
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
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
                  onClick={() => router.push('/dashboard')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  대시보드로 이동
                </button>
                {canManageMembers && (
                  <button
                    onClick={() => {
                      setShowInviteMemberModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    멤버 초대
                  </button>
                )}
                {canManageMembers && (
                  <button
                    onClick={() => {
                      handleEditWorkspace();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    워크스페이스 수정
                  </button>
                )}
                {currentUserMember?.role === 'OWNER' && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleDeleteWorkspace();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    워크스페이스 삭제
                  </button>
                )}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Workspace Info */}
          {currentWorkspace && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentWorkspace.name}
              </h2>
              {currentWorkspace.description && (
                <p className="text-gray-600 mb-4">{currentWorkspace.description}</p>
              )}

              {/* Members Section */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    멤버 ({members.length})
                  </h3>
                  {canManageMembers && (
                    <button
                      onClick={() => setShowInviteMemberModal(true)}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      초대
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.user.name}
                          avatar={member.user.avatar}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-gray-500">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            member.role === 'OWNER'
                              ? 'bg-purple-100 text-purple-700'
                              : member.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {member.role === 'OWNER'
                            ? '소유자'
                            : member.role === 'ADMIN'
                            ? '관리자'
                            : '멤버'}
                        </span>
                        {canManageMembers && member.role !== 'OWNER' && member.user.id !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.user.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="멤버 제거"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Boards Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">📋 보드 목록</h2>
              <p className="text-xs sm:text-sm text-gray-600">보드를 선택하여 작업을 관리하세요</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md font-semibold cursor-pointer text-sm sm:text-base"
            >
              + 새 보드
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BoardCardSkeleton />
              <BoardCardSkeleton />
              <BoardCardSkeleton />
              <BoardCardSkeleton />
              <BoardCardSkeleton />
              <BoardCardSkeleton />
            </div>
          ) : boards.length === 0 ? (
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  보드가 없습니다
                </h3>
                <p className="text-gray-600 mb-4">
                  첫 번째 보드를 만들어 시작하세요
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  보드 만들기
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
              {boards.map((board) => (
                <motion.div
                  key={board.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/board/${board.id}`)}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-l-4 border-blue-500 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                      📊 {board.name}
                    </h3>
                    <div className="text-2xl opacity-50 group-hover:opacity-100 transition">
                      →
                    </div>
                  </div>
                  {board.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>📊 {board.columns?.length || 0} 컬럼</span>
                    <span>•</span>
                    <span>생성일: {new Date(board.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Create Board Modal */}
      <AnimatedModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            새 보드 만들기
          </h3>
          <form onSubmit={handleCreateBoard}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이름 *
              </label>
              <input
                id="name"
                type="text"
                required
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024 Q4 프로젝트"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                설명 (선택)
              </label>
              <textarea
                id="description"
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="보드에 대한 설명을 입력하세요"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardName('');
                  setNewBoardDesc('');
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

      {/* Edit Workspace Modal */}
      <AnimatedModal isOpen={showEditWorkspaceModal} onClose={() => setShowEditWorkspaceModal(false)}>
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            워크스페이스 수정
          </h3>
          <form onSubmit={handleUpdateWorkspace}>
            <div className="mb-4">
              <label
                htmlFor="editName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이름 *
              </label>
              <input
                id="editName"
                type="text"
                required
                value={editWorkspaceName}
                onChange={(e) => setEditWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="마케팅 팀"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="editDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                설명 (선택)
              </label>
              <textarea
                id="editDescription"
                value={editWorkspaceDesc}
                onChange={(e) => setEditWorkspaceDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="워크스페이스에 대한 설명을 입력하세요"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditWorkspaceModal(false);
                  setEditWorkspaceName('');
                  setEditWorkspaceDesc('');
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

      {/* Invite Member Modal */}
      <AnimatedModal isOpen={showInviteMemberModal} onClose={() => setShowInviteMemberModal(false)}>
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            멤버 초대
          </h3>
          <form onSubmit={handleInviteMember}>
            <div className="mb-4">
              <label
                htmlFor="inviteEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이메일 *
              </label>
              <input
                id="inviteEmail"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="inviteRole"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                역할 *
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MEMBER">멤버</option>
                <option value="ADMIN">관리자</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                관리자는 워크스페이스를 수정하고 멤버를 초대할 수 있습니다
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowInviteMemberModal(false);
                  setInviteEmail('');
                  setInviteRole('MEMBER');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                초대
              </button>
            </div>
          </form>
        </div>
      </AnimatedModal>
    </motion.div>
  );
}
