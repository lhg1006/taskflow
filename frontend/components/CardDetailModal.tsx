'use client';

import { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import { DueDateBadge } from './DueDateBadge';
import { commentApi, attachmentApi, activityApi } from '@/lib/api';
import { workspaceApi, WorkspaceMember } from '@/lib/workspace';
import { getRelativeTime } from '@/lib/date-utils';
import {
  X,
  Clock,
  User,
  Tag,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Trash2,
  Edit2,
  Send,
  MoreVertical,
  ChevronDown,
  Download,
  Upload,
  Activity,
} from 'lucide-react';

interface CardDetailModalProps {
  card: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    assignee?: {
      id: string;
      name: string;
      avatar?: string;
    };
    creator?: {
      id: string;
      name: string;
      avatar?: string;
    };
    labels: string[];
    createdAt?: string;
    updatedAt?: string;
  };
  workspaceId: string;
  onClose: () => void;
  onUpdate?: (data: Partial<typeof card>) => void;
  onDelete?: () => void;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface Attachment {
  id: string;
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface ActivityLog {
  id: string;
  actionType: string;
  details: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export function CardDetailModal({
  card,
  workspaceId,
  onClose,
  onUpdate,
  onDelete,
}: CardDetailModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Assignee selection state
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Due date state
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [tempDueDate, setTempDueDate] = useState('');

  // Label state
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabels, setEditingLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');

  // Attachment state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Activity state
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Mention autocomplete state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const handleSaveTitle = async () => {
    if (title.trim() && title !== card.title) {
      try {
        await onUpdate?.({ title });
      } catch (error) {
        console.error('Failed to update title:', error);
        // 실패시 원래 값으로 되돌림
        setTitle(card.title);
      }
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = async () => {
    if (description !== card.description) {
      try {
        await onUpdate?.({ description });
      } catch (error) {
        console.error('Failed to update description:', error);
        // 실패시 원래 값으로 되돌림
        setDescription(card.description || '');
      }
    }
    setIsEditingDesc(false);
  };

  // Fetch workspace members when modal opens
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const workspace = await workspaceApi.getById(workspaceId);
        setWorkspaceMembers(workspace.members || []);
      } catch (error) {
        console.error('Failed to fetch workspace members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [workspaceId]);

  // Fetch comments when modal opens
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const data = await commentApi.getByCardId(card.id);
        setComments(data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [card.id]);

  // Fetch attachments when modal opens
  useEffect(() => {
    const fetchAttachments = async () => {
      setIsLoadingAttachments(true);
      try {
        const data = await attachmentApi.getByCardId(card.id);
        setAttachments(data);
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
      } finally {
        setIsLoadingAttachments(false);
      }
    };

    fetchAttachments();
  }, [card.id]);

  // Fetch activities when modal opens
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoadingActivities(true);
      try {
        const data = await activityApi.getByCardId(card.id);
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [card.id]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    setNewComment(value);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setMentionStartIndex(lastAtIndex);
        setMentionSearch(textAfterAt);
        setShowMentionSuggestions(true);
        return;
      }
    }

    setShowMentionSuggestions(false);
  };

  const handleSelectMention = (member: WorkspaceMember) => {
    if (mentionStartIndex === -1) return;

    // Replace @search with @userId
    const beforeMention = newComment.substring(0, mentionStartIndex);
    const afterMention = newComment.substring(mentionStartIndex + mentionSearch.length + 1);
    const newText = `${beforeMention}@${member.user.id} `;

    setNewComment(newText + afterMention);
    setShowMentionSuggestions(false);
    setMentionSearch('');
    setMentionStartIndex(-1);
  };

  const getFilteredMembers = () => {
    if (!mentionSearch) return workspaceMembers;
    return workspaceMembers.filter((member) =>
      member.user.name.toLowerCase().includes(mentionSearch.toLowerCase())
    );
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const comment = await commentApi.create({
        cardId: card.id,
        content: newComment.trim(),
      });
      setComments([comment, ...comments]);
      setNewComment('');
      setShowMentionSuggestions(false);
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return;

    try {
      const updated = await commentApi.update(commentId, {
        content: editingCommentContent.trim(),
      });
      setComments(
        comments.map((c) => (c.id === commentId ? { ...c, ...updated } : c))
      );
      setEditingCommentId(null);
      setEditingCommentContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await commentApi.delete(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleAssigneeChange = async (userId: string) => {
    try {
      await onUpdate?.({ assigneeId: userId } as any);
      setShowAssigneeDropdown(false);
    } catch (error) {
      console.error('Failed to update assignee:', error);
    }
  };

  const handleRemoveAssignee = async () => {
    try {
      await onUpdate?.({ assigneeId: null } as any);
    } catch (error) {
      console.error('Failed to remove assignee:', error);
    }
  };

  const handleDueDateChange = async (date: string) => {
    try {
      await onUpdate?.({ dueDate: date } as any);
      setShowDueDatePicker(false);
      setTempDueDate('');
    } catch (error) {
      console.error('Failed to update due date:', error);
    }
  };

  const handleRemoveDueDate = async () => {
    try {
      await onUpdate?.({ dueDate: null } as any);
    } catch (error) {
      console.error('Failed to remove due date:', error);
    }
  };

  const handleOpenLabelModal = () => {
    setEditingLabels([...card.labels]);
    setShowLabelModal(true);
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !editingLabels.includes(newLabel.trim())) {
      setEditingLabels([...editingLabels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setEditingLabels(editingLabels.filter((label) => label !== labelToRemove));
  };

  const handleSaveLabels = async () => {
    try {
      await onUpdate?.({ labels: editingLabels } as any);
      setShowLabelModal(false);
      setNewLabel('');
    } catch (error) {
      console.error('Failed to update labels:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const attachment = await attachmentApi.upload(card.id, file);
      setAttachments([attachment, ...attachments]);
      e.target.value = ''; // Reset input
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!window.confirm('첨부파일을 삭제하시겠습니까?')) return;

    try {
      await attachmentApi.delete(id);
      setAttachments(attachments.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  // Format comment content to replace @userId with @userName
  const formatCommentContent = (content: string) => {
    // Replace all @uuid patterns with @userName
    let formattedContent = content;

    // Find all @userId patterns
    const mentionRegex = /@([a-f0-9-]{36})/g;
    const matches = content.matchAll(mentionRegex);

    for (const match of matches) {
      const userId = match[1];
      const member = workspaceMembers.find(m => m.user.id === userId);
      if (member) {
        formattedContent = formattedContent.replace(
          `@${userId}`,
          `@${member.user.name}`
        );
      }
    }

    return formattedContent;
  };

  const formatActivityMessage = (activity: ActivityLog) => {
    const { actionType, details, user } = activity;
    const userName = user.name;

    switch (actionType) {
      case 'CREATE_CARD':
        return `카드를 생성했습니다`;
      case 'UPDATE_TITLE':
        return `제목을 "${details.oldTitle}"에서 "${details.newTitle}"로 변경했습니다`;
      case 'UPDATE_DESCRIPTION':
        return `설명을 수정했습니다`;
      case 'MOVE_CARD':
        return `카드를 "${details.fromColumn}"에서 "${details.toColumn}"로 이동했습니다`;
      case 'ASSIGN_USER':
        return `담당자를 지정했습니다`;
      case 'UNASSIGN_USER':
        return `담당자 지정을 해제했습니다`;
      case 'UPDATE_DUE_DATE':
        return `마감일을 설정했습니다`;
      case 'REMOVE_DUE_DATE':
        return `마감일을 제거했습니다`;
      case 'ADD_LABEL':
        return `"${details.label}" 라벨을 추가했습니다`;
      case 'REMOVE_LABEL':
        return `"${details.label}" 라벨을 제거했습니다`;
      case 'ADD_COMMENT':
        return `댓글을 작성했습니다`;
      case 'UPDATE_COMMENT':
        return `댓글을 수정했습니다`;
      case 'DELETE_COMMENT':
        return `댓글을 삭제했습니다`;
      case 'ADD_ATTACHMENT':
        return `"${details.filename}" 파일을 첨부했습니다`;
      case 'DELETE_ATTACHMENT':
        return `"${details.filename}" 파일을 삭제했습니다`;
      default:
        return `작업을 수행했습니다`;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <CheckSquare className="w-5 h-5 text-gray-500" />
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitle(card.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="flex-1 text-xl font-semibold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-semibold text-gray-900 flex-1 cursor-pointer hover:text-blue-600"
                onClick={() => setIsEditingTitle(true)}
              >
                {card.title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition cursor-pointer"
                title="카드 삭제"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full overflow-y-auto">
            {/* Main Content */}
            <div className="flex-1 space-y-4 sm:space-y-6">
              {/* Labels */}
              {card.labels && card.labels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700">
                      라벨
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.labels.map((label, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">설명</h3>
                </div>
                {isEditingDesc ? (
                  <div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                      placeholder="카드에 대한 자세한 설명을 추가하세요..."
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveDesc}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm cursor-pointer"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setDescription(card.description || '');
                          setIsEditingDesc(false);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDesc(true)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition min-h-[80px]"
                  >
                    {card.description ? (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {card.description}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">
                        설명을 추가하려면 클릭하세요...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    첨부파일 ({attachments.length})
                  </h3>
                </div>

                {/* File Upload */}
                <div className="mb-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm text-gray-700 w-fit">
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                          <span>업로드 중...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>파일 첨부</span>
                        </>
                      )}
                    </div>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>

                {/* Attachments List */}
                <div className="space-y-2">
                  {isLoadingAttachments ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      첨부파일을 불러오는 중...
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      첨부파일이 없습니다
                    </div>
                  ) : (
                    attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.filename}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatFileSize(attachment.size)}</span>
                              <span>•</span>
                              <span>{getRelativeTime(attachment.createdAt)}</span>
                              <span>•</span>
                              <span>{attachment.uploadedBy.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => attachmentApi.download(attachment.id, attachment.filename)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="다운로드"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity Timeline Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    활동 ({activities.length})
                  </h3>
                </div>

                {/* Activities List */}
                <div className="space-y-2">
                  {isLoadingActivities ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      활동을 불러오는 중...
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      활동 내역이 없습니다
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <Avatar
                          name={activity.user.name}
                          avatar={activity.user.avatar}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-700">
                            <span className="font-medium text-gray-900">
                              {activity.user.name}
                            </span>{' '}
                            <span>{formatActivityMessage(activity)}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getRelativeTime(activity.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    댓글 ({comments.length})
                  </h3>
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleSubmitComment} className="mb-4">
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newComment}
                        onChange={handleCommentChange}
                        placeholder="댓글을 입력하세요... (@로 멤버 언급)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={isSubmittingComment}
                      />

                      {/* Mention Suggestions Dropdown */}
                      {showMentionSuggestions && getFilteredMembers().length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                          {getFilteredMembers().map((member) => (
                            <button
                              key={member.user.id}
                              type="button"
                              onClick={() => handleSelectMention(member)}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition cursor-pointer flex items-center gap-2"
                            >
                              <Avatar
                                name={member.user.name}
                                avatar={member.user.avatar}
                                size="sm"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {member.user.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {member.user.email}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmittingComment ? '전송 중...' : '전송'}
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3">
                  {isLoadingComments ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      댓글을 불러오는 중...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      아직 댓글이 없습니다
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 rounded-lg p-3 relative"
                      >
                        <div className="flex items-start gap-2">
                          <Avatar
                            name={comment.author.name}
                            avatar={comment.author.avatar}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {comment.author.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            {editingCommentId === comment.id ? (
                              <div>
                                <textarea
                                  value={editingCommentContent}
                                  onChange={(e) =>
                                    setEditingCommentContent(e.target.value)
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() =>
                                      handleUpdateComment(comment.id)
                                    }
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition cursor-pointer"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={cancelEditingComment}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition cursor-pointer"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8">
                                {formatCommentContent(comment.content)}
                              </p>
                            )}
                          </div>

                          {/* Three-dot menu */}
                          {editingCommentId !== comment.id && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === comment.id
                                      ? null
                                      : comment.id
                                  )
                                }
                                className="p-1 hover:bg-gray-200 rounded transition cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </button>

                              {/* Dropdown menu */}
                              {openMenuId === comment.id && (
                                <>
                                  {/* Backdrop to close menu */}
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                                    <button
                                      onClick={() => {
                                        startEditingComment(comment);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                      수정
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteComment(comment.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      삭제
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-64 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                카드 정보
              </h3>

              {/* Assignee */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">담당자</span>
                </div>
                {card.assignee ? (
                  <div className="group">
                    <button
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={card.assignee.name}
                          avatar={card.assignee.avatar}
                          size="sm"
                        />
                        <span className="text-sm text-gray-700">
                          {card.assignee.name}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm flex items-center justify-between cursor-pointer"
                  >
                    <span>담당자 지정</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                )}

                {/* Assignee Dropdown */}
                {showAssigneeDropdown && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAssigneeDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                      {isLoadingMembers ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          멤버 불러오는 중...
                        </div>
                      ) : workspaceMembers.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          워크스페이스 멤버가 없습니다
                        </div>
                      ) : (
                        <>
                          {card.assignee && (
                            <>
                              <button
                                onClick={handleRemoveAssignee}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                                담당자 제거
                              </button>
                              <div className="border-t border-gray-200" />
                            </>
                          )}
                          {workspaceMembers.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => handleAssigneeChange(member.user.id)}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer ${
                                card.assignee?.id === member.user.id
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700'
                              }`}
                            >
                              <Avatar
                                name={member.user.name}
                                avatar={member.user.avatar}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {member.user.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {member.user.email}
                                </div>
                              </div>
                              {card.assignee?.id === member.user.id && (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              )}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Due Date */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">마감일</span>
                </div>
                {card.dueDate ? (
                  <div className="group">
                    <button
                      onClick={() => setShowDueDatePicker(!showDueDatePicker)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                      <DueDateBadge dueDate={card.dueDate} />
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDueDatePicker(!showDueDatePicker)}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm flex items-center justify-between cursor-pointer"
                  >
                    <span>마감일 설정</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                )}

                {/* Due Date Picker Dropdown */}
                {showDueDatePicker && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowDueDatePicker(false);
                        setTempDueDate('');
                      }}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                      <div className="space-y-3">
                        <input
                          type="date"
                          value={tempDueDate || (card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '')}
                          onChange={(e) => setTempDueDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (tempDueDate) {
                                handleDueDateChange(new Date(tempDueDate).toISOString());
                              }
                            }}
                            disabled={!tempDueDate}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            저장
                          </button>
                          {card.dueDate && (
                            <button
                              onClick={() => {
                                handleRemoveDueDate();
                                setShowDueDatePicker(false);
                              }}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm cursor-pointer"
                            >
                              제거
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Creator */}
              {card.creator && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">생성자</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={card.creator.name}
                      avatar={card.creator.avatar}
                      size="sm"
                    />
                    <span className="text-sm text-gray-700">
                      {card.creator.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  작업
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={handleOpenLabelModal}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Tag className="w-4 h-4" />
                    라벨 편집
                  </button>
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                        <span>업로드 중...</span>
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-4 h-4" />
                        첨부파일
                      </>
                    )}
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm('정말로 이 카드를 삭제하시겠습니까?')
                        ) {
                          onDelete();
                          onClose();
                        }
                      }}
                      className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      카드 삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Label Edit Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              라벨 편집
            </h3>

            {/* Add Label Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 라벨 추가
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="라벨 이름 입력..."
                />
                <button
                  onClick={handleAddLabel}
                  disabled={!newLabel.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  추가
                </button>
              </div>
            </div>

            {/* Current Labels */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현재 라벨
              </label>
              {editingLabels.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4 text-center">
                  라벨이 없습니다
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editingLabels.map((label, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{label}</span>
                      <button
                        onClick={() => handleRemoveLabel(label)}
                        className="hover:bg-blue-200 rounded-full p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLabelModal(false);
                  setEditingLabels([]);
                  setNewLabel('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveLabels}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
