'use client';

import { getCategoryColor, ChatCategory } from '@/constants/chat';

// 💡 임시 인터페이스: 백엔드 API 연동 전에 UI를 작성하기 위한 Mock 데이터 타입이야.
export interface MockChatRoom {
    _id: string;
    category: ChatCategory;
    title: string;
    lastMessage?: string;
    updatedAt: string;
}

interface ChatRoomListProps {
    rooms: MockChatRoom[];
    activeRoomId?: string;
    onRoomClick: (roomId: string) => void;
}

/**
 * 🎨 채팅방 리스트를 보여주는 컴포넌트야.
 * Step 3.2 요구사항에 맞춰서 각 아이템 왼쪽에 카테고리별 색상 인디케이터(세로 바)를 추가했어!
 */
export default function ChatRoomList({ rooms, activeRoomId, onRoomClick }: ChatRoomListProps) {
    if (rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
                <p>아직 참여 중인 대화가 없습니다.</p>
                <p className="text-sm mt-1">프로젝트에 지원하거나 팀원들에게 메시지를 보내보세요!</p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {rooms.map((room) => {
                const categoryColor = getCategoryColor(room.category);
                const isActive = room._id === activeRoomId;

                return (
                    <li
                        key={room._id}
                        onClick={() => onRoomClick(room._id)}
                        // 🖱️ 호버 효과와 현재 활성화된 방 스타일을 다르게 줘서 UX를 높였어.
                        className={`
                            relative cursor-pointer transition-colors p-4
                            hover:bg-slate-50
                            ${isActive ? 'bg-slate-50' : 'bg-white'}
                        `}
                    >
                        {/* 🌈 카테고리 컬러 인디케이터 (왼쪽 세로 바) */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1.5"
                            style={{ backgroundColor: categoryColor }}
                        />

                        <div className="pl-2">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-slate-800 text-sm truncate pr-2">
                                    {room.title}
                                </h3>
                                {/* 🏷️ 카테고리 배지 (우측 상단) */}
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                    style={{
                                        // 배경은 연하게, 글씨는 진하게 처리해서 가독성을 높여주는 센스!
                                        backgroundColor: `${categoryColor}20`, // Hex 테일윈드에서 20(Hex opacity)을 추가해서 투명도 12% 정도 적용
                                        color: categoryColor,
                                    }}
                                >
                                    {room.category}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                                <p className="truncate pr-4 flex-1">
                                    {room.lastMessage || '새로운 채팅방이 생성되었습니다.'}
                                </p>
                                <span className="whitespace-nowrap shrink-0">
                                    {new Date(room.updatedAt).toLocaleTimeString('ko-KR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
