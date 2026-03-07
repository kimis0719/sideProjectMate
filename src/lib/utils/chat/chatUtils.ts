import type { IChatRoomClient } from '@/types/chat';

/**
 * 채팅방 표시명 결정 유틸 함수
 * - TEAM/INQUIRY : 프로젝트명 (API에서 채워진 projectName) 또는 metadata.name
 * - DM/RECRUIT   : 상대방 닉네임 (participants 중 현재 유저가 아닌 쪽)
 * - SYSTEM       : 고정 문자열 '시스템 알림'
 * - 알 수 없는 카테고리: category 문자열 그대로 반환
 */
export function getRoomDisplayName(room: IChatRoomClient, currentUserId: string): string {
    switch (room.category) {
        case 'TEAM':
        case 'INQUIRY':
            return room.projectName || room.metadata?.name || room.category;
        case 'DM':
        case 'RECRUIT': {
            const other = room.participants.find(p => p._id !== currentUserId);
            return other?.nName || room.projectName || room.category;
        }
        case 'SYSTEM':
            return '시스템 알림';
        default:
            return room.category;
    }
}
