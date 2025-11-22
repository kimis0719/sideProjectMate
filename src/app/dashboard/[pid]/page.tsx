export default function DashboardPage({ params }: { params: { pid: string } }) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">대쉬보드 개요</h1>
            <p className="text-gray-600 dark:text-gray-400">
                프로젝트 {params.pid}의 진행 상황을 한눈에 볼 수 있는 페이지입니다.
            </p>
            {/* 추후 대쉬보드 위젯 등 추가 */}
        </div>
    );
}
