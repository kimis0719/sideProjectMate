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
}

export default function ProjectCard({ project }: ProjectCardProps) {
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
      className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer border border-border flex flex-col"
    >
      {/* 썸네일 — 이미지 유무 관계없이 항상 표시 */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
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
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
              {stageLabel}
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded ${
              project.status === 'recruiting'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {statusLabel}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(project.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {project.title}
        </h3>

        {/* problemStatement — 3줄 클램프 */}
        {project.problemStatement && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {project.problemStatement}
          </p>
        )}

        {/* lookingFor 태그 */}
        {project.lookingFor && project.lookingFor.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.lookingFor.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {project.lookingFor.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{project.lookingFor.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 하단 정보 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border mt-auto">
          <div className="flex items-center gap-3">
            {styleLabel && <span>{styleLabel}</span>}
            {project.weeklyHours && <span>{project.weeklyHours}h/주</span>}
          </div>
          <span className={remaining > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
            {remaining > 0 ? `${remaining}자리 남음` : '마감'}
          </span>
        </div>
      </div>
    </Link>
  );
}
