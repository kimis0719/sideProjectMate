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

export default function DetailProfileCard({
  user,
  onClick,
  title,
  isEditing,
  onEditAvatar,
  onUpdateUser,
}: DetailProfileCardProps) {
  return (
    <section
      className="bg-surface-container-lowest p-6 lg:p-10 rounded-xl shadow-sm"
      onClick={onClick}
    >
      {title && (
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">
          {title}
        </h3>
      )}

      <h2 className="text-2xl font-bold font-headline text-on-surface mb-8">기본 정보</h2>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
        {/* 아바타 */}
        <div className="relative group shrink-0">
          <div className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-surface-container ring-4 ring-surface shadow-inner">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.nName}
                fill
                sizes="128px"
                className="object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant font-bold text-3xl">
                {user.nName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          {isEditing && onEditAvatar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditAvatar();
              }}
              className="absolute bottom-0 right-0 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          )}
          {user.level !== undefined && (
            <div className="mt-3 text-center">
              <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs font-bold rounded-full">
                LV. {user.level} {user.level >= 10 ? '🔥' : '🌱'}
              </span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 w-full space-y-6">
          {/* 이름 + 상태 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-2xl font-bold text-on-surface font-headline">{user.nName}</h3>
            {isEditing && onUpdateUser ? (
              <select
                value={user.status || '구직중'}
                onChange={(e) => onUpdateUser('status', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-surface-container-low border-none text-on-surface-variant focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="구직중">구직중</option>
                <option value="팀빌딩중">팀빌딩중</option>
                <option value="재직중">재직중</option>
                <option value="학업중">학업중</option>
              </select>
            ) : (
              user.status && (
                <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider rounded-full">
                  {user.status}
                </span>
              )
            )}
          </div>

          {/* 포지션 / 경력 */}
          {isEditing && onUpdateUser ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  포지션
                </label>
                <BufferedInput
                  initialValue={user.position || ''}
                  placeholder="예: 프론트엔드"
                  onCommit={(value) => onUpdateUser('position', value)}
                  className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 py-3 px-4 font-medium text-sm text-on-surface transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  경력
                </label>
                <select
                  value={user.career || ''}
                  onChange={(e) => onUpdateUser('career', e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 py-3 px-4 font-medium text-sm text-on-surface appearance-none transition-all"
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
            </div>
          ) : (
            <p className="text-on-surface-variant font-medium">
              {user.position || '포지션 미설정'} · {user.career || '경력 미설정'}
            </p>
          )}

          {/* 자기소개 미리보기 */}
          {!isEditing && user.introduction ? (
            <div
              className="text-sm text-on-surface-variant leading-relaxed bg-surface-container-low p-4 rounded-xl prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html:
                  typeof window !== 'undefined'
                    ? DOMPurify.sanitize(user.introduction)
                    : user.introduction,
              }}
            />
          ) : !isEditing ? (
            <p className="text-sm text-on-surface-variant/50 italic">등록된 자기소개가 없습니다.</p>
          ) : null}

          {/* 기술 태그 */}
          {user.techTags && user.techTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {user.techTags.slice(0, 7).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider rounded-full"
                >
                  {tag}
                </span>
              ))}
              {user.techTags.length > 7 && (
                <span className="px-3 py-1 text-[11px] text-on-surface-variant/50">
                  +{user.techTags.length - 7}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * BufferedInput — 포커스 아웃/엔터 시에만 상위 핸들러 호출
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
