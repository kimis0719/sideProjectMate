/**
 * 채팅 시스템에서 사용되는 카테고리 타입 정의입니다.
 * 💡 왜 타입을 먼저 선언할까?
 * TypeScript에서는 우리가 어떤 category 값을 받을지 명확히 해두어야 자동완성(IntelliSense)도 잘 되고 오타로 인한 버그를 미리 막을 수 있어!
 */
export type ChatCategory = 'INQUIRY' | 'RECRUIT' | 'TEAM' | 'DM' | 'SYSTEM';

/**
 * 프로젝트에서 정의된 채팅 카테고리별 테마 색상(Hex) 객체입니다.
 * 색상 변경이 필요할 때 여기만 수정하면 전체 채팅 UI에 한 번에 적용돼! 유지보수를 위한 아주 중요한 패턴이야.
 */
export const CHAT_CATEGORY_COLORS: Record<ChatCategory, string> = {
    INQUIRY: '#FFD93D', // 노랑 - 프로젝트 단순 문의
    RECRUIT: '#6BCB77', // 초록 - 지원 및 인터뷰
    TEAM: '#4D96FF',    // 파랑 - 팀 협업 (매칭 완료)
    DM: '#FF6B6B',      // 빨강 - 개인 소셜 메시지
    SYSTEM: '#95A5A6',  // 회색 - 시스템 공지/가이드
};

/**
 * 카테고리(category) 문자열을 입력받아서 해당하는 색상(Hex)을 반환하는 유틸리티 함수야.
 * 만약 정의되지 않은 카테고리가 들어오면 안전하게 기본 색상(회색)을 반환해줘!
 * 
 * @param category 채팅방의 카테고리 분류 (예: 'TEAM', 'DM' 등)
 * @returns {string} 매핑된 색상의 Hex 코드
 */
export const getCategoryColor = (category: ChatCategory | string): string => {
    // 1️⃣ 입력된 카테고리가 무조건 ChatCategory 키값 안에 있는지 판별해.
    // 2️⃣ 일치하는 키값이 있다면 해당하는 색상 코드를 반환하고, 아니면 SYSTEM의 기본 회색 코드를 반환하도록 방어 로직을 작성했지!
    if (category in CHAT_CATEGORY_COLORS) {
        return CHAT_CATEGORY_COLORS[category as ChatCategory];
    }
    // 예외 처리: 예상치 못한 값이 들어왔을 때는 기본값을 반환해서 UI가 깨지지 않는 게 중요해.
    return CHAT_CATEGORY_COLORS.SYSTEM;
};
