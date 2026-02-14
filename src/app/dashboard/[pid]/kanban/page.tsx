'use client';

import dynamic from 'next/dynamic';

const BoardShell = dynamic(() => import('@/components/board/BoardShell'), {
    ssr: false,
});

export default function KanbanPage({ params }: { params: { pid: string } }) {
    const pid = parseInt(params.pid, 10);

    return (
        /* 
            칸반보드 페이지 독립적 스타일
            - h-[calc(100vh-64px)]: 헤더 제외 전체 높이 고정
            - overflow-hidden: 브라우저 스크롤 방지 및 내부 보드 스크롤 활성화
        */
        <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
            <BoardShell pid={pid} />
        </div>
    );
}
