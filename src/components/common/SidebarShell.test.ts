import { describe, it, expect } from 'vitest';
import type { SidebarMenuItem } from './SidebarShell';

/**
 * SidebarShell 단위 테스트
 *
 * React 렌더링 없이 사이드바 메뉴 config의 구조와 로직을 검증합니다.
 */

// 프로젝트 사이드바 메뉴 (projects/layout.tsx와 동일)
const PROJECTS_MENU: SidebarMenuItem[] = [
  { href: '/projects', icon: 'grid_view', label: '모든 프로젝트' },
  { href: '/dashboard', icon: 'workspaces', label: '내 워크스페이스' },
];

// 대시보드 사이드바 메뉴 (dashboard/[pid]/layout.tsx와 동일 패턴)
const createDashboardMenu = (pid: string, isOwner = false): SidebarMenuItem[] => [
  { href: `/dashboard/${pid}`, icon: 'dashboard', label: '대시보드 홈' },
  { href: `/dashboard/${pid}/kanban`, icon: 'view_kanban', label: '칸반보드' },
  ...(isOwner
    ? [
        { href: `/projects/${pid}/manage`, icon: 'group', label: '멤버관리' },
        { href: `/projects/${pid}/edit`, icon: 'settings', label: '프로젝트 설정' },
      ]
    : []),
];

/** isActive 판별 순수 함수 (SidebarShell 내부 로직과 동일) */
const isActive = (pathname: string, itemHref: string): boolean => pathname === itemHref;

/** hideTrigger 판별 순수 함수 */
const shouldHideTrigger = (pathname: string, hidePaths: string[]): boolean =>
  hidePaths.some((p) => pathname.includes(p));

describe('SidebarShell — 메뉴 config 구조', () => {
  it('프로젝트 메뉴는 2개 항목을 가진다', () => {
    expect(PROJECTS_MENU).toHaveLength(2);
  });

  it('대시보드 메뉴는 일반 멤버 기준 2개 항목을 가진다', () => {
    const menu = createDashboardMenu('42');
    expect(menu).toHaveLength(2);
  });

  it('대시보드 메뉴는 소유자 기준 4개 항목을 가진다', () => {
    const menu = createDashboardMenu('42', true);
    expect(menu).toHaveLength(4);
  });

  it('모든 메뉴 항목은 href, icon, label을 가진다', () => {
    const allMenus = [...PROJECTS_MENU, ...createDashboardMenu('1')];
    for (const item of allMenus) {
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('label');
      expect(item.href).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.label).toBeTruthy();
    }
  });

  it('대시보드 메뉴 href에 pid가 올바르게 포함된다', () => {
    const menu = createDashboardMenu('99', true);
    expect(menu[0].href).toBe('/dashboard/99');
    expect(menu[1].href).toBe('/dashboard/99/kanban');
    expect(menu[2].href).toBe('/projects/99/manage');
    expect(menu[3].href).toBe('/projects/99/edit');
  });
});

describe('SidebarShell — isActive 로직', () => {
  it('pathname과 href가 일치하면 true', () => {
    expect(isActive('/projects', '/projects')).toBe(true);
  });

  it('pathname과 href가 다르면 false', () => {
    expect(isActive('/projects/new', '/projects')).toBe(false);
  });

  it('하위 경로는 활성 상태가 아니다', () => {
    expect(isActive('/dashboard/42/kanban', '/dashboard/42')).toBe(false);
  });
});

describe('SidebarShell — hideTrigger 로직', () => {
  it('칸반 경로에서는 트리거를 숨긴다', () => {
    expect(shouldHideTrigger('/dashboard/42/kanban', ['/kanban'])).toBe(true);
  });

  it('대시보드 홈에서는 트리거를 보여준다', () => {
    expect(shouldHideTrigger('/dashboard/42', ['/kanban'])).toBe(false);
  });

  it('hidePaths가 비어있으면 항상 false', () => {
    expect(shouldHideTrigger('/dashboard/42/kanban', [])).toBe(false);
  });
});
