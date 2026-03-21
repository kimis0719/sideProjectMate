import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

import TechStack from '@/lib/models/TechStack';
import { GET } from './route';

describe('GET /api/tech-stacks', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('기술 스택 목록을 조회한다', async () => {
    await TechStack.create([
      { name: 'React', category: 'frontend', logoUrl: 'https://example.com/react.png' },
      { name: 'Node.js', category: 'backend', logoUrl: 'https://example.com/node.png' },
      { name: 'MongoDB', category: 'database' },
    ]);

    const req = new Request('http://localhost:3000/api/tech-stacks');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
  });

  it('카테고리별로 정렬되어 반환된다', async () => {
    await TechStack.create([
      { name: 'Express', category: 'backend' },
      { name: 'Vue', category: 'frontend' },
      { name: 'Angular', category: 'frontend' },
      { name: 'PostgreSQL', category: 'database' },
    ]);

    const req = new Request('http://localhost:3000/api/tech-stacks');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(4);

    // category 오름차순, 같은 category 내에서는 name 오름차순
    const categories = body.data.map((t: any) => t.category);
    expect(categories).toEqual(['backend', 'database', 'frontend', 'frontend']);

    // frontend 내에서 name 정렬: Angular < Vue
    const frontendItems = body.data.filter((t: any) => t.category === 'frontend');
    expect(frontendItems[0].name).toBe('Angular');
    expect(frontendItems[1].name).toBe('Vue');
  });

  it('기술 스택이 없으면 빈 배열을 반환한다', async () => {
    const req = new Request('http://localhost:3000/api/tech-stacks');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });
});
