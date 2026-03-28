/**
 * 테스트용 채팅 Mock 데이터
 * IChatRoomClient / IChatParticipant (src/types/chat.ts) 기반
 */
import type { IChatRoomClient, IChatParticipant } from '@/types/chat';
import { USER_IDS } from './users';

// ─── 공통 ID 상수 ──────────────────────────────────────────────────────────────
export const ROOM_IDS = {
  dm: 'aaaa00000000000000000001',
  recruit: 'aaaa00000000000000000002',
  team: 'aaaa00000000000000000003',
  inquiry: 'aaaa00000000000000000004',
  system: 'aaaa00000000000000000005',
} as const;

export const PROJECT_IDS = {
  alpha: 'bbbb00000000000000000001',
} as const;

// ─── Mock 참여자 ────────────────────────────────────────────────────────────────
export const participantAlice: IChatParticipant = {
  _id: USER_IDS.alice,
  nName: '앨리스',
  avatarUrl: 'https://example.com/alice.png',
};

export const participantBob: IChatParticipant = {
  _id: USER_IDS.bob,
  nName: '밥',
  avatarUrl: '',
};

export const participantCarol: IChatParticipant = {
  _id: USER_IDS.carol,
  nName: '캐롤',
  avatarUrl: 'https://example.com/carol.png',
};

/** nName/avatarUrl 없는 참여자 (필드 누락 시뮬레이션) */
export const participantUnknown: IChatParticipant = {
  _id: '000000000000000000000099',
};

// ─── Mock 채팅방 ────────────────────────────────────────────────────────────────

/** DM 채팅방 (alice ↔ bob) */
export const mockDmRoom: IChatRoomClient = {
  _id: ROOM_IDS.dm,
  category: 'DM',
  participants: [participantAlice, participantBob],
  lastMessage: '안녕하세요!',
  updatedAt: '2024-03-01T10:00:00.000Z',
  myUnreadCount: 2,
};

/** 지원(RECRUIT) 채팅방 (alice ↔ bob, 프로젝트 연결) */
export const mockRecruitRoom: IChatRoomClient = {
  _id: ROOM_IDS.recruit,
  category: 'RECRUIT',
  participants: [participantAlice, participantBob],
  projectId: PROJECT_IDS.alpha,
  projectName: '알파 프로젝트',
  lastMessage: '지원해 주셔서 감사합니다.',
  updatedAt: '2024-03-01T11:00:00.000Z',
  myUnreadCount: 0,
};

/** 팀(TEAM) 채팅방 (alice, bob, carol) */
export const mockTeamRoom: IChatRoomClient = {
  _id: ROOM_IDS.team,
  category: 'TEAM',
  participants: [participantAlice, participantBob, participantCarol],
  projectId: PROJECT_IDS.alpha,
  projectName: '알파 프로젝트',
  lastMessage: '팀 채팅방이 생성되었습니다.',
  updatedAt: '2024-03-01T12:00:00.000Z',
  myUnreadCount: 0,
};

/** 문의(INQUIRY) 채팅방 (projectName 없음 → metadata.name 폴백 테스트용) */
export const mockInquiryRoomWithMeta: IChatRoomClient = {
  _id: ROOM_IDS.inquiry,
  category: 'INQUIRY',
  participants: [participantAlice, participantBob],
  projectId: PROJECT_IDS.alpha,
  metadata: { name: '메타데이터 프로젝트명' },
  updatedAt: '2024-03-01T13:00:00.000Z',
  myUnreadCount: 1,
};

/** 시스템(SYSTEM) 채팅방 */
export const mockSystemRoom: IChatRoomClient = {
  _id: ROOM_IDS.system,
  category: 'SYSTEM',
  participants: [participantAlice],
  lastMessage: 'Side Project Mate 시스템 가이드 봇입니다.',
  updatedAt: '2024-03-01T09:00:00.000Z',
  myUnreadCount: 0,
};

/** DM 채팅방 — 상대방 nName 없음 (필드 누락 케이스) */
export const mockDmRoomUnknownOther: IChatRoomClient = {
  _id: 'aaaa00000000000000000006',
  category: 'DM',
  participants: [participantAlice, participantUnknown],
  updatedAt: '2024-03-01T08:00:00.000Z',
  myUnreadCount: 0,
};
