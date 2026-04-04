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
        sizes="128px"
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
        sizes="128px"
        className="rounded-lg object-cover"
        draggable={false}
      />
    </div>
  );
}

// --- 상수 ---
const WEEKLY_HOURS_OPTIONS = [5, 10, 15, 20, 30] as const;
const MAX_MEMBERS_OPTIONS = [2, 3, 4, 5, 6] as const;
const MAX_MEMBERS_LABELS: Record<number, string> = {
  2: '2명',
  3: '3명',
  4: '4명',
  5: '5명',
  6: '6+명',
};
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
  const [step, setStep] = useState(1);

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
  const handleSubmit = async () => {
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

  const STEPS = [
    { num: 1, label: '핵심' },
    { num: 2, label: '진행' },
    { num: 3, label: '매칭' },
    { num: 4, label: '부가' },
  ];

  const canProceed = () => {
    if (step === 1) return title.trim().length > 0 && problemStatement.trim().length > 0;
    if (step === 2) return !!currentStage && !!executionStyle && weeklyHours > 0;
    return true;
  };

  // 공통 스타일
  const inputClass =
    'w-full bg-surface-container-lowest border-none p-4 text-on-surface rounded-xl focus:ring-2 focus:ring-primary-container/20 placeholder:text-on-surface-variant/30';
  const labelClass =
    'block text-sm font-bold uppercase tracking-widest text-primary-container font-label mb-2';
  const chipActive = 'bg-primary-container/10 ring-2 ring-primary-container';
  const chipInactive = 'bg-surface-container-low hover:bg-surface-container-high';
  const cardActive = 'bg-primary-container/5 ring-2 ring-primary-container';
  const cardInactive = 'bg-surface-container-low hover:bg-surface-container-high';

  return (
    <div className="bg-surface min-h-screen">
      <div className="px-6 lg:px-8 py-8 md:py-12 max-w-[800px] mx-auto">
        {/* 헤더 */}
        <div className="mb-10 space-y-2">
          <h1 className="text-4xl md:text-[3.5rem] font-bold font-headline leading-tight tracking-tight text-on-surface">
            새 프로젝트 시작하기
          </h1>
          <p className="text-lg text-on-surface-variant">아이디어를 현실로 만들어보세요.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-10 bg-surface-container-low p-5 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold">
              {step}
            </div>
            <div className="flex flex-col">
              <span className="text-[0.75rem] font-bold text-primary-container uppercase tracking-widest font-label">
                Step {step}/4
              </span>
              <span className="text-on-surface font-semibold">{STEPS[step - 1].label}</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {STEPS.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < step || canProceed()) setStep(s.num);
                }}
                className={`font-semibold transition-colors ${
                  s.num === step
                    ? 'text-primary-container'
                    : s.num < step
                      ? 'text-on-surface-variant hover:text-on-surface'
                      : 'text-on-surface-variant/40'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          {/* ── Step 1: 핵심 정보 ── */}
          {step === 1 && (
            <section className="space-y-8">
              <div className="space-y-3">
                <label htmlFor="title" className={labelClass}>
                  * 프로젝트 이름
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={60}
                    placeholder="영감을 주는 프로젝트명을 입력하세요"
                    className={`${inputClass} text-xl font-semibold`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/50 font-mono">
                    {title.length} / 60
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="problemStatement" className={labelClass}>
                  * 시작 동기 및 목표
                </label>
                <div className="relative">
                  <textarea
                    id="problemStatement"
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    required
                    maxLength={500}
                    rows={6}
                    placeholder="이 프로젝트를 왜 시작하게 되었나요? 어떤 문제를 해결하고 싶은지 자유롭게 적어주세요."
                    className={`${inputClass} text-lg resize-none`}
                  />
                  <span className="absolute bottom-3 right-4 text-xs text-on-surface-variant/50 font-mono">
                    {problemStatement.length} / 500
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ── Step 2: 진행 현황 ── */}
          {step === 2 && (
            <section className="space-y-8">
              <div>
                <p className={labelClass}>* 현재 단계</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PROJECT_STAGES.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setCurrentStage(stage)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        currentStage === stage ? cardActive : cardInactive
                      }`}
                    >
                      <span className="block text-sm font-semibold text-on-surface">
                        {STAGE_LABELS[stage]}
                      </span>
                      <span className="block text-xs text-on-surface-variant mt-0.5">
                        {STAGE_DESCRIPTIONS[stage]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className={labelClass}>* 실행 방식</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {EXECUTION_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setExecutionStyle(style)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        executionStyle === style ? cardActive : cardInactive
                      }`}
                    >
                      <span className="block text-sm font-semibold text-on-surface">
                        {STYLE_LABELS[style]}
                      </span>
                      <span className="block text-xs text-on-surface-variant mt-0.5">
                        {STYLE_DESCRIPTIONS[style]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className={labelClass}>* 주당 예상 참여 시간</p>
                <div className="flex flex-wrap gap-2">
                  {WEEKLY_HOURS_OPTIONS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setWeeklyHours(h)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        weeklyHours === h
                          ? `${chipActive} text-primary-container`
                          : `${chipInactive} text-on-surface`
                      }`}
                    >
                      {h === 30 ? '30h+' : `${h}h`}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Step 3: 매칭 조건 ── */}
          {step === 3 && (
            <section className="space-y-8">
              <div>
                <p className={labelClass}>관심 도메인</p>
                <TagInput
                  value={domains}
                  onChange={setDomains}
                  suggestions={domainSuggestions}
                  placeholder="도메인을 입력하거나 추천에서 선택하세요"
                  maxTags={5}
                />
              </div>

              <div>
                <p className={labelClass}>찾는 사람</p>
                <TagInput
                  value={lookingFor}
                  onChange={setLookingFor}
                  suggestions={lookingForSuggestions}
                  placeholder="어떤 사람과 함께하고 싶나요?"
                  maxTags={5}
                />
              </div>

              <div>
                <p className={labelClass}>예상 팀원 수</p>
                <div className="flex flex-wrap gap-2">
                  {MAX_MEMBERS_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxMembers(n)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        maxMembers === n
                          ? `${chipActive} text-primary-container`
                          : `${chipInactive} text-on-surface`
                      }`}
                    >
                      {MAX_MEMBERS_LABELS[n] || `${n}명`}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Step 4: 부가 정보 ── */}
          {step === 4 && (
            <section className="space-y-8">
              <div>
                <label htmlFor="overview" className={labelClass}>
                  상세 배경 설명
                </label>
                <p className="text-xs text-on-surface-variant mb-2">
                  AI 지시서 생성과 팀원 온보딩에 활용됩니다.
                </p>
                <textarea
                  id="overview"
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={5}
                  placeholder="프로젝트 배경, 목표, 현재 상황 등을 자세히 적어주세요."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label htmlFor="description" className={labelClass}>
                  부가 설명
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="추가로 설명하고 싶은 내용이 있다면 적어주세요."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <p className={labelClass}>기술 스택</p>
                <TagInput
                  value={techStacks}
                  onChange={setTechStacks}
                  suggestions={[]}
                  placeholder="사용 기술을 입력하세요 (예: React, Python)"
                  maxTags={15}
                />
              </div>

              <div>
                <p className={labelClass}>예상 기간</p>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDurationMonths(opt.value === 0 ? undefined : opt.value)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        (opt.value === 0 && durationMonths === undefined) ||
                        durationMonths === opt.value
                          ? `${chipActive} text-primary-container`
                          : `${chipInactive} text-on-surface`
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className={labelClass}>링크</p>
                <input
                  type="url"
                  value={linksGithub}
                  onChange={(e) => setLinksGithub(e.target.value)}
                  placeholder="GitHub 저장소 URL"
                  className={inputClass}
                />
                <input
                  type="url"
                  value={linksDeploy}
                  onChange={(e) => setLinksDeploy(e.target.value)}
                  placeholder="배포 URL"
                  className={inputClass}
                />
                <input
                  type="url"
                  value={linksNotion}
                  onChange={(e) => setLinksNotion(e.target.value)}
                  placeholder="Notion / 기획 문서 URL"
                  className={inputClass}
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <p className={labelClass}>프로젝트 이미지</p>
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
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-outline-variant/30 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-1">
                    image
                  </span>
                  <p className="text-sm text-on-surface-variant">
                    클릭하여 이미지 추가 (드래그로 순서 변경)
                  </p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleNewImageChange}
                    accept="image/*"
                  />
                </label>
              </div>
            </section>
          )}

          {/* ── 에러 ── */}
          {error && (
            <div className="p-4 bg-error-container/40 text-on-error-container rounded-xl text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-base mt-0.5">warning</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── 하단 네비게이션 ── */}
          <div className="flex items-center justify-between pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-on-surface-variant font-semibold hover:bg-surface-container-high rounded-xl transition-all"
              >
                이전
              </button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (canProceed()) setStep(step + 1);
                }}
                disabled={!canProceed()}
                className="px-8 py-3 bg-primary-container text-on-primary font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                다음 단계
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-3 bg-primary-container text-on-primary font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-[20px]">
                      progress_activity
                    </span>
                    생성 중...
                  </>
                ) : (
                  <>
                    프로젝트 생성하기
                    <span className="material-symbols-outlined">check</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
