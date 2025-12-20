import dynamic from 'next/dynamic';

const BoardShell = dynamic(() => import('@/components/board/BoardShell'), {
  ssr: false,
});

export default function KanbanHomePage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-background">
      <BoardShell pid={999999999} />
    </div>
  );
}