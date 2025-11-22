'use client';

import dynamic from 'next/dynamic';

const BoardShell = dynamic(() => import('@/components/board/BoardShell'), {
    ssr: false,
});

export default function KanbanPage({ params }: { params: { pid: string } }) {
    const pid = parseInt(params.pid, 10);

    return (
        <div className="w-full h-full">
            <BoardShell pid={pid} />
        </div>
    );
}
