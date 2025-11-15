import dynamic from 'next/dynamic';

type PageProps = {
  params: { pid: string };
};

const BoardShell = dynamic(() => import('@/components/board/BoardShell'), {
  ssr: false,
});

export default function KanbanBoardPage({ params }: PageProps) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-white dark:bg-gray-900">
      <BoardShell boardId={params.pid} />
    </div>
  );
}