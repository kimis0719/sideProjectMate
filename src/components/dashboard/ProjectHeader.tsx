import { IProject } from '@/lib/models/Project';

interface ProjectHeaderProps {
    project: IProject;
    categoryLabel?: string;
    isAuthor: boolean;
    onStatusChange: (newStatus: '01' | '02' | '03') => Promise<void>;
}

export default function ProjectHeader({ project, categoryLabel, isAuthor, onStatusChange }: ProjectHeaderProps) {
    // 상태 코드에 따른 라벨 및 스타일 매핑
    const getStatusInfo = (status: string) => {
        switch (status) {
            case '01':
                return { label: '모집중', color: 'bg-green-100 text-green-700 border-green-200' };
            case '02':
                return { label: '진행중', color: 'bg-blue-100 text-blue-700 border-blue-200' };
            case '03':
                return { label: '완료', color: 'bg-gray-100 text-gray-700 border-gray-200' };
            default:
                return { label: '미정', color: 'bg-gray-100 text-gray-700 border-gray-200' };
        }
    };

    const statusInfo = getStatusInfo(project.status);

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as '01' | '02' | '03';
        if (confirm(`프로젝트 상태를 '${getStatusInfo(newStatus).label}'(으)로 변경하시겠습니까?`)) {
            await onStatusChange(newStatus);
        } else {
            // 취소 시 UI 원복을 위해 필요하다면 별도 state 관리 필요하지만, 
            // 여기선 리렌더링으로 처리되므로 간단히 넘어감.
            e.target.value = project.status;
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    {isAuthor ? (
                        <div className="relative">
                            <select
                                value={project.status}
                                onChange={handleStatusChange}
                                className={`appearance-none pl-3 pr-8 py-0.5 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${statusInfo.color}`}
                            >
                                <option value="01">모집중</option>
                                <option value="02">진행중</option>
                                <option value="03">완료</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                    )}

                    <span className="text-sm text-muted-foreground">
                        {categoryLabel || project.category}
                    </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{project.title}</h1>
            </div>

            {/* 6단계에서 상태 변경 드롭다운 등 추가 예정 */}
            <div className="flex items-center gap-2">
                {/* Placeholder for future action buttons */}
            </div>
        </div>
    );
}
