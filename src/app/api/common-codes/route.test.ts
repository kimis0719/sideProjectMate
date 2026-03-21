import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

import CommonCode from '@/lib/models/CommonCode';
import { GET } from './route';

describe('GET /api/common-codes', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('그룹별 공통 코드를 조회한다', async () => {
    await CommonCode.create([
      { group: 'CATEGORY', groupName: '카테고리', code: '01', label: '웹', order: 1, isActive: true },
      { group: 'CATEGORY', groupName: '카테고리', code: '02', label: '앱', order: 2, isActive: true },
      { group: 'STATUS', groupName: '상태', code: '01', label: '모집중', order: 1, isActive: true },
    ]);

    const req = new Request('http://localhost:3000/api/common-codes?group=CATEGORY');
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    // order 순 정렬 확인
    expect(body.data[0].code).toBe('01');
    expect(body.data[1].code).toBe('02');
  });

  it('group 파라미터가 없으면 400을 반환한다', async () => {
    const req = new Request('http://localhost:3000/api/common-codes');
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Group');
  });

  it('활성 코드만 반환된다', async () => {
    await CommonCode.create([
      { group: 'ROLE', groupName: '역할', code: '01', label: '개발자', order: 1, isActive: true },
      { group: 'ROLE', groupName: '역할', code: '02', label: '디자이너', order: 2, isActive: true },
      { group: 'ROLE', groupName: '역할', code: '03', label: '기획자', order: 3, isActive: false },
    ]);

    const req = new Request('http://localhost:3000/api/common-codes?group=ROLE');
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    // isActive: false인 '기획자'는 제외
    expect(body.data).toHaveLength(2);
    const labels = body.data.map((c: any) => c.label);
    expect(labels).toContain('개발자');
    expect(labels).toContain('디자이너');
    expect(labels).not.toContain('기획자');
  });
});
