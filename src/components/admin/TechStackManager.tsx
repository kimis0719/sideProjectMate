'use client';

import { useEffect, useState, useCallback } from 'react';
import { useModal } from '@/hooks/useModal';
import { getIconSlug } from '@/lib/iconUtils';

type TechCategory = 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'etc';

interface TechStack {
  _id: string;
  name: string;
  category: TechCategory;
  logoUrl?: string;
}

const CATEGORIES: { value: TechCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'frontend', label: '프론트엔드' },
  { value: 'backend', label: '백엔드' },
  { value: 'database', label: '데이터베이스' },
  { value: 'devops', label: 'DevOps' },
  { value: 'mobile', label: '모바일' },
  { value: 'etc', label: '기타' },
];

const DEFAULT_FORM = { name: '', category: 'frontend' as TechCategory, logoUrl: '' };

export default function TechStackManager() {
  const { confirm, alert } = useModal();
  const [activeCategory, setActiveCategory] = useState<TechCategory | 'all'>('all');
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TechStack>>({});
  const [addForm, setAddForm] = useState({ ...DEFAULT_FORM });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchStacks = useCallback(async () => {
    setLoading(true);
    try {
      const param = activeCategory !== 'all' ? `?category=${activeCategory}` : '';
      const res = await fetch(`/api/admin/tech-stacks${param}`);
      const json = await res.json();
      if (json.success) setStacks(json.data);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchStacks();
    setEditingId(null);
    setShowAddForm(false);
  }, [fetchStacks]);

  const handleEditStart = (stack: TechStack) => {
    setEditingId(stack._id);
    setEditForm({ name: stack.name, category: stack.category, logoUrl: stack.logoUrl ?? '' });
  };

  const handleEditSave = async (id: string) => {
    const res = await fetch(`/api/admin/tech-stacks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    if (json.success) {
      setStacks((prev) => prev.map((s) => (s._id === id ? json.data : s)));
      setEditingId(null);
    } else {
      await alert('오류', json.message);
    }
  };

  const handleDelete = async (stack: TechStack) => {
    const ok = await confirm('삭제 확인', `"${stack.name}"을(를) 삭제하시겠습니까?`, {
      confirmText: '삭제',
      isDestructive: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/admin/tech-stacks/${stack._id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setStacks((prev) => prev.filter((s) => s._id !== stack._id));
    } else {
      await alert('오류', json.message);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.category) {
      await alert('입력 오류', '기술명과 카테고리를 입력해주세요.');
      return;
    }
    const res = await fetch('/api/admin/tech-stacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    const json = await res.json();
    if (json.success) {
      setStacks((prev) => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm({ ...DEFAULT_FORM });
      setShowAddForm(false);
    } else {
      await alert('오류', json.message);
    }
  };

  const getIconUrl = (name: string, logoUrl?: string) => {
    if (logoUrl) return logoUrl;
    const slug = getIconSlug(name);
    return `https://skillicons.dev/icons?i=${slug}`;
  };

  return (
    <div>
      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-6 flex-wrap border-b border-border">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeCategory === value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 추가 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? '취소' : '+ 기술 추가'}
        </button>
      </div>

      {/* 추가 폼 */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">기술명 *</label>
            <input
              className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm w-36"
              placeholder="예: React"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">카테고리 *</label>
            <select
              className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm"
              value={addForm.category}
              onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as TechCategory }))}
            >
              {CATEGORIES.filter((c) => c.value !== 'all').map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">로고 URL (선택)</label>
            <input
              className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm w-48"
              placeholder="비워두면 자동 생성"
              value={addForm.logoUrl}
              onChange={(e) => setAddForm((f) => ({ ...f, logoUrl: e.target.value }))}
            />
          </div>
          {addForm.name && (
            <div className="flex items-center gap-2">
              <img
                src={getIconUrl(addForm.name, addForm.logoUrl)}
                alt={addForm.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-xs text-muted-foreground">미리보기</span>
            </div>
          )}
          <button
            onClick={handleAdd}
            className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            저장
          </button>
        </div>
      )}

      {/* 테이블 */}
      {loading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">로딩 중...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-12">아이콘</th>
                <th className="px-4 py-3 text-left font-medium">기술명</th>
                <th className="px-4 py-3 text-left font-medium">카테고리</th>
                <th className="px-4 py-3 text-left font-medium">로고 URL</th>
                <th className="px-4 py-3 text-right font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {stacks.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    기술 스택이 없습니다.
                  </td>
                </tr>
              )}
              {stacks.map((stack) => (
                <tr key={stack._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <img
                      src={getIconUrl(
                        editingId === stack._id ? (editForm.name ?? stack.name) : stack.name,
                        editingId === stack._id ? editForm.logoUrl : stack.logoUrl
                      )}
                      alt={stack.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {editingId === stack._id ? (
                      <input
                        className="border border-border bg-background text-foreground rounded px-2 py-0.5 text-sm w-36"
                        value={editForm.name ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    ) : (
                      stack.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {editingId === stack._id ? (
                      <select
                        className="border border-border bg-background text-foreground rounded px-2 py-0.5 text-sm"
                        value={editForm.category ?? stack.category}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, category: e.target.value as TechCategory }))
                        }
                      >
                        {CATEGORIES.filter((c) => c.value !== 'all').map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      CATEGORIES.find((c) => c.value === stack.category)?.label ?? stack.category
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">
                    {editingId === stack._id ? (
                      <input
                        className="border border-border bg-background text-foreground rounded px-2 py-0.5 text-sm w-full"
                        placeholder="비워두면 자동"
                        value={editForm.logoUrl ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, logoUrl: e.target.value }))}
                      />
                    ) : (
                      stack.logoUrl || <span className="italic">자동</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {editingId === stack._id ? (
                        <>
                          <button
                            onClick={() => handleEditSave(stack._id)}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-muted/70"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditStart(stack)}
                            className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-muted/70"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDelete(stack)}
                            className="text-xs px-3 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 rounded hover:bg-red-100 dark:hover:bg-red-950/50"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
