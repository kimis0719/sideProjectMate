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

interface CodeGroup {
  _id: string;
  group: string;
  groupName: string;
  order: number;
  isActive: boolean;
}

const DEFAULT_FORM = { code: '', label: '', order: 0, isActive: true };

export default function CommonCodeManager() {
  const { confirm, alert } = useModal();
  const [groups, setGroups] = useState<CodeGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState('');
  const [codes, setCodes] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CommonCode>>({});
  const [addForm, setAddForm] = useState({ ...DEFAULT_FORM });
  const [showAddForm, setShowAddForm] = useState(false);

  // 그룹 목록 로딩
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/admin/common-codes/groups');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setGroups(json.data);
          setActiveGroup(json.data[0].group);
        }
      } catch (e) {
        console.error('그룹 로딩 실패:', e);
      } finally {
        setGroupsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const fetchCodes = useCallback(async () => {
    if (!activeGroup) return;
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
    setEditForm({ code: code.code, label: code.label, order: code.order });
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
    const currentGroup = groups.find((g) => g.group === activeGroup)!;
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
      {groupsLoading ? (
        <p className="text-on-surface-variant font-body text-body-md py-4">그룹 로딩 중...</p>
      ) : groups.length === 0 ? (
        <p className="text-on-surface-variant font-body text-body-md py-4">
          등록된 그룹이 없습니다.
        </p>
      ) : (
        <div className="flex gap-2 mb-6 border-b border-outline-variant/15 flex-wrap">
          {groups.map(({ group, groupName, isActive }) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`font-body text-body-md px-4 py-2 border-b-2 transition-colors ${
                activeGroup === group
                  ? 'border-b-2 border-primary text-primary font-semibold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              } ${!isActive ? 'opacity-40 line-through' : ''}`}
            >
              {groupName}
            </button>
          ))}
        </div>
      )}

      {/* 추가 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-body text-body-md hover:bg-primary-container/80 transition-colors"
        >
          {showAddForm ? '취소' : '+ 코드 추가'}
        </button>
      </div>

      {/* 추가 폼 */}
      {showAddForm && (
        <div className="mb-4 bg-primary/5 rounded-lg p-6 space-y-4 flex gap-3 flex-wrap items-end">
          <div>
            <label className="block font-body text-label-md text-on-surface-variant mb-1">
              코드 *
            </label>
            <input
              className="bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 font-body text-body-md w-24"
              placeholder="예: 01"
              value={addForm.code}
              onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="block font-body text-label-md text-on-surface-variant mb-1">
              레이블 *
            </label>
            <input
              className="bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 font-body text-body-md w-36"
              placeholder="예: 프론트엔드"
              value={addForm.label}
              onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div>
            <label className="block font-body text-label-md text-on-surface-variant mb-1">
              순서
            </label>
            <input
              type="number"
              className="bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 font-body text-body-md w-20"
              value={addForm.order}
              onChange={(e) => setAddForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-1.5 bg-primary-container text-on-primary rounded-lg font-body text-body-md hover:bg-primary-container/80 transition-colors"
          >
            저장
          </button>
        </div>
      )}

      {/* 테이블 */}
      {loading ? (
        <p className="text-on-surface-variant font-body text-body-md py-8 text-center">
          로딩 중...
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant/15">
          <table className="w-full font-body text-body-md">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant">
                  코드
                </th>
                <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant">
                  레이블
                </th>
                <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant w-20">
                  순서
                </th>
                <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant">
                  활성
                </th>
                <th className="px-4 py-3 text-right font-body text-label-md font-semibold text-on-surface-variant">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 bg-surface-container-lowest">
              {codes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-on-surface-variant">
                    코드가 없습니다.
                  </td>
                </tr>
              )}
              {codes.map((code) => (
                <tr key={code._id} className="hover:bg-surface-bright transition-colors">
                  <td className="px-4 py-3">
                    {editingId === code._id ? (
                      <input
                        className="bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 font-body text-body-md font-mono w-full max-w-[120px]"
                        value={editForm.code ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                      />
                    ) : (
                      <span className="font-mono text-on-surface">{code.code}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === code._id ? (
                      <input
                        className="bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 font-body text-body-md w-full max-w-xs"
                        value={editForm.label ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                      />
                    ) : (
                      <span className="text-on-surface">{code.label}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === code._id ? (
                      <input
                        type="number"
                        className="bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 font-body text-body-md w-16"
                        value={editForm.order ?? 0}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))
                        }
                      />
                    ) : (
                      <span className="text-on-surface">{code.order}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(code)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                        code.isActive ? 'bg-primary' : 'bg-surface-container-high'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          code.isActive ? 'translate-x-4' : ''
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
                            className="font-body text-label-md px-3 py-1 bg-primary-container text-on-primary rounded-lg hover:bg-primary-container/80"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="font-body text-label-md px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container-high/70"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditStart(code)}
                            className="font-body text-label-md px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container-high/70"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDelete(code)}
                            className="font-body text-label-md px-3 py-1 bg-error text-on-error rounded-lg hover:bg-error/80"
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
