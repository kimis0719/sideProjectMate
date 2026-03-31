'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TagInput from '@/components/common/TagInput';
import {
  PROJECT_STAGES,
  EXECUTION_STYLES,
  ProjectStage,
  ExecutionStyle,
  STAGE_LABELS,
  STYLE_LABELS,
} from '@/constants/project';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CommonCodeItem {
  code: string;
  label: string;
}

// --- 이미지 드래그 관련 내부 컴포넌트 ---
function SortableImage({
  id,
  url,
  onRemove,
}: {
  id: string;
  url: string;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-32 h-32 touch-none select-none"
    >
      <Image
        src={url}
        alt="업로드 이미지"
        fill
        className="rounded-lg object-cover"
        draggable={false}
      />
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none z-10 cursor-pointer"
      >
        X
      </button>
    </div>
  );
}

function DragOverlayItem({ url }: { url: string }) {
  return (
    <div className="relative w-32 h-32 shadow-2xl rounded-lg">
      <Image
        src={url}
        alt="드래그 중인 이미지"
        fill
        className="rounded-lg object-cover"
        draggable={false}
      />
    </div>
  );
}

// --- 상수 ---
const WEEKLY_HOURS_OPTIONS = [5, 10, 15, 20, 30] as const;
const MAX_MEMBERS_OPTIONS = [2, 3, 4, 5, 6] as const;
const DURATION_OPTIONS = [
  { value: 1, label: '1개월' },
  { value: 2, label: '2개월' },
  { value: 3, label: '3개월' },
  { value: 6, label: '6개월' },
  { value: 0, label: '미정' },
] as const;

const STAGE_DESCRIPTIONS: Record<ProjectStage, string> = {
  idea: '아직 구상 단계에요',
  prototype: '초안/와이어프레임이 있어요',
  mvp: '핵심 기능은 동작해요',
  beta: '사용자 테스트 중이에요',
  launched: '이미 배포했어요',
};

const STYLE_DESCRIPTIONS: Record<ExecutionStyle, string> = {
  ai_heavy: 'AI 도구를 적극 활용해요',
  balanced: 'AI와 직접 코딩 반반',
  traditional: '직접 개발 위주에요',
};

