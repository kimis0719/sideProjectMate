import React from 'react';
import Image from 'next/image';
import DOMPurify from 'dompurify';

interface UserData {
  _id: string;
  nName: string;
  avatarUrl?: string;
  position?: string;
  career?: string;
  status?: string;
  level?: number;
  introduction?: string;
  techTags?: string[];
  socialLinks?: {
    github?: string;
    blog?: string;
    solvedAc?: string;
  };
}

interface DetailProfileCardProps {
  user: UserData;
  onClick?: () => void;
  title?: string;
  isEditing?: boolean;
  onEditAvatar?: () => void;
  onUpdateUser?: (field: string, value: string) => void;
}

/**
 * @component DetailProfileCard
 * @description
 * 사용자의 프로필을 상세하게 보여주는 큰 카드 컴포넌트입니다.
 * 프로젝트 상세 페이지의 작성자 소개나, 마이페이지의 미리보기용으로 사용됩니다.
 */
export default function DetailProfileCard({
  user,
  onClick,
  title,
  isEditing,
  onEditAvatar,
  onUpdateUser,
}: DetailProfileCardProps) {
  return (
    <div
      className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full"
      onClick={onClick}
    >
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-gray-100 dark:border-border bg-gray-50 dark:bg-muted group/avatar">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.nName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-3xl group-hover:bg-gray-300 transition-colors">
                {user.nName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            {/* 편집 모드일 때 오버레이 */}
            {isEditing && onEditAvatar && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onEditAvatar();
                }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            )}
          </div>
          {/* 명시적 버튼 (모바일 등에서 접근성 위해) */}
          {isEditing && onEditAvatar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditAvatar();
              }}
              className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-primary hover:border-primary transition-colors z-10"
              title="이미지 변경"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          )}
          {user.level !== undefined && (
            <div className="mt-3">
              <span className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 dark:from-yellow-900/50 dark:to-amber-900/50 dark:text-amber-200 text-xs font-bold rounded-full shadow-sm border border-yellow-200 dark:border-yellow-800">
                LV. {user.level} {user.level >= 10 ? '🔥' : '🌱'}
              </span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-foreground group-hover:text-primary transition-colors">
                {user.nName}
              </h4>
              {isEditing && onUpdateUser ? (
                <select
                  value={user.status || '구직중'}
                  onChange={(e) => onUpdateUser('status', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 text-xs font-semibold rounded-full border border-gray-300 bg-white dark:bg-card focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="구직중">구직중</option>
                  <option value="팀빌딩중">팀빌딩중</option>
                  <option value="재직중">재직중</option>
                  <option value="학업중">학업중</option>
                </select>
              ) : (
                user.status && (
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                      user.status === '구직중'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
                        : user.status === '팀빌딩중'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {user.status}
                  </span>
                )
              )}
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {isEditing && onUpdateUser ? (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <BufferedInput
                    initialValue={user.position || ''}
                    placeholder="직군 (예: 프론트엔드)"
                    onCommit={(value) => onUpdateUser('position', value)}
                    className="border-b border-gray-300 focus:border-primary focus:outline-none bg-transparent py-1 text-sm w-32"
                  />
                  <span className="text-gray-300 self-center">|</span>
                  <select
                    value={user.career || ''}
                    onChange={(e) => onUpdateUser('career', e.target.value)}
                    className="border-b border-gray-300 focus:border-primary focus:outline-none bg-transparent py-1 text-sm"
                  >
                    <option value="" disabled>
                      경력 선택
                    </option>
                    <option value="신입 (0년)">신입 (0년)</option>
                    <option value="1~3년차">1~3년차</option>
                    <option value="4~6년차">4~6년차</option>
                    <option value="7년차 이상">7년차 이상</option>
                  </select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-medium">
                  {user.position || '포지션 미설정'} <span className="mx-1 text-gray-300">|</span>{' '}
                  {user.career || '경력 미설정'}
                </p>
              )}
            </div>
          </div>

          {user.introduction ? (
            <div
              className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed bg-gray-50 dark:bg-muted/50 p-3 rounded-lg text-left prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html:
                  typeof window !== 'undefined'
                    ? DOMPurify.sanitize(user.introduction)
                    : user.introduction, // SSR Fallback (Caution: Hydration mismatch risk, but acceptable for now)
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">등록된 자기소개가 없습니다.</p>
          )}

          {/* Tags */}
          {user.techTags && user.techTags.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
              {user.techTags.slice(0, 7).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-muted text-foreground font-medium rounded-md border border-border"
                >
                  {tag}
                </span>
              ))}
              {user.techTags.length > 7 && (
                <span className="px-2 py-1 text-xs text-muted-foreground">
                  +{user.techTags.length - 7}
                </span>
              )}
            </div>
          )}

          {/* Social Links (GitHub Only for now in summary) */}
          {/* Social Links */}
          <div className="flex justify-center sm:justify-start pt-2 gap-3">
            {user.socialLinks?.github && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>@{user.socialLinks.github.split('/').pop()}</span>
              </div>
            )}
            {user.socialLinks?.solvedAc && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-600 transition-colors">
                <Image
                  src="https://static.solved.ac/logo.svg"
                  alt="solved.ac"
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 opacity-70"
                  unoptimized
                />
                <span>@{user.socialLinks.solvedAc}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @component BufferedInput
 * @description
 * 입력 중에는 로컬 상태만 업데이트하고,
 * 포커스를 잃거나 엔터를 쳤을 때만 상위 핸들러(API 호출 등)를 실행하는 최적화된 입력 컴포넌트
 */
function BufferedInput({
  initialValue,
  onCommit,
  className,
  placeholder,
}: {
  initialValue: string;
  onCommit: (val: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [value, setValue] = React.useState(initialValue);

  // 상위 prop이 바뀔 때 로컬 상태 동기화
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (value !== initialValue) {
      onCommit(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
