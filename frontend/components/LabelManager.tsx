'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

interface LabelManagerProps {
  boardId: string;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0',
  '#33FFF0', '#F0FF33', '#FF8C33', '#8C33FF', '#33FF8C',
  '#FF3333', '#33FF33', '#3333FF', '#FFFF33', '#FF33FF',
  '#33FFFF', '#FFB833', '#B833FF', '#33FFB8', '#FFC300',
];

export function LabelManager({ boardId, onClose }: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('');

  useEffect(() => {
    fetchLabels();
  }, [boardId]);

  const fetchLabels = async () => {
    try {
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
        setLabels(data);
      }
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    }
  };

  const handleCreate = async () => {
    if (!newLabelName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newLabelName,
          color: newLabelColor,
          boardId,
        }),
      });

      if (response.ok) {
        setNewLabelName('');
        setNewLabelColor(PRESET_COLORS[0]);
        setIsCreating(false);
        fetchLabels();
      }
    } catch (error) {
      console.error('Failed to create label:', error);
    }
  };

  const handleUpdate = async (labelId: string) => {
    if (!editLabelName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/labels/${labelId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editLabelName,
            color: editLabelColor,
          }),
        }
      );

      if (response.ok) {
        setEditingId(null);
        setEditLabelName('');
        setEditLabelColor('');
        fetchLabels();
      }
    } catch (error) {
      console.error('Failed to update label:', error);
    }
  };

  const handleDelete = async (labelId: string) => {
    if (!window.confirm('이 라벨을 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/labels/${labelId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchLabels();
      }
    } catch (error) {
      console.error('Failed to delete label:', error);
    }
  };

  const startEdit = (label: Label) => {
    setEditingId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">라벨 관리</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Labels List */}
          <div className="space-y-3 mb-4">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {editingId === label.id ? (
                  <>
                    <input
                      type="color"
                      value={editLabelColor}
                      onChange={(e) => setEditLabelColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editLabelName}
                      onChange={(e) => setEditLabelName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="라벨 이름"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(label.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditLabelName('');
                        setEditLabelColor('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-10 h-10 rounded"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1 font-medium text-gray-900">
                      {label.name}
                    </span>
                    <button
                      onClick={() => startEdit(label)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(label.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Create New Label */}
          {isCreating ? (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">새 라벨 만들기</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="라벨 이름"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    색상
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewLabelColor(color)}
                        className={`w-10 h-10 rounded cursor-pointer transition ${
                          newLabelColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">커스텀 색상</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    만들기
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewLabelName('');
                      setNewLabelColor(PRESET_COLORS[0]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              새 라벨 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