// --- 메인 컴포넌트 ---
export default function NewProjectPage() {
  const router = useRouter();

  // 폼 상태
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [currentStage, setCurrentStage] = useState<ProjectStage | ''>('');
  const [executionStyle, setExecutionStyle] = useState<ExecutionStyle | ''>('');
  const [weeklyHours, setWeeklyHours] = useState<number>(0);
  const [domains, setDomains] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [maxMembers, setMaxMembers] = useState<number>(4);
  const [description, setDescription] = useState('');
  const [overview, setOverview] = useState('');
  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [durationMonths, setDurationMonths] = useState<number | undefined>(undefined);
  const [linksGithub, setLinksGithub] = useState('');
  const [linksDeploy, setLinksDeploy] = useState('');
  const [linksNotion, setLinksNotion] = useState('');

  // 이미지
  const [images, setImages] = useState<{ id: string; url: string; file: File }[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeImage = images.find((img) => img.id === activeId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // CommonCode 추천 목록
  const [domainSuggestions, setDomainSuggestions] = useState<CommonCodeItem[]>([]);
  const [lookingForSuggestions, setLookingForSuggestions] = useState<CommonCodeItem[]>([]);

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExtra, setShowExtra] = useState(false);

  // CommonCode 로드
  useEffect(() => {
    const fetchCodes = async (group: string) => {
      try {
        const res = await fetch(`/api/common-codes?group=${group}`);
        const data = await res.json();
        if (data.success) return data.data as CommonCodeItem[];
      } catch (e) {
        console.error(`${group} 로딩 실패`, e);
      }
      return [];
    };

    Promise.all([fetchCodes('DOMAIN'), fetchCodes('LOOKING_FOR')]).then(
      ([domainData, lookingForData]) => {
        setDomainSuggestions(domainData);
        setLookingForSuggestions(lookingForData);
      }
    );
  }, []);

  // 이미지 핸들러
  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newImageObjects = newFiles.map((file) => ({
        id: self.crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      }));
      setImages((prev) => [...prev, ...newImageObjects]);
    }
  };
  const handleRemoveImage = (idToRemove: string) => {
    setImages((prev) => prev.filter((image) => image.id !== idToRemove));
  };
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      setImages(arrayMove(images, oldIndex, newIndex));
    }
    setActiveId(null);
  }
  function handleDragCancel() {
    setActiveId(null);
  }

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 이미지 업로드
      const uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset =
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'side-project-mate';
        if (!cloudName) throw new Error('Cloudinary 설정이 필요합니다.');

        for (const img of images) {
          const fd = new FormData();
          fd.append('file', img.file);
          fd.append('upload_preset', uploadPreset);
          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: fd }
          );
          if (!uploadRes.ok) throw new Error('이미지 업로드에 실패했습니다.');
          const uploadData = await uploadRes.json();
          uploadedImageUrls.push(uploadData.secure_url);
        }
      }

      const links: Record<string, string> = {};
      if (linksGithub) links.github = linksGithub;
      if (linksDeploy) links.deploy = linksDeploy;
      if (linksNotion) links.notion = linksNotion;

      const projectData = {
        title,
        problemStatement,
        description: description || title,
        currentStage: currentStage || undefined,
        executionStyle: executionStyle || undefined,
        weeklyHours: weeklyHours || undefined,
        domains,
        lookingFor,
        maxMembers,
        overview: overview || undefined,
        techStacks,
        durationMonths: durationMonths || undefined,
        links: Object.keys(links).length > 0 ? links : undefined,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      };

      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      const createData = await createRes.json();
      if (createData.success) {
        router.push(`/projects/${createData.data.pid}`);
      } else {
        throw new Error(createData.message || '프로젝트 생성에 실패했습니다.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">새 프로젝트 만들기</h1>
          <p className="text-muted-foreground mt-2">당신의 아이디어를 현실로 만들어보세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* ── 섹션 1: 핵심 정보 ── */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
              핵심 정보
            </h2>

            <div>
              <label htmlFor="title" className="block text-sm font-bold mb-1 text-foreground">
                프로젝트 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={60}
                placeholder="프로젝트 제목을 입력하세요"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label
                htmlFor="problemStatement"
                className="block text-sm font-bold mb-1 text-foreground"
              >
                프로젝트 동기 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="problemStatement"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  required
                  maxLength={500}
                  rows={4}
                  placeholder={`이 프로젝트를 왜 시작하게 됐나요? 풀고 싶은 문제든, 만들어보고 싶은 아이디어든 자유롭게 써주세요.\n예) 소규모 카페들이 배달앱 수수료 때문에 직접 주문 채널을 못 만들고 있어서, 간단한 주문 페이지를 만들어주는 서비스를 구상 중이에요. 같이 발전시킬 분을 찾고 있어요.`}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
                <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                  {problemStatement.length}/500
                </span>
              </div>
            </div>
          </section>

          {/* ── 섹션 2: 진행 현황 ── */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
              진행 현황
            </h2>

            <div>
              <p className="text-sm font-bold mb-3 text-foreground">
                현재 단계 <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PROJECT_STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setCurrentStage(stage)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      currentStage === stage
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {STAGE_DESCRIPTIONS[stage]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold mb-3 text-foreground">
                실행 방식 <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                {EXECUTION_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setExecutionStyle(style)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      executionStyle === style
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {STYLE_LABELS[style]}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {STYLE_DESCRIPTIONS[style]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold mb-3 text-foreground">
                주당 예상 참여 시간 <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEKLY_HOURS_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setWeeklyHours(h)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      weeklyHours === h
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                        : 'border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {h === 30 ? '30h+' : `${h}h`}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── 섹션 3: 매칭 조건 ── */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
              매칭 조건
            </h2>

            <div>
              <p className="text-sm font-bold mb-2 text-foreground">관심 도메인</p>
              <TagInput
                value={domains}
                onChange={setDomains}
                suggestions={domainSuggestions}
                placeholder="도메인을 입력하거나 추천에서 선택하세요"
                maxTags={5}
              />
            </div>

            <div>
              <p className="text-sm font-bold mb-2 text-foreground">찾는 사람</p>
              <TagInput
                value={lookingFor}
                onChange={setLookingFor}
                suggestions={lookingForSuggestions}
                placeholder="어떤 사람과 함께하고 싶나요?"
                maxTags={5}
              />
            </div>

            <div>
              <p className="text-sm font-bold mb-3 text-foreground">최대 팀원 수</p>
              <div className="flex flex-wrap gap-2">
                {MAX_MEMBERS_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxMembers(n)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      maxMembers === n
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                        : 'border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {n}명
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── 섹션 4: 부가 정보 (접기 가능) ── */}
          <section>
            <button
              type="button"
              onClick={() => setShowExtra(!showExtra)}
              className="flex items-center gap-2 text-lg font-bold text-foreground border-b border-border pb-2 w-full text-left"
            >
              부가 정보
              <svg
                className={`w-4 h-4 transition-transform ${showExtra ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <span className="text-sm font-normal text-muted-foreground ml-auto">선택사항</span>
            </button>

            {showExtra && (
              <div className="space-y-6 mt-6">
                <div>
                  <label
                    htmlFor="overview"
                    className="block text-sm font-bold mb-1 text-foreground"
                  >
                    상세 배경 설명
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    AI 지시서 생성과 팀원 온보딩에 활용됩니다.
                  </p>
                  <textarea
                    id="overview"
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    rows={5}
                    placeholder="프로젝트 배경, 목표, 현재 상황 등을 자세히 적어주세요."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-bold mb-1 text-foreground"
                  >
                    부가 설명
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="추가로 설명하고 싶은 내용이 있다면 적어주세요."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold mb-2 text-foreground">기술 스택</p>
                  <TagInput
                    value={techStacks}
                    onChange={setTechStacks}
                    suggestions={[]}
                    placeholder="사용 기술을 입력하세요 (예: React, Python)"
                    maxTags={15}
                  />
                </div>

                <div>
                  <p className="text-sm font-bold mb-3 text-foreground">예상 기간</p>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDurationMonths(opt.value === 0 ? undefined : opt.value)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          (opt.value === 0 && durationMonths === undefined) ||
                          durationMonths === opt.value
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-border text-foreground hover:border-primary/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-foreground">링크</p>
                  <input
                    type="url"
                    value={linksGithub}
                    onChange={(e) => setLinksGithub(e.target.value)}
                    placeholder="GitHub 저장소 URL"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  />
                  <input
                    type="url"
                    value={linksDeploy}
                    onChange={(e) => setLinksDeploy(e.target.value)}
                    placeholder="배포 URL"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  />
                  <input
                    type="url"
                    value={linksNotion}
                    onChange={(e) => setLinksNotion(e.target.value)}
                    placeholder="Notion / 기획 문서 URL"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  />
                </div>

                {/* 이미지 업로드 */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground">
                    프로젝트 이미지 (드래그해서 순서 변경)
                  </label>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                  >
                    <SortableContext
                      items={images.map((img) => img.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="flex flex-wrap gap-4 mb-4">
                        {images.map(({ id, url }) => (
                          <SortableImage key={id} id={id} url={url} onRemove={handleRemoveImage} />
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {activeId && activeImage ? <DragOverlayItem url={activeImage.url} /> : null}
                    </DragOverlay>
                  </DndContext>
                  <div className="flex items-center justify-center w-full mt-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">클릭하여 이미지 추가</span>
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleNewImageChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── 에러 / 제출 ── */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}
          <div className="text-right">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? '생성 중...' : '프로젝트 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
