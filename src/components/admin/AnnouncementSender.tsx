'use client';

import { useEffect, useState, useCallback } from 'react';
import { useModal } from '@/hooks/useModal';

interface AnnouncementItem {
  _id: string;
  title: string;
  message: string;
  target: 'all' | 'active';
  sentCount: number;
  sentBy: { _id: string; nName?: string; authorEmail: string } | null;
  createdAt: string;
}

export default function AnnouncementSender() {
  const { confirm, alert } = useModal();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'active'>('all');
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<AnnouncementItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/announcements?limit=50');
      const json = await res.json();
      if (json.success) setHistory(json.data.announcements);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      await alert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    const targetLabel = target === 'all' ? '전체 사용자' : '활성 사용자';
    const ok = await confirm(
      '공지 발송 확인',
      `"${title}" 공지를 ${targetLabel}에게 발송하시겠습니까?`,
      { confirmText: '발송', isDestructive: false }
    );
    if (!ok) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, target }),
      });
      const json = await res.json();
      if (json.success) {
        await alert('발송 완료', json.message);
        setTitle('');
        setMessage('');
        fetchHistory();
      } else {
        await alert('발송 실패', json.message);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 발송 폼 */}
      <div className="bg-surface-container-lowest rounded-lg p-6 space-y-5">
        <div>
          <label className="block font-body text-body-md font-semibold text-on-surface mb-2">
            제목
          </label>
          <input
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary font-body text-body-md text-on-surface"
            placeholder="공지 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div>
          <label className="block font-body text-body-md font-semibold text-on-surface mb-2">
            내용
          </label>
          <textarea
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary font-body text-body-md text-on-surface resize-y min-h-[120px]"
            placeholder="공지 내용을 입력하세요"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
          />
          <p className="font-body text-label-md text-on-surface-variant mt-1 text-right">
            {message.length}/1000
          </p>
        </div>

        <div>
          <label className="block font-body text-body-md font-semibold text-on-surface mb-2">
            발송 대상
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="target"
                value="all"
                checked={target === 'all'}
                onChange={() => setTarget('all')}
                className="accent-primary"
              />
              <span className="font-body text-body-md text-on-surface">전체 사용자</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="target"
                value="active"
                checked={target === 'active'}
                onChange={() => setTarget('active')}
                className="accent-primary"
              />
              <span className="font-body text-body-md text-on-surface">활성 사용자만</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="px-6 py-2.5 bg-primary-container text-on-primary rounded-lg font-body text-body-md font-semibold disabled:opacity-40 transition-colors"
        >
          {sending ? '발송 중...' : '공지 발송'}
        </button>
      </div>

      {/* 발송 이력 */}
      <div>
        <h3 className="font-headline text-headline-sm font-semibold text-on-surface mb-4">
          발송 이력
        </h3>

        {historyLoading ? (
          <p className="font-body text-body-md text-on-surface-variant py-8 text-center">
            불러오는 중...
          </p>
        ) : history.length === 0 ? (
          <p className="font-body text-body-md text-on-surface-variant py-8 text-center">
            발송 이력이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                    제목
                  </th>
                  <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                    대상
                  </th>
                  <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                    발송 수
                  </th>
                  <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                    발송자
                  </th>
                  <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                    발송일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/15">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-4 py-3 font-body text-body-md text-on-surface">
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded font-body text-label-md font-medium ${
                          item.target === 'all'
                            ? 'text-primary bg-primary/5'
                            : 'text-emerald-600 bg-emerald-50'
                        }`}
                      >
                        {item.target === 'all' ? '전체' : '활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface-variant">
                      {item.sentCount.toLocaleString()}명
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface-variant">
                      {item.sentBy?.nName || item.sentBy?.authorEmail || '(알 수 없음)'}
                    </td>
                    <td className="px-4 py-3 font-body text-label-md text-on-surface-variant">
                      {new Date(item.createdAt).toLocaleString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
