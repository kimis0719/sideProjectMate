import dynamic from 'next/dynamic';

type PageProps = {
  params: { pid: string }; // URL 파라미터는 항상 string입니다.
};

// BoardShell을 클라이언트 사이드에서만 렌더링하도록 dynamic import 합니다.
// SSR(서버 사이드 렌더링)을 비활성화하여 window, document 등 브라우저 API를 사용하는 컴포넌트 오류를 방지합니다.
const BoardShell = dynamic(() => import('@/components/board/BoardShell'), {
  ssr: false,
});

/**
 * 칸반 보드 페이지
 * URL의 [pid] 파라미터를 파싱하여 BoardShell 컴포넌트에 전달합니다.
 * @param params.pid - 프로젝트 ID. URL을 통해 문자열로 전달됩니다.
 */
export default function KanbanBoardPage({ params }: PageProps) {
  // URL 파라미터로 받은 pid 문자열을 정수형으로 변환합니다.
  // 만약 변환에 실패하거나(예: pid가 숫자가 아닌 경우) 결과가 0 이하라면,
  // 유효하지 않은 pid로 간주하고 undefined를 전달합니다.
  const projectId = parseInt(params.pid, 10);
  const validPid = !isNaN(projectId) && projectId > 0 ? projectId : undefined;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background">
      {/* 
        BoardShell 컴포넌트에 유효한 프로젝트 ID(pid)를 전달합니다.
        - validPid가 유효한 숫자일 경우: 해당 프로젝트의 보드를 불러옵니다.
        - validPid가 undefined일 경우: BoardShell 내부 로직에 따라 공용 임시 보드를 불러옵니다.
      */}
      <BoardShell pid={validPid} />
    </div>
  );
}
