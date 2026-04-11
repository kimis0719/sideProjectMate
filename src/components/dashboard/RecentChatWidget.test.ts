import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * RecentChatWidget 단위 테스트
 *
 * React 렌더링 없이 핵심 로직을 검증합니다.
 * - 채팅방 필터링 로직 (TEAM + projectId 매칭)
 * - 메시지 sender 헬퍼 함수
 * - 시간 포맷팅 함수
 */

// --- 채팅방 필터링 ---

interface ChatRoom {
  _id: string;
  category: string;
  projectId?: string;
}

const findTeamRoom = (rooms: ChatRoom[], projectId: string): ChatRoom | undefined =>
  rooms.find((room) => room.category === 'TEAM' && room.projectId === projectId);

describe('RecentChatWidget — 채팅방 필터링', () => {
  const rooms: ChatRoom[] = [
    { _id: 'r1', category: 'TEAM', projectId: 'proj-a' },
    { _id: 'r2', category: 'INQUIRY', projectId: 'proj-a' },
    { _id: 'r3', category: 'TEAM', projectId: 'proj-b' },
    { _id: 'r4', category: 'PERSONAL' },
  ];

  it('TEAM + projectId 매칭으로 정확한 방을 찾는다', () => {
    const result = findTeamRoom(rooms, 'proj-a');
    expect(result?._id).toBe('r1');
  });

  it('다른 projectId의 TEAM 방은 매칭되지 않는다', () => {
    const result = findTeamRoom(rooms, 'proj-b');
    expect(result?._id).toBe('r3');
  });

  it('TEAM이 아닌 카테고리는 매칭되지 않는다', () => {
    const onlyInquiry: ChatRoom[] = [{ _id: 'r2', category: 'INQUIRY', projectId: 'proj-a' }];
    expect(findTeamRoom(onlyInquiry, 'proj-a')).toBeUndefined();
  });

  it('매칭 방이 없으면 undefined를 반환한다', () => {
    expect(findTeamRoom(rooms, 'proj-z')).toBeUndefined();
  });

  it('빈 배열이면 undefined를 반환한다', () => {
    expect(findTeamRoom([], 'proj-a')).toBeUndefined();
  });
});

// --- Sender 헬퍼 ---

type Sender = { _id: string; nName?: string; avatarUrl?: string } | string;

const getSenderId = (sender: Sender) => (typeof sender === 'string' ? sender : sender._id);
const getSenderName = (sender: Sender) =>
  typeof sender === 'string' ? '알 수 없음' : sender.nName || '알 수 없음';
const getSenderAvatar = (sender: Sender) =>
  typeof sender === 'string' ? null : sender.avatarUrl || null;

describe('RecentChatWidget — sender 헬퍼', () => {
  it('object sender에서 _id를 추출한다', () => {
    expect(getSenderId({ _id: 'u1', nName: 'A' })).toBe('u1');
  });

  it('string sender는 그대로 반환한다', () => {
    expect(getSenderId('u2')).toBe('u2');
  });

  it('object sender에서 nName을 추출한다', () => {
    expect(getSenderName({ _id: 'u1', nName: '홍길동' })).toBe('홍길동');
  });

  it('nName이 없으면 "알 수 없음"', () => {
    expect(getSenderName({ _id: 'u1' })).toBe('알 수 없음');
  });

  it('string sender면 "알 수 없음"', () => {
    expect(getSenderName('u1')).toBe('알 수 없음');
  });

  it('avatarUrl이 있으면 반환', () => {
    expect(getSenderAvatar({ _id: 'u1', avatarUrl: 'http://img' })).toBe('http://img');
  });

  it('avatarUrl이 없으면 null', () => {
    expect(getSenderAvatar({ _id: 'u1' })).toBeNull();
  });

  it('string sender면 avatar null', () => {
    expect(getSenderAvatar('u1')).toBeNull();
  });
});

// --- 시간 포맷팅 ---

const formatTime = (dateStr: string, now: Date = new Date()) => {
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

describe('RecentChatWidget — 시간 포맷팅', () => {
  const now = new Date('2026-04-09T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('30초 전 → "방금"', () => {
    expect(formatTime('2026-04-09T11:59:30Z', now)).toBe('방금');
  });

  it('5분 전 → "5분 전"', () => {
    expect(formatTime('2026-04-09T11:55:00Z', now)).toBe('5분 전');
  });

  it('3시간 전 → "3시간 전"', () => {
    expect(formatTime('2026-04-09T09:00:00Z', now)).toBe('3시간 전');
  });

  it('2일 전 → "2일 전"', () => {
    expect(formatTime('2026-04-07T12:00:00Z', now)).toBe('2일 전');
  });

  it('8일 전 → 날짜 표시', () => {
    const result = formatTime('2026-04-01T12:00:00Z', now);
    // ko-KR short month + day: "4월 1일" 등
    expect(result).toMatch(/4월/);
  });
});
