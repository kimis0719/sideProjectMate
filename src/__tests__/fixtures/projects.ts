/**
 * 테스트용 Mock 프로젝트 데이터
 * IProject 인터페이스(src/lib/models/Project.ts) 기반
 */
import { USER_IDS } from './users';

// ─── 공통 ID 상수 ──────────────────────────────────────────────────────────────
export const PROJECT_IDS = {
  recruiting: '100000000000000000000001',
  inProgress: '100000000000000000000002',
  completed: '100000000000000000000003',
  deleted: '100000000000000000000004',
} as const;

// ─── Mock 프로젝트 객체 ─────────────────────────────────────────────────────────

/** 모집중 프로젝트 (status: '01') */
export const mockProjectRecruiting = {
  _id: PROJECT_IDS.recruiting,
  pid: 1001,
  title: '사이드 프로젝트 팀원 모집',
  ownerId: USER_IDS.alice,
  members: [],
  techStacks: [],
  images: ['🚀'],
  description: '같이 사이드 프로젝트 하실 분 구합니다! React + Node.js 기반 웹 서비스입니다.',
  status: '01',
  delYn: false,
  overview: '',
  resources: [],
  views: 42,
  likeCount: 0,
  deadline: new Date('2024-03-31'),
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
};

/** 진행중 프로젝트 (status: '02') */
export const mockProjectInProgress = {
  _id: PROJECT_IDS.inProgress,
  pid: 1002,
  title: '개발 진행 중인 프로젝트',
  ownerId: USER_IDS.bob,
  members: [
    {
      userId: USER_IDS.alice,
      role: 'member',
      status: 'active',
      joinedAt: new Date('2024-01-15'),
    },
  ],
  techStacks: [],
  images: ['💻'],
  description: '현재 개발이 진행 중인 팀 프로젝트입니다.',
  status: '02',
  delYn: false,
  overview: '목표: 2024년 6월까지 MVP 출시',
  resources: [
    {
      type: 'LINK' as const,
      category: 'DOCS' as const,
      content: 'https://docs.example.com',
      metadata: { title: '기획서' },
      userId: USER_IDS.bob,
    },
  ],
  views: 128,
  likeCount: 1,
  deadline: new Date('2024-06-30'),
  createdAt: new Date('2023-12-01'),
  updatedAt: new Date('2024-01-15'),
};

/** 완료된 프로젝트 (status: '03') */
export const mockProjectCompleted = {
  _id: PROJECT_IDS.completed,
  pid: 1003,
  title: '완료된 프로젝트',
  ownerId: USER_IDS.alice,
  members: [
    {
      userId: USER_IDS.bob,
      role: 'member',
      status: 'active',
      joinedAt: new Date('2023-06-01'),
    },
  ],
  techStacks: [],
  images: ['✅'],
  description: '성공적으로 완료된 프로젝트입니다.',
  status: '03',
  delYn: false,
  overview: '',
  resources: [],
  views: 256,
  likeCount: 2,
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date('2023-12-31'),
};

/** 어드민에 의해 삭제(비활성화)된 프로젝트 (delYn: true) */
export const mockProjectDeleted = {
  ...mockProjectRecruiting,
  _id: PROJECT_IDS.deleted,
  pid: 1004,
  title: '삭제된 프로젝트',
  delYn: true,
};

/** 여러 프로젝트 배열 (목록 조회 테스트용) */
export const mockProjectList = [mockProjectRecruiting, mockProjectInProgress, mockProjectCompleted];
