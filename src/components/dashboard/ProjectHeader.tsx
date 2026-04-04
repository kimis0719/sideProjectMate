import { IProject } from '@/lib/models/Project';

interface ProjectHeaderProps {
  project: IProject;
  categoryLabel?: string;
  isAuthor: boolean;
  onStatusChange: (newStatus: string) => Promise<void>;
}

export default function ProjectHeader({
  project,
  categoryLabel,
  isAuthor,
  onStatusChange,
}: ProjectHeaderProps) {
  // 상태 코드에 따른 라벨 및 스타일 매핑
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'recruiting':
        return { label: '모집중', color: 'bg-emerald-100 text-emerald-800' };
      case 'in_progress':
        return { label: '진행중', color: 'bg-primary-container/15 text-primary-container' };
      case 'completed':
        return { label: '완료', color: 'bg-surface-container-high text-on-surface-variant' };
      case 'paused':
        return { label: '일시정지', color: 'bg-surface-container-high text-on-surface-variant' };
      default:
        return { label: '미정', color: 'bg-surface-container-high text-on-surface-variant' };
    }
  };

  const statusInfo = getStatusInfo(project.status);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
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
                className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container/20 ${statusInfo.color}`}
              >
                <option value="recruiting">모집중</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="paused">일시정지</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </div>
            </div>
          ) : (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          )}

          {categoryLabel && (
            <span className="text-sm text-on-surface-variant">{categoryLabel}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold font-headline tracking-tight text-on-surface">
          {project.title}
        </h1>
      </div>

      {/* 6단계에서 상태 변경 드롭다운 등 추가 예정 */}
      <div className="flex items-center gap-2">{/* Placeholder for future action buttons */}</div>
    </div>
  );
}
