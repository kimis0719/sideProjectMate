'use client';

import { getCategoryColor } from '@/constants/chat';
import { MockChatRoom } from './ChatRoomList';

interface ChatWindowProps {
    room: MockChatRoom;
}

/**
 * 💬 채팅 대화창 컴포넌트야.
 * Step 3.3 요구사항에 맞춰서 활성화된 채팅방 카테고리에 따라 상단(Header)의 테마를 변경하고 있어!
 */
export default function ChatWindow({ room }: ChatWindowProps) {
    const categoryColor = getCategoryColor(room.category);

    return (
        <div className="flex-1 flex flex-col bg-slate-50/50 relative">
            {/* 
              🌟 상단 헤더 영역 (Step 3.3 핵심 구현 부분)
              - top border 박스로 컬러 라인을 명확하게 줬어!
              - 배경색에도 살짝 투명도를 넣어서 대화방 성격을 은은하게 인지하도록 만들었지.
            */}
            <div
                className="flex items-center justify-between p-4 bg-white shadow-sm z-10 border-t-4"
                style={{
                    borderTopColor: categoryColor,
                    // 배경에 아주 연하게(약 3% 불투명도) 카테고리 색상을 깔아서 분위기를 맞춤
                    backgroundColor: `color-mix(in srgb, ${categoryColor} 3%, white)`
                }}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {/* 📛 헤더에도 배지를 배치해서 현재 어떤 성격의 대화인지 확실히 각인! */}
                        <span
                            className="text-xs font-bold px-2 py-0.5 rounded-md"
                            style={{
                                backgroundColor: categoryColor,
                                color: 'white' // 여긴 눈에 띄게 흰 글씨로!
                            }}
                        >
                            {room.category}
                        </span>
                        <h2 className="text-lg font-bold text-slate-800">{room.title}</h2>
                    </div>
                </div>

                {/* 우측 도구 모음 (추후 구현 예정) */}
                <div className="flex items-center gap-3 text-slate-400">
                    <button className="hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                    <button className="hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                </div>
            </div>

            {/* 메인 채팅 내역 영역 (추후 무한 스크롤 및 메시지 버블 구현 예정) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 봇 안내 메시지 예시 (시스템 카테고리인 경우 보여주기 좋음) */}
                <div className="flex justify-center my-4">
                    <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        대화가 시작되었습니다.
                    </span>
                </div>

                {/* 임시 메시지 버블 */}
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs text-slate-500 ml-1">상대방</span>
                        <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 max-w-md">
                            <p className="text-slate-700 text-sm leading-relaxed">{room.lastMessage || '안녕하세요!'}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 ml-1">오후 2:30</span>
                    </div>
                </div>
            </div>

            {/* 채팅 입력창 영역 */}
            <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-slate-300 transition-shadow">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <input
                        type="text"
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-700 px-2"
                    />
                    <button
                        className="bg-slate-800 text-white p-1.5 rounded-full hover:bg-slate-700 transition-colors flex shrink-0 items-center justify-center h-8 w-8"
                    >
                        <svg className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
