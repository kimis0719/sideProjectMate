import dynamic from 'next/dynamic';

const BoardShell = dynamic(() => import('@/components/board/BoardShell'), {
  ssr: false,
});

export default function KanbanHomePage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-white dark:bg-gray-900">
      <BoardShell />
    </div>
  );
}