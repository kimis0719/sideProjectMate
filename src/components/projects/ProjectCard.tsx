import Link from 'next/link';
import {
  STAGE_LABELS,
  STYLE_LABELS,
  STATUS_LABELS,
  ProjectStage,
  ExecutionStyle,
  ProjectStatus,
} from '@/constants/project';
import ProjectThumbnail from './ProjectThumbnail';

interface ProjectCardProject {
  pid: number;
  title: string;
  problemStatement?: string;
  currentStage?: string;
  executionStyle?: string;
  weeklyHours?: number;
  status: string;
  members: { status: string }[];
  maxMembers?: number;
  images: string[];
  lookingFor?: string[];
  createdAt: Date;
}

interface ProjectCardProps {
  project: ProjectCardProject;
  applicationStatus?: string;
  isOwner?: boolean;
}

export default function ProjectCard({ project, applicationStatus, isOwner }: ProjectCardProps) {
  const membersArray = Array.isArray(project.members) ? project.members : [];
  const activeMembers = membersArray.filter((m) => m.status === 'active').length;
  const maxMembers = project.maxMembers ?? 4;
  const remaining = maxMembers - activeMembers;

  const stageLabel = project.currentStage
    ? STAGE_LABELS[project.currentStage as ProjectStage] || project.currentStage
    : null;
  const styleLabel = project.executionStyle
    ? STYLE_LABELS[project.executionStyle as ExecutionStyle] || project.executionStyle
    : null;
  const statusLabel = STATUS_LABELS[project.status as ProjectStatus] || project.status;

  const hasImage = project.images && project.images.length > 0 && project.images[0] !== '🚀';

  return (
    <Link
      href={`/projects/${project.pid}`}
      className="bg-surface-container-lowest rounded-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col hover:shadow-[0_20px_40px_rgba(26,28,28,0.04)] hover:-translate-y-1"
    >
      {/* 썸네일 — 이미지 유무 관계없이 항상 표시 */}
      <div className="relative aspect-video bg-surface-container-high flex items-center justify-center overflow-hidden">
        <ProjectThumbnail
          src={hasImage ? project.images[0] : null}
          alt={project.title}
          fallbackText={project.title.charAt(0)}
        />
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* 배지 + 등록일 */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {stageLabel && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wide bg-primary-container/15 text-primary-container">
              {stageLabel}
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wide ${
              project.status === 'recruiting'
                ? 'bg-emerald-500/10 text-emerald-700'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {statusLabel}
          </span>
          <span className="text-xs text-on-surface-variant ml-auto">
            {new Date(project.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary-container transition-colors">
          {project.title}
        </h3>

        {/* problemStatement — 3줄 클램프 */}
        {project.problemStatement && (
          <p className="text-sm text-on-surface-variant mb-3 line-clamp-3">
            {project.problemStatement}
          </p>
        )}

        {/* lookingFor 태그 */}
        {project.lookingFor && project.lookingFor.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.lookingFor.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-primary-container/10 text-primary-container text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {project.lookingFor.length > 3 && (
              <span className="text-xs text-on-surface-variant">
                +{project.lookingFor.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 하단 정보 */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-3 mt-auto">
          <div className="flex items-center gap-3">
            {styleLabel && <span>{styleLabel}</span>}
            {project.weeklyHours && <span>{project.weeklyHours}h/주</span>}
          </div>
          {applicationStatus === 'pending' ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-amber-500/10 text-amber-700">
              지원 완료
            </span>
          ) : applicationStatus === 'accepted' ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-700">
              팀원
            </span>
          ) : applicationStatus === 'rejected' ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-surface-container-high text-on-surface-variant">
              지원 마감
            </span>
          ) : isOwner ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-primary-container/15 text-primary-container">
              내 프로젝트
            </span>
          ) : (
            <span className="text-primary-container font-semibold">{maxMembers}명 원함</span>
          )}
        </div>
      </div>
    </Link>
  );
}
