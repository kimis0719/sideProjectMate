/**
 * 테스트용 Mock 유저 데이터
 * IUser 인터페이스(src/lib/models/User.ts) 기반
 */
import type { ProfileCompletenessParams } from '@/lib/profileUtils';

// ─── 공통 ID 상수 ──────────────────────────────────────────────────────────────
export const USER_IDS = {
  alice: '000000000000000000000001',
  bob: '000000000000000000000002',
  carol: '000000000000000000000003',
  admin: '000000000000000000000004',
} as const;

// ─── Mock 유저 객체 ─────────────────────────────────────────────────────────────

/** 풀 프로필 완성 유저 */
export const mockUserAlice = {
  _id: USER_IDS.alice,
  authorEmail: 'alice@test.com',
  nName: '앨리스',
  uid: 1001,
  memberType: 'user' as const,
  delYn: false,
  position: '프론트엔드 개발자',
  career: '3년차',
  status: '구직중',
  avatarUrl: 'https://example.com/alice.png',
  introduction: '안녕하세요, 프론트엔드 개발자입니다. React와 TypeScript를 주로 사용합니다.',
  techTags: ['React', 'TypeScript', 'Next.js'],
  socialLinks: {
    github: 'https://github.com/alice',
    blog: 'https://alice.velog.io',
    solvedAc: 'alice',
  },
  portfolioLinks: ['https://alice-portfolio.com'],
  schedule: [new Date('2024-01-15')],
  providers: ['credentials'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/** 빈 프로필 유저 (기본값만 채워진 상태) */
export const mockUserBob = {
  _id: USER_IDS.bob,
  authorEmail: 'bob@test.com',
  nName: '밥',
  uid: 1002,
  memberType: 'user' as const,
  delYn: false,
  position: '',
  career: '',
  status: '구직중',
  avatarUrl: '',
  introduction: '',
  techTags: [],
  socialLinks: {},
  portfolioLinks: [],
  schedule: [],
  providers: ['credentials'],
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
};

/** 소개글이 10자 미만인 부분 완성 유저 */
export const mockUserCarol = {
  _id: USER_IDS.carol,
  authorEmail: 'carol@test.com',
  nName: '캐롤',
  uid: 1003,
  memberType: 'user' as const,
  delYn: false,
  position: '백엔드 개발자',
  career: '2년차',
  status: '재직중',
  avatarUrl: 'https://example.com/carol.png',
  introduction: '짧은소개', // 10자 미만 → 점수 미부여
  techTags: ['Python', 'Django'],
  socialLinks: {
    github: 'https://github.com/carol',
  },
  portfolioLinks: [],
  schedule: [],
  providers: ['credentials'],
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-03'),
};

/** 관리자 계정 */
export const mockUserAdmin = {
  _id: USER_IDS.admin,
  authorEmail: 'admin@test.com',
  nName: '관리자',
  uid: 1000,
  memberType: 'admin' as const,
  delYn: false,
  position: '풀스택 개발자',
  career: '10년차',
  status: '재직중',
  avatarUrl: 'https://example.com/admin.png',
  introduction: '서비스 관리자입니다. 문의사항이 있으시면 연락해 주세요.',
  techTags: ['Docker', 'AWS', 'Kubernetes'],
  socialLinks: {
    github: 'https://github.com/admin',
  },
  portfolioLinks: [],
  schedule: [new Date('2024-01-10'), new Date('2024-01-11')],
  providers: ['credentials'],
  createdAt: new Date('2023-12-01'),
  updatedAt: new Date('2024-01-01'),
};

/** 비활성화된 유저 (delYn: true) */
export const mockUserDeleted = {
  ...mockUserBob,
  _id: '000000000000000000000005',
  authorEmail: 'deleted@test.com',
  uid: 1005,
  delYn: true,
};

// ─── ProfileCompletenessParams 형태 Fixture ────────────────────────────────────
// profileUtils.calculateProfileCompleteness() 테스트에 사용

/** 모든 항목 완성 (100점 기대) */
export const fullProfile: ProfileCompletenessParams = {
  avatarUrl: 'https://example.com/avatar.png',       // +15
  position: '프론트엔드 개발자',                       // +10
  career: '3년차',                                    // +5
  introduction: '안녕하세요, 10자 이상의 소개글입니다.', // +20
  techTags: ['React', 'TypeScript'],                  // +20
  socialLinks: { github: 'https://github.com/user' }, // +15 (소셜 1개 이상)
  schedule: [new Date('2024-01-01')],                 // +15
};

/** 아무것도 없는 빈 프로필 (0점 기대) */
export const emptyProfile: ProfileCompletenessParams = {};

/** 아바타만 있는 프로필 (15점 기대) */
export const avatarOnlyProfile: ProfileCompletenessParams = {
  avatarUrl: 'https://example.com/avatar.png',
};

/** 소개글이 10자 미만 (소개글 점수 미부여) */
export const shortIntroProfile: ProfileCompletenessParams = {
  avatarUrl: 'https://example.com/avatar.png', // +15
  introduction: '짧은소개',                    // 10자 미만 → +0
};
