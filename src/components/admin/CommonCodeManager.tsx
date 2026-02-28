'use client';

import { useEffect, useState, useCallback } from 'react';
import { useModal } from '@/hooks/useModal';

interface CommonCode {
  _id: string;
  group: string;
  groupName: string;
  code: string;
  label: string;
  order: number;
  isActive: boolean;
}

const GROUPS = [
  { group: 'POSITION', groupName: '직군' },
  { group: 'PROJECT_CATEGORY', groupName: '프로젝트 카테고리' },
  { group: 'CAREER', groupName: '경력' },
];

const DEFAULT_FORM = { code: '', label: '', order: 0, isActive: true };

export default function CommonCodeManager() {
  const { confirm, alert } = useModal();
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].group);
  const [codes, setCodes] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CommonCode>>({});
  const [addForm, setAddForm] = useState({ ...DEFAULT_FORM });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/common-codes?group=${activeGroup}`);
      const json = await res.json();
      if (json.success) setCodes(json.data);
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  useEffect(() => {
    fetchCodes();
    setEditingId(null);
    setShowAddForm(false);
  }, [fetchCodes]);

  const handleToggleActive = async (code: CommonCode) => {
    const res = await fetch(`/api/admin/common-codes/${code._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !code.isActive }),
    });
    const json = await res.json();
    if (json.success) {
      setCodes((prev) => prev.map((c) => (c._id === code._id ? json.data : c)));
    } else {
      await alert('오류', json.message);
    }
  };

  const handleEditStart = (code: CommonCode) => {
    setEditingId(code._id);
    setEditForm({ label: code.label, order: code.order });
  };

  const handleEditSave = async (id: string) => {
    const res = await fetch(`/api/admin/common-codes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    if (json.success) {
      setCodes((prev) => prev.map((c) => (c._id === id ? json.data : c)));
      setEditingId(null);
    } else {
      await alert('오류', json.message);
    }
  };

  const handleDelete = async (code: CommonCode) => {
    const ok = await confirm('삭제 확인', `"${code.label}" 코드를 삭제하시겠습니까?`, {
      confirmText: '삭제',
      isDestructive: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/admin/common-codes/${code._id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setCodes((prev) => prev.filter((c) => c._id !== code._id));
    } else {
      await alert('오류', json.message);
    }
  };

  const handleAdd = async () => {
    if (!addForm.code || !addForm.label) {
      await alert('입력 오류', '코드와 레이블을 입력해주세요.');
      return;
    }
    const currentGroup = GROUPS.find((g) => g.group === activeGroup)!;
    const res = await fetch('/api/admin/common-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group: activeGroup,
        groupName: currentGroup.groupName,
        code: addForm.code,
        label: addForm.label,
        order: addForm.order,
        isActive: addForm.isActive,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setCodes((prev) => [...prev, json.data].sort((a, b) => a.order - b.order));
      setAddForm({ ...DEFAULT_FORM });
      setShowAddForm(false);
    } else {
      await alert('오류', json.message);
    }
  };

  return (
    <div>
      {/* 그룹 탭 */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {GROUPS.map(({ group, groupName }) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeGroup === group
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {groupName}
          </button>
        ))}
      </div>

      {/* 추가 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? '취소' : '+ 코드 추가'}
        </button>
      </div>

      {/* 추가 폼 */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">코드 *</label>
            <input
              className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm w-24"
              placeholder="예: 01"
              value={addForm.code}
              onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">레이블 *</label>
            <input
              className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm w-36"
              placeholder="예: 프론트엔드"
              value={addForm.label}
              onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">순서</label>
            <input
              type="number"
              className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm w-20"
              value={addForm.order}
              onChange={(e) => setAddForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
            />
          </div>
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
                <th className="px-4 py-3 text-left font-medium">코드</th>
                <th className="px-4 py-3 text-left font-medium">레이블</th>
                <th className="px-4 py-3 text-left font-medium w-20">순서</th>
                <th className="px-4 py-3 text-left font-medium">활성</th>
                <th className="px-4 py-3 text-right font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {codes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    코드가 없습니다.
                  </td>
                </tr>
              )}
              {codes.map((code) => (
                <tr key={code._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-foreground">{code.code}</td>
                  <td className="px-4 py-3">
                    {editingId === code._id ? (
                      <input
                        className="border border-border bg-background text-foreground rounded px-2 py-0.5 text-sm w-full max-w-xs"
                        value={editForm.label ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                      />
                    ) : (
                      <span className="text-foreground">{code.label}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === code._id ? (
                      <input
                        type="number"
                        className="border border-border bg-background text-foreground rounded px-2 py-0.5 text-sm w-16"
                        value={editForm.order ?? 0}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))
                        }
                      />
                    ) : (
                      <span className="text-foreground">{code.order}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(code)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        code.isActive ? 'bg-blue-600' : 'bg-muted-foreground/40'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          code.isActive ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {editingId === code._id ? (
                        <>
                          <button
                            onClick={() => handleEditSave(code._id)}
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
                            onClick={() => handleEditStart(code)}
                            className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-muted/70"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDelete(code)}
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
