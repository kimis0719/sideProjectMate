import { describe, it, expect } from 'vitest';
import { getCategoryColor, CHAT_CATEGORY_COLORS } from './chat';

describe('getCategoryColor', () => {
    // ─── 정상 케이스 ────────────────────────────────────────────────────────────

    it('INQUIRY 카테고리는 노란색 Hex 코드를 반환한다', () => {
        expect(getCategoryColor('INQUIRY')).toBe(CHAT_CATEGORY_COLORS.INQUIRY);
    });

    it('RECRUIT 카테고리는 초록색 Hex 코드를 반환한다', () => {
        expect(getCategoryColor('RECRUIT')).toBe(CHAT_CATEGORY_COLORS.RECRUIT);
    });

    it('TEAM 카테고리는 파란색 Hex 코드를 반환한다', () => {
        expect(getCategoryColor('TEAM')).toBe(CHAT_CATEGORY_COLORS.TEAM);
    });

    it('DM 카테고리는 빨간색 Hex 코드를 반환한다', () => {
        expect(getCategoryColor('DM')).toBe(CHAT_CATEGORY_COLORS.DM);
    });

    it('SYSTEM 카테고리는 회색 Hex 코드를 반환한다', () => {
        expect(getCategoryColor('SYSTEM')).toBe(CHAT_CATEGORY_COLORS.SYSTEM);
    });

    it('반환값은 # 으로 시작하는 유효한 Hex 문자열이다', () => {
        const hexPattern = /^#[0-9A-Fa-f]{6}$/;
        Object.keys(CHAT_CATEGORY_COLORS).forEach(category => {
            expect(getCategoryColor(category)).toMatch(hexPattern);
        });
    });

    // ─── 엣지 케이스 ────────────────────────────────────────────────────────────

    it('정의되지 않은 카테고리 문자열은 SYSTEM 기본 색상을 반환한다', () => {
        expect(getCategoryColor('UNKNOWN')).toBe(CHAT_CATEGORY_COLORS.SYSTEM);
    });

    it('빈 문자열은 SYSTEM 기본 색상을 반환한다', () => {
        expect(getCategoryColor('')).toBe(CHAT_CATEGORY_COLORS.SYSTEM);
    });

    // ─── 실패/방어 케이스 ────────────────────────────────────────────────────────

    it('소문자 카테고리는 SYSTEM 기본 색상을 반환한다 (대소문자 구분)', () => {
        expect(getCategoryColor('dm')).toBe(CHAT_CATEGORY_COLORS.SYSTEM);
        expect(getCategoryColor('team')).toBe(CHAT_CATEGORY_COLORS.SYSTEM);
    });
});
