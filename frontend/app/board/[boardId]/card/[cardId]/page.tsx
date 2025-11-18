'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/Avatar';
import { DueDateBadge } from '@/components/DueDateBadge';
import { api, commentApi, attachmentApi, activityApi } from '@/lib/api';
import { workspaceApi, WorkspaceMember } from '@/lib/workspace';
import { useBoardStore } from '@/store/board-store';
import { getRelativeTime } from '@/lib/date-utils';
import {
  ArrowLeft,
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
  Archive,
} from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

interface CardLabel {
  id: string;
  label: Label;
}

interface ChecklistItem {
  id: string;
  content: string;
  isCompleted: boolean;
  order: number;
}

interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assigneeId?: string; // For API updates
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
  labels: string[]; // Deprecated - for backward compatibility
  cardLabels?: CardLabel[];
  checklistItems?: ChecklistItem[];
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  column?: {
    id: string;
    title: string;
    board?: {
      id: string;
      name: string;
      workspaceId: string;
    };
  };
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

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;
  const boardId = params.boardId as string;

  const { updateCard, deleteCard } = useBoardStore();

  // Card state
  const [card, setCard] = useState<Card | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(true);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  // Checklist state
  const [newChecklistItemContent, setNewChecklistItemContent] = useState('');
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null);
  const [editingChecklistItemContent, setEditingChecklistItemContent] = useState('');

  // Attachment state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Activity state
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);

  // Mention autocomplete state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionMap, setMentionMap] = useState<Map<string, string>>(new Map()); // userName -> userId

  // Fetch card data
  useEffect(() => {
    const fetchCard = async () => {
      try {
        setIsLoadingCard(true);
        const response = await api.get(`/cards/${cardId}`);
        setCard(response.data);
        setTitle(response.data.title);
        setDescription(response.data.description || '');
      } catch (error) {
        console.error('Failed to fetch card:', error);
        router.push(`/board/${boardId}`);
      } finally {
        setIsLoadingCard(false);
      }
    };

    if (cardId) {
      fetchCard();
    }
  }, [cardId, boardId, router]);

  // Fetch workspace members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!card?.column?.board?.workspaceId) return;

      try {
        setIsLoadingMembers(true);
        const members = await workspaceApi.getMembers(card.column.board.workspaceId);
        setWorkspaceMembers(members);
      } catch (error) {
        console.error('Failed to fetch workspace members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [card?.column?.board?.workspaceId]);

  // Fetch board labels
  useEffect(() => {
    const fetchLabels = async () => {
      if (!boardId) return;

      try {
        setIsLoadingLabels(true);
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/labels?boardId=${boardId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setBoardLabels(data);
        }
      } catch (error) {
        console.error('Failed to fetch labels:', error);
      } finally {
        setIsLoadingLabels(false);
      }
    };

    fetchLabels();
  }, [boardId]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoadingComments(true);
        const data = await commentApi.getByCardId(cardId);
        setComments(data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    if (cardId) {
      fetchComments();
    }
  }, [cardId]);

  // Fetch attachments
  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        setIsLoadingAttachments(true);
        const data = await attachmentApi.getByCardId(cardId);
        setAttachments(data);
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
      } finally {
        setIsLoadingAttachments(false);
      }
    };

    if (cardId) {
      fetchAttachments();
    }
  }, [cardId]);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoadingActivities(true);
        const data = await activityApi.getByCardId(cardId);
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    if (cardId) {
      fetchActivities();
    }
  }, [cardId]);

  const handleUpdate = async (data: Partial<Card>) => {
    try {
      await updateCard(cardId, data);
      // Refetch card data
      const response = await api.get(`/cards/${cardId}`);
      setCard(response.data);
      setTitle(response.data.title);
      setDescription(response.data.description || '');
    } catch (error) {
      console.error('Failed to update card:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (window.confirm('이 카드를 삭제하시겠습니까?')) {
      try {
        await deleteCard(cardId);
        router.push(`/board/${boardId}`);
      } catch (error) {
        console.error('Failed to delete card:', error);
      }
    }
  };

  const handleToggleCompleted = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/toggle-completed`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle card completion');
      }

      // Refetch card data
      const cardResponse = await api.get(`/cards/${cardId}`);
      setCard(cardResponse.data);
      setTitle(cardResponse.data.title);
      setDescription(cardResponse.data.description || '');

      // Refetch activities to show completion activity
      const activityData = await activityApi.getByCardId(cardId);
      setActivities(activityData);
    } catch (error) {
      console.error('Failed to toggle card completion:', error);
    }
  };

  const handleCopy = async () => {
    if (window.confirm('이 카드를 복사하시겠습니까?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/copy`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to copy card');
        }

        const copiedCard = await response.json();
        // Redirect to the copied card
        router.push(`/board/${boardId}/card/${copiedCard.id}`);
      } catch (error) {
        console.error('Failed to copy card:', error);
      }
    }
  };

  const handleArchive = async () => {
    if (window.confirm('이 카드를 아카이브하시겠습니까?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/archive`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to archive card');
        }

        // Go back to board
        router.push(`/board/${boardId}`);
      } catch (error) {
        console.error('Failed to archive card:', error);
      }
    }
  };

  const handleBack = () => {
    router.push(`/board/${boardId}`);
  };

  const handleSaveTitle = async () => {
    if (title.trim() && card && title !== card.title) {
      try {
        await handleUpdate({ title });
      } catch (error) {
        console.error('Failed to update title:', error);
        setTitle(card.title);
      }
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    if (card && description !== (card.description || '')) {
      try {
        await handleUpdate({ description: description || undefined });
      } catch (error) {
        console.error('Failed to update description:', error);
        setDescription(card.description || '');
      }
    }
    setIsEditingDesc(false);
  };

  const handleAssigneeChange = async (memberId: string | null) => {
    try {
      await handleUpdate({ assigneeId: memberId || undefined });
      setShowAssigneeDropdown(false);
    } catch (error) {
      console.error('Failed to update assignee:', error);
    }
  };

  const handleDueDateChange = async () => {
    try {
      await handleUpdate({ dueDate: tempDueDate || undefined });
      setShowDueDatePicker(false);
      setTempDueDate('');
    } catch (error) {
      console.error('Failed to update due date:', error);
    }
  };

  const handleRemoveDueDate = async () => {
    try {
      await handleUpdate({ dueDate: undefined });
    } catch (error) {
      console.error('Failed to remove due date:', error);
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    if (!card) return;

    const isLabelAssigned = card.cardLabels?.some((cl) => cl.label.id === labelId);

    try {
      const token = localStorage.getItem('token');
      const method = isLabelAssigned ? 'DELETE' : 'POST';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/labels/card/${cardId}/label/${labelId}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle label');
      }

      // Refresh card data
      const cardResponse = await api.get(`/cards/${cardId}`);
      setCard(cardResponse.data);
    } catch (error) {
      console.error('Failed to toggle label:', error);
    }
  };

  // Checklist functions
  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItemContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/checklist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newChecklistItemContent }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add checklist item');
      }

      setNewChecklistItemContent('');
      // Refresh card data
      const cardResponse = await api.get(`/cards/${cardId}`);
      setCard(cardResponse.data);
    } catch (error) {
      console.error('Failed to add checklist item:', error);
    }
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/checklist/${itemId}/toggle`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle checklist item');
      }

      // Refresh card data
      const cardResponse = await api.get(`/cards/${cardId}`);
      setCard(cardResponse.data);
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
    }
  };

  const handleUpdateChecklistItem = async (itemId: string) => {
    if (!editingChecklistItemContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/checklist/${itemId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: editingChecklistItemContent }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update checklist item');
      }

      setEditingChecklistItemId(null);
      setEditingChecklistItemContent('');
      // Refresh card data
      const cardResponse = await api.get(`/cards/${cardId}`);
      setCard(cardResponse.data);
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (window.confirm('이 체크리스트 항목을 삭제하시겠습니까?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/checklist/${itemId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete checklist item');
        }

        // Refresh card data
        const cardResponse = await api.get(`/cards/${cardId}`);
        setCard(cardResponse.data);
      } catch (error) {
        console.error('Failed to delete checklist item:', error);
      }
    }
  };

  const startEditingChecklistItem = (item: ChecklistItem) => {
    setEditingChecklistItemId(item.id);
    setEditingChecklistItemContent(item.content);
  };

  const cancelEditingChecklistItem = () => {
    setEditingChecklistItemId(null);
    setEditingChecklistItemContent('');
  };

  // Comment functions
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);

      // Convert @userName to @userId
      let contentToSend = newComment;
      mentionMap.forEach((userId, userName) => {
        // Escape special regex characters in userName
        const escapedUserName = userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match @userName followed by space or end of string
        const regex = new RegExp(`@${escapedUserName}(?=\\s|$)`, 'g');
        contentToSend = contentToSend.replace(regex, `@${userId}`);
      });

      await commentApi.create({
        cardId,
        content: contentToSend,
      });

      // Clear input
      const commentInput = document.getElementById('comment-input');
      if (commentInput) {
        commentInput.innerHTML = '';
      }
      setNewComment('');
      setMentionMap(new Map()); // Clear mention map

      // Refetch comments
      const data = await commentApi.getByCardId(cardId);
      setComments(data);
      // Refetch activities to show new comment activity
      const activityData = await activityApi.getByCardId(cardId);
      setActivities(activityData);
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const text = target.textContent || '';
    setNewComment(text);

    // Get cursor position
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowMentionSuggestions(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(target);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const textBeforeCursor = preCaretRange.toString();

    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
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

    const commentInput = document.getElementById('comment-input');
    if (!commentInput) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Add to mention map
    const newMap = new Map(mentionMap);
    newMap.set(member.user.name, member.user.id);
    setMentionMap(newMap);

    // Create mention span element
    const mentionSpan = document.createElement('span');
    mentionSpan.className = 'text-blue-600 font-medium bg-blue-50 px-1 rounded';
    mentionSpan.contentEditable = 'false';
    mentionSpan.textContent = `@${member.user.name}`;
    mentionSpan.dataset.userId = member.user.id;

    // Add space after mention
    const space = document.createTextNode(' ');

    // Get current content and find @ position
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    // Find and delete the @search text
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || '';
      const atIndex = text.lastIndexOf('@', range.startOffset);

      if (atIndex !== -1) {
        range.setStart(textNode, atIndex);
        range.setEnd(textNode, range.endOffset);
        range.deleteContents();

        // Insert mention span and space
        range.insertNode(space);
        range.insertNode(mentionSpan);

        // Move cursor after space
        range.setStartAfter(space);
        range.setEndAfter(space);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // Update newComment with text content
    setNewComment(commentInput.textContent || '');
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

  // Format comment content to replace @userId with @userName and add styling
  const formatCommentContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let mentionIndex = 0;

    // Match both UUID and userName mentions
    const uuidRegex = /@([a-f0-9-]{36})/g;
    const nameRegex = /@(\S+)/g;

    // First try to find UUID mentions (from saved comments)
    const uuidMatches = Array.from(content.matchAll(uuidRegex));

    if (uuidMatches.length > 0) {
      // Process UUID mentions
      uuidMatches.forEach((match) => {
        const userId = match[1];
        const matchIndex = match.index!;

        if (matchIndex > lastIndex) {
          parts.push(content.substring(lastIndex, matchIndex));
        }

        const member = workspaceMembers.find((m) => m.user.id === userId);
        parts.push(
          <span
            key={`mention-${mentionIndex++}`}
            className="text-blue-600 font-medium bg-blue-50 px-1 rounded"
          >
            @{member ? member.user.name : userId}
          </span>
        );

        lastIndex = matchIndex + match[0].length;
      });
    } else {
      // Process userName mentions (from input)
      const nameMatches = Array.from(content.matchAll(nameRegex));

      nameMatches.forEach((match) => {
        const userName = match[1];
        const matchIndex = match.index!;

        if (matchIndex > lastIndex) {
          parts.push(content.substring(lastIndex, matchIndex));
        }

        // Check if this is a known mention from mentionMap
        const isKnownMention = mentionMap.has(userName);

        parts.push(
          <span
            key={`mention-${mentionIndex++}`}
            className={isKnownMention ? "text-blue-600 font-medium bg-blue-50 px-1 rounded" : ""}
          >
            @{userName}
          </span>
        );

        lastIndex = matchIndex + match[0].length;
      });
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);

    // Convert @userId to @userName for editing
    let contentForEditing = comment.content;
    const uuidRegex = /@([a-f0-9-]{36})/g;
    const matches = Array.from(comment.content.matchAll(uuidRegex));

    matches.forEach((match) => {
      const userId = match[1];
      const member = workspaceMembers.find((m) => m.user.id === userId);
      if (member) {
        contentForEditing = contentForEditing.replace(
          `@${userId}`,
          `@${member.user.name}`
        );
      }
    });

    setEditingCommentContent(contentForEditing);
    setOpenMenuId(null);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleUpdateComment = async (commentId: string) => {
    try {
      // Convert @userName back to @userId before saving
      let contentToSend = editingCommentContent;
      workspaceMembers.forEach((member) => {
        const escapedUserName = member.user.name.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );
        const regex = new RegExp(`@${escapedUserName}(?=\\s|$)`, 'g');
        contentToSend = contentToSend.replace(regex, `@${member.user.id}`);
      });

      await commentApi.update(commentId, { content: contentToSend });
      const data = await commentApi.getByCardId(cardId);
      setComments(data);
      setEditingCommentId(null);
      setEditingCommentContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('이 댓글을 삭제하시겠습니까?')) {
      try {
        await commentApi.delete(commentId);
        const data = await commentApi.getByCardId(cardId);
        setComments(data);
        setOpenMenuId(null);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  // Attachment functions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await attachmentApi.upload(cardId, file);
      const data = await attachmentApi.getByCardId(cardId);
      setAttachments(data);
      // Refetch activities
      const activityData = await activityApi.getByCardId(cardId);
      setActivities(activityData);
    } catch (error) {
      console.error('Failed to upload attachment:', error);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDownloadAttachment = async (
    attachmentId: string,
    filename: string
  ) => {
    try {
      await attachmentApi.download(attachmentId, filename);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (window.confirm('이 첨부파일을 삭제하시겠습니까?')) {
      try {
        await attachmentApi.delete(attachmentId);
        const data = await attachmentApi.getByCardId(cardId);
        setAttachments(data);
      } catch (error) {
        console.error('Failed to delete attachment:', error);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatActivityMessage = (activity: ActivityLog) => {
    const { actionType, details, user } = activity;

    switch (actionType) {
      case 'CREATE_CARD':
        return `카드 "${details.title}"를 생성했습니다`;
      case 'UPDATE_TITLE':
        return `제목을 "${details.oldTitle}"에서 "${details.newTitle}"로 변경했습니다`;
      case 'UPDATE_DESCRIPTION':
        return '설명을 수정했습니다';
      case 'ASSIGN_USER':
        const assignee = workspaceMembers.find(
          (m) => m.user.id === details.assigneeId
        );
        return `${assignee?.user.name || '사용자'}를 담당자로 지정했습니다`;
      case 'UNASSIGN_USER':
        return '담당자 지정을 해제했습니다';
      case 'UPDATE_DUE_DATE':
        return `마감일을 ${new Date(details.dueDate).toLocaleDateString()}로 설정했습니다`;
      case 'REMOVE_DUE_DATE':
        return '마감일을 제거했습니다';
      case 'ADD_LABEL':
        return `레이블 "${details.label}"를 추가했습니다`;
      case 'REMOVE_LABEL':
        return `레이블 "${details.label}"를 제거했습니다`;
      case 'ADD_COMMENT':
        return '댓글을 남겼습니다';
      case 'UPLOAD_ATTACHMENT':
        return `파일 "${details.filename}"을 첨부했습니다`;
      case 'MOVE_CARD':
        return `카드를 "${details.fromColumn}"에서 "${details.toColumn}"(으)로 이동했습니다`;
      case 'COMPLETE_CARD':
        return '카드를 완료했습니다';
      case 'REOPEN_CARD':
        return '카드를 재오픈했습니다';
      default:
        return '활동을 기록했습니다';
    }
  };

  if (isLoadingCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">카드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">카드를 찾을 수 없습니다.</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">보드로 돌아가기</span>
            </button>
            <div className="ml-auto flex items-center gap-4">
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                카드 복사
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 transition cursor-pointer flex items-center gap-1"
              >
                <Archive className="w-4 h-4" />
                아카이브
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition cursor-pointer"
              >
                카드 삭제
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              card.isCompleted ? 'border-green-500 bg-gray-50' : 'border-blue-500'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={card.isCompleted || false}
                  onChange={handleToggleCompleted}
                  className="mt-2 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1">
                  {isEditingTitle ? (
                    <div>
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
                        className="w-full text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none pb-1"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <h1
                      onClick={() => setIsEditingTitle(true)}
                      className={`text-2xl font-bold cursor-pointer hover:text-blue-600 transition ${
                        card.isCompleted
                          ? 'line-through text-gray-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {card.title}
                    </h1>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    in{' '}
                    <span className="font-medium">{card.column?.title}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  설명
                </h2>
                {!isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    편집
                  </button>
                )}
              </div>
              {isEditingDesc ? (
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    placeholder="설명을 입력하세요..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm cursor-pointer"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setDescription(card.description || '');
                        setIsEditingDesc(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="text-gray-700 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded min-h-[60px]"
                >
                  {card.description || (
                    <span className="text-gray-400 italic">
                      설명을 추가하세요...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  체크리스트
                  {card.checklistItems && card.checklistItems.length > 0 && (
                    <span className="text-sm text-gray-500">
                      ({card.checklistItems.filter(item => item.isCompleted).length}/{card.checklistItems.length})
                    </span>
                  )}
                </h2>
              </div>

              {/* Add new checklist item form */}
              <form onSubmit={handleAddChecklistItem} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistItemContent}
                    onChange={(e) => setNewChecklistItemContent(e.target.value)}
                    placeholder="새 항목 추가..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newChecklistItemContent.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 cursor-pointer"
                  >
                    추가
                  </button>
                </div>
              </form>

              {/* Checklist items */}
              {card.checklistItems && card.checklistItems.length > 0 ? (
                <div className="space-y-2">
                  {/* Progress bar */}
                  {card.checklistItems.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>진행률</span>
                        <span>
                          {Math.round(
                            (card.checklistItems.filter((item) => item.isCompleted).length /
                              card.checklistItems.length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              (card.checklistItems.filter((item) => item.isCompleted).length /
                                card.checklistItems.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Checklist items list */}
                  {card.checklistItems
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                      >
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleChecklistItem(item.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                        />
                        {editingChecklistItemId === item.id ? (
                          <div className="flex-1">
                            <input
                              type="text"
                              value={editingChecklistItemContent}
                              onChange={(e) => setEditingChecklistItemContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateChecklistItem(item.id);
                                if (e.key === 'Escape') cancelEditingChecklistItem();
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleUpdateChecklistItem(item.id)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition cursor-pointer"
                              >
                                저장
                              </button>
                              <button
                                onClick={cancelEditingChecklistItem}
                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span
                              onClick={() => startEditingChecklistItem(item)}
                              className={`flex-1 text-sm cursor-pointer ${
                                item.isCompleted
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900'
                              }`}
                            >
                              {item.content}
                            </span>
                            <button
                              onClick={() => handleDeleteChecklistItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition cursor-pointer flex-shrink-0"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">체크리스트 항목이 없습니다</p>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-blue-600" />
                  첨부파일
                  {attachments.length > 0 && (
                    <span className="text-sm text-gray-500">
                      ({attachments.length})
                    </span>
                  )}
                </h2>
                <label className="cursor-pointer px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  업로드
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {isLoadingAttachments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">첨부파일이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.size)} •{' '}
                            {getRelativeTime(attachment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleDownloadAttachment(
                              attachment.id,
                              attachment.filename
                            )
                          }
                          className="p-2 text-gray-600 hover:text-blue-600 transition cursor-pointer"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isUploading && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-600">
                      업로드 중...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  활동 로그
                  {activities.length > 0 && (
                    <span className="text-sm text-gray-500">
                      ({activities.length})
                    </span>
                  )}
                </h2>
                {activities.length > 0 && (
                  <button
                    onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        isActivityExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {isLoadingActivities ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">활동 기록이 없습니다</p>
                </div>
              ) : (
                isActivityExpanded && (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Avatar
                          name={activity.user.name}
                          avatar={activity.user.avatar}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">
                              {activity.user.name}
                            </span>
                            <span className="text-gray-600">
                              {' '}
                              {formatActivityMessage(activity)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {getRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                댓글
                {comments.length > 0 && (
                  <span className="text-sm text-gray-500">
                    ({comments.length})
                  </span>
                )}
              </h2>

              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6 relative">
                <div className="flex gap-3">
                  <div
                    id="comment-input"
                    contentEditable
                    onInput={handleCommentInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment(e);
                      }
                    }}
                    data-placeholder="댓글을 입력하세요... (@로 멘션)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[120px] overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                    suppressContentEditableWarning
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">작성</span>
                  </button>
                </div>

                {/* Mention Suggestions Dropdown */}
                {showMentionSuggestions && (
                  <div className="absolute top-full left-0 mt-1 w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {getFilteredMembers().map((member) => (
                      <button
                        key={member.user.id}
                        type="button"
                        onClick={() => handleSelectMention(member)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                      >
                        <Avatar
                          name={member.user.name}
                          avatar={member.user.avatar}
                          size="xs"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.user.email}
                          </p>
                        </div>
                      </button>
                    ))}
                    {getFilteredMembers().length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        일치하는 멤버가 없습니다
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">첫 댓글을 남겨보세요</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                      <Avatar
                        name={comment.author.name}
                        avatar={comment.author.avatar}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="font-medium text-gray-900 text-sm">
                              {comment.author.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {getRelativeTime(comment.createdAt)}
                            </span>
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
                                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === comment.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-6 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[100px]">
                                    <button
                                      onClick={() =>
                                        startEditingComment(comment)
                                      }
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" /> 수정
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" /> 삭제
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          {editingCommentId === comment.id ? (
                            <div>
                              <input
                                type="text"
                                value={editingCommentContent}
                                onChange={(e) =>
                                  setEditingCommentContent(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                              />
                              <div className="flex gap-2">
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
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {formatCommentContent(comment.content)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Assignee */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                담당자
              </h3>
              <div className="relative">
                <button
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-left flex items-center justify-between cursor-pointer"
                >
                  {card.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={card.assignee.name}
                        avatar={card.assignee.avatar}
                        size="xs"
                      />
                      <span className="text-sm">{card.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">
                      담당자 지정
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showAssigneeDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAssigneeDropdown(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => handleAssigneeChange(null)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="text-gray-400">담당자 없음</span>
                      </button>
                      {workspaceMembers.map((member) => (
                        <button
                          key={member.user.id}
                          onClick={() => handleAssigneeChange(member.user.id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Avatar
                            name={member.user.name}
                            avatar={member.user.avatar}
                            size="xs"
                          />
                          <span className="text-sm">{member.user.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                마감일
              </h3>
              <div className="relative">
                {card.dueDate ? (
                  <div className="space-y-2">
                    <DueDateBadge dueDate={card.dueDate} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setTempDueDate(
                            new Date(card.dueDate!)
                              .toISOString()
                              .split('T')[0]
                          );
                          setShowDueDatePicker(true);
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition cursor-pointer"
                      >
                        변경
                      </button>
                      <button
                        onClick={handleRemoveDueDate}
                        className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded transition cursor-pointer"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDueDatePicker(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-left text-sm text-gray-400 cursor-pointer"
                  >
                    마감일 설정
                  </button>
                )}

                {showDueDatePicker && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowDueDatePicker(false);
                        setTempDueDate('');
                      }}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
                      <input
                        type="date"
                        value={tempDueDate}
                        onChange={(e) => setTempDueDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                      />
                      <button
                        onClick={handleDueDateChange}
                        disabled={!tempDueDate}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 cursor-pointer"
                      >
                        저장
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Labels */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                레이블
              </h3>
              <div className="space-y-2">
                {card.cardLabels && card.cardLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {card.cardLabels.map((cardLabel) => (
                      <span
                        key={cardLabel.id}
                        className="px-3 py-1 text-xs text-white rounded-full font-medium shadow-sm"
                        style={{ backgroundColor: cardLabel.label.color }}
                      >
                        {cardLabel.label.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">레이블이 없습니다</p>
                )}
                <button
                  onClick={() => setShowLabelModal(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-left text-sm text-gray-600 cursor-pointer"
                >
                  레이블 편집
                </button>

                {showLabelModal && (
                  <>
                    <div
                      className="fixed inset-0 bg-black/50 z-40"
                      onClick={() => setShowLabelModal(false)}
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          레이블 선택
                        </h3>
                        {isLoadingLabels ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : boardLabels.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">
                            보드에 라벨이 없습니다. 보드 설정에서 라벨을 먼저 생성하세요.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {boardLabels.map((label) => {
                              const isAssigned = card.cardLabels?.some(
                                (cl) => cl.label.id === label.id
                              );
                              return (
                                <button
                                  key={label.id}
                                  onClick={() => handleToggleLabel(label.id)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition cursor-pointer ${
                                    isAssigned
                                      ? 'bg-gray-100 ring-2 ring-blue-500'
                                      : 'bg-gray-50 hover:bg-gray-100'
                                  }`}
                                >
                                  <div
                                    className="w-8 h-8 rounded"
                                    style={{ backgroundColor: label.color }}
                                  />
                                  <span className="flex-1 text-left font-medium text-gray-900">
                                    {label.name}
                                  </span>
                                  {isAssigned && (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => setShowLabelModal(false)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm cursor-pointer"
                          >
                            완료
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Created Info */}
            {card.creator && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  생성 정보
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={card.creator.name}
                      avatar={card.creator.avatar}
                      size="xs"
                    />
                    <span>{card.creator.name}</span>
                  </div>
                  {card.createdAt && (
                    <p className="text-xs text-gray-500">
                      {getRelativeTime(card.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
