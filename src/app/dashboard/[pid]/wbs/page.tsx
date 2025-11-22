export default function WBSPage({ params }: { params: { pid: string } }) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">WBS (Work Breakdown Structure)</h1>
            <p className="text-gray-600 dark:text-gray-400">
                프로젝트 {params.pid}의 일정 관리 페이지입니다. (준비 중)
            </p>
        </div>
    );
}
