import { describe, it, expect } from 'vitest';
import { getRoomDisplayName } from './chatUtils';
import {
    mockDmRoom,
    mockRecruitRoom,
    mockTeamRoom,
    mockInquiryRoomWithMeta,
    mockSystemRoom,
    mockDmRoomUnknownOther,
    participantAlice,
    participantBob,
} from '@/__tests__/fixtures/chat';
import { USER_IDS } from '@/__tests__/fixtures/users';

describe('getRoomDisplayName', () => {
    // ─── DM 카테고리 ─────────────────────────────────────────────────────────────

    it('DM 방은 상대방의 nName을 반환한다', () => {
        // alice 시점 → 상대방은 bob
        const result = getRoomDisplayName(mockDmRoom, USER_IDS.alice);
        expect(result).toBe('밥');
    });

    it('DM 방에서 bob 시점이면 상대방(alice)의 nName을 반환한다', () => {
        const result = getRoomDisplayName(mockDmRoom, USER_IDS.bob);
        expect(result).toBe('앨리스');
    });

    it('DM 방에서 상대방 nName이 없으면 category 문자열을 반환한다', () => {
        // participantUnknown에는 nName이 없음
        const result = getRoomDisplayName(mockDmRoomUnknownOther, USER_IDS.alice);
        expect(result).toBe('DM');
    });

    // ─── RECRUIT 카테고리 ─────────────────────────────────────────────────────────

    it('RECRUIT 방은 상대방의 nName을 반환한다', () => {
        const result = getRoomDisplayName(mockRecruitRoom, USER_IDS.alice);
        expect(result).toBe('밥');
    });

    it('RECRUIT 방에서 nName이 없으면 projectName을 폴백으로 반환한다', () => {
        const room = {
            ...mockRecruitRoom,
            participants: [participantAlice, { _id: USER_IDS.bob }], // nName 없는 참여자
        };
        const result = getRoomDisplayName(room, USER_IDS.alice);
        expect(result).toBe('알파 프로젝트');
    });

    // ─── TEAM 카테고리 ───────────────────────────────────────────────────────────

    it('TEAM 방은 projectName을 반환한다', () => {
        const result = getRoomDisplayName(mockTeamRoom, USER_IDS.alice);
        expect(result).toBe('알파 프로젝트');
    });

    it('TEAM 방에 projectName이 없으면 metadata.name을 반환한다', () => {
        const room = { ...mockTeamRoom, projectName: undefined, metadata: { name: '메타명' } };
        const result = getRoomDisplayName(room, USER_IDS.alice);
        expect(result).toBe('메타명');
    });

    it('TEAM 방에 projectName과 metadata.name 모두 없으면 category 문자열을 반환한다', () => {
        const room = { ...mockTeamRoom, projectName: undefined, metadata: undefined };
        const result = getRoomDisplayName(room, USER_IDS.alice);
        expect(result).toBe('TEAM');
    });

    // ─── INQUIRY 카테고리 ────────────────────────────────────────────────────────

    it('INQUIRY 방은 projectName이 없을 때 metadata.name을 반환한다', () => {
        const result = getRoomDisplayName(mockInquiryRoomWithMeta, USER_IDS.alice);
        expect(result).toBe('메타데이터 프로젝트명');
    });

    // ─── SYSTEM 카테고리 ─────────────────────────────────────────────────────────

    it('SYSTEM 방은 항상 "시스템 알림"을 반환한다', () => {
        const result = getRoomDisplayName(mockSystemRoom, USER_IDS.alice);
        expect(result).toBe('시스템 알림');
    });

    // ─── 엣지 케이스 ─────────────────────────────────────────────────────────────

    it('participants가 빈 배열이면 category 문자열을 반환한다 (DM)', () => {
        const room = { ...mockDmRoom, participants: [] };
        const result = getRoomDisplayName(room, USER_IDS.alice);
        expect(result).toBe('DM');
    });

    it('participants에 본인만 있으면 상대방을 찾지 못해 category를 반환한다', () => {
        const room = { ...mockDmRoom, participants: [participantAlice] };
        const result = getRoomDisplayName(room, USER_IDS.alice);
        expect(result).toBe('DM');
    });

    // ─── 실패/방어 케이스 ────────────────────────────────────────────────────────

    it('알 수 없는 카테고리는 category 문자열 그대로 반환한다', () => {
        const room = { ...mockDmRoom, category: 'CUSTOM' as any };
        const result = getRoomDisplayName(room, USER_IDS.alice);
        expect(result).toBe('CUSTOM');
    });
});
