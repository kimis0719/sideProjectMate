import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IResource } from '@/lib/models/Project';
import { useModalStore } from '@/store/modalStore';

// 리소스 메타데이터 타입
interface ResourceMetadata {
  title?: string;
  image?: string;
  [key: string]: string | undefined;
}

// 리소스 카테고리 타입
type ResourceCategory = 'CODE' | 'DESIGN' | 'DOCS' | 'ENV' | 'ACCOUNT' | 'OTHER';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: IResource[];
  onAddResource: (
    type: 'LINK' | 'TEXT',
    category: string,
    content: string,
    metadata?: ResourceMetadata
  ) => Promise<void>;
  onDeleteResource: (resourceId: string) => Promise<void>;
  onUpdateResource: (
    resourceId: string,
    category: string,
    content: string,
    metadata?: ResourceMetadata
  ) => Promise<void>;
  currentUserId: string; // ✨ 현재 로그인한 유저 ID
  projectAuthorId: string; // ✨ 프로젝트 생성자(PM) ID
}

export default function ResourceModal({
  isOpen,
  onClose,
  resources,
  onAddResource,
  onDeleteResource,
  onUpdateResource,
  currentUserId,
  projectAuthorId,
}: ResourceModalProps) {
  const { openConfirm, openAlert } = useModalStore();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // 통합 입력 상태
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  // 자동 감지된 타입과 카테고리
  const [detectedType, setDetectedType] = useState<'LINK' | 'TEXT'>('LINK');
  const [detectedCategory, setDetectedCategory] = useState<
    'CODE' | 'DESIGN' | 'DOCS' | 'ENV' | 'ACCOUNT' | 'OTHER'
  >('DOCS');
  const [isManualCategory, setIsManualCategory] = useState(false); // 수동 선택 모드

  // 계정 파싱 데이터 (프리뷰용)
  const [parsedAccount, setParsedAccount] = useState<{ id?: string; pw?: string } | null>(null);

  // 비밀번호 가리기 상태
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // 수정 모드 상태
  const [editingResource, setEditingResource] = useState<IResource | null>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // ✨ 자동 분류 로직
  useEffect(() => {
    if (editingResource || isManualCategory) return; // 수정 중이거나 수동 선택 시 중단

    const trimmed = content.trim();
    setParsedAccount(null);

    // 빈 값이면 기본값 (단, 필터링에는 영향 안 줌)
    if (!trimmed) {
      setDetectedType('LINK');
      setDetectedCategory('DOCS');
      return;
    }

    // 1. ENV 감지 (대문자+언더스코어=값) -> LINK보다 우선 순위! (URL이 값으로 들어올 수 있으므로)
    if (/^[A-Z0-9_]+=.+$/m.test(trimmed)) {
      setDetectedType('TEXT');
      setDetectedCategory('ENV');
      return;
    }

    // 2. LINK 감지 (http/https 포함 여부 확인)
    const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/); // URL 부분을 캡처
    if (urlMatch) {
      setDetectedType('LINK');

      // 기존에 LINK 계열 카테고리(DOCS, DESIGN 등)였으면 유지
      if (['DOCS', 'DESIGN', 'OTHER'].includes(detectedCategory)) {
        // keep
      } else {
        setDetectedCategory('DOCS');
      }

      // ✨ 스마트 파싱: 텍스트와 URL이 섞여있다면 분리!
      const url = urlMatch[0];
      const otherText = trimmed.replace(url, '').trim();

      if (otherText.length > 0) {
        // 사용자가 방금 붙여넣기 한 경우라고 판단하고 분리 적용
        setContent(url);
        setTitle(otherText.replace(/[\r\n]+/g, ' ')); // 줄바꿈은 공백으로
        return;
      }
      return;
    }

    // 3. ACCOUNT 감지
    const idMatch = trimmed.match(/(?:id|아이디)\s*[:=]\s*([^\n\r]+)/i);
    const pwMatch = trimmed.match(/(?:pw|pass|password|비번|비밀번호)\s*[:=]\s*([^\n\r]+)/i);
    const simpleMatch = !idMatch && !pwMatch && trimmed.match(/^([^:\s]+):([^:\s]+)$/m);

    if (idMatch || simpleMatch) {
      setDetectedType('TEXT');
      setDetectedCategory('ACCOUNT');

      if (!title) {
        let newTitle = '';
        if (idMatch) {
          const matchIndex = idMatch.index || 0;
          if (matchIndex > 0) newTitle = trimmed.substring(0, matchIndex).trim();
        } else if (simpleMatch) {
          const matchIndex = simpleMatch.index || 0;
          if (matchIndex > 0) newTitle = trimmed.substring(0, matchIndex).trim();
        }
        if (newTitle) setTitle(newTitle.replace(/[\r\n]+/g, ' '));
      }

      if (idMatch && pwMatch) {
        setParsedAccount({ id: idMatch[1].trim(), pw: pwMatch[1].trim() });
      } else if (simpleMatch) {
        setParsedAccount({ id: simpleMatch[1].trim(), pw: simpleMatch[2].trim() });
      }
      return;
    }

    // 4. 그 외
    setDetectedType('TEXT');
    if (detectedCategory === 'ACCOUNT' || detectedCategory === 'ENV') {
      setDetectedCategory('OTHER');
    }
  }, [content, editingResource, isManualCategory, detectedCategory, title]);

  // 수정 모드 진입 시 폼 채우기
  useEffect(() => {
    if (editingResource) {
      setContent(editingResource.content);
      setTitle(editingResource.metadata?.title || '');

      setDetectedType(editingResource.type);
      setDetectedCategory(editingResource.category as ResourceCategory);
      setIsManualCategory(true); // 수정 시엔 자동 감지 끄기
    }
  }, [editingResource]);

  const resetForm = () => {
    setEditingResource(null);
    setContent('');
    setTitle('');
    setDetectedType('LINK');
    setDetectedCategory('DOCS');
    setIsManualCategory(false); // 리셋 시 자동 감지 다시 켜기
    setParsedAccount(null);
    setFilterCategory('ALL'); // 필터도 초기화
  };

  // 필터링 적용
  const filteredResources = resources.filter((res) => {
    if (filterCategory === 'ALL') return true;
    return res.category === filterCategory;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // alert('복사되었습니다!'); -> 굳이 모달까지 띄울 필요 없거나 토스트가 적합하나, 여기선 일단 유지하되 openAlert 사용 고려 (너무 잦은 알림 방지 위해 일단 둠)
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const parseAccountContent = (content: string) => {
    const idMatch = content.match(/(?:id|아이디)\s*[:=]\s*([^\n\r]+)/i);
    const pwMatch = content.match(/(?:pw|pass|password|비번|비밀번호)\s*[:=]\s*([^\n\r]+)/i);
    const simpleMatch = content.match(/^([^:\s]+):([^:\s]+)$/m);

    if (idMatch && pwMatch) return { id: idMatch[1].trim(), pw: pwMatch[1].trim() };
    if (simpleMatch) return { id: simpleMatch[1].trim(), pw: simpleMatch[2].trim() };
    return { id: content, pw: '' };
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      await openAlert('안내', '내용을 입력해주세요.');
      return;
    }

    const finalMetadata: ResourceMetadata = {};
    if (title.trim()) {
      finalMetadata.title = title;
    }

    if (editingResource) {
      await onUpdateResource(editingResource._id!, detectedCategory, content, finalMetadata);
      setEditingResource(null);
      resetForm();
    } else {
      await onAddResource(detectedType, detectedCategory, content, finalMetadata);
      resetForm();
    }
  };

  // 화면 표시용 카테고리 라벨
  const categoryLabels: Record<string, string> = {
    DOCS: '🔗 링크/문서',
    ENV: '⚙️ 환경변수',
    ACCOUNT: '🔑 계정',
    OTHER: '📝 메모',
    CODE: '💻 코드',
    DESIGN: '🎨 디자인',
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = (cat: string) => {
    setDetectedCategory(cat as ResourceCategory);
    setIsManualCategory(true); // 수동 선택 활성화 (자동 감지 잠금)
    setFilterCategory(cat); // 목록 필터링도 연동

    // 타입은 내용에 따라 유연하게, 단 ENV/ACCOUNT/OTHER는 무조건 TEXT로
    // (메모에 링크가 있어도 링크 카드로 변하면 안 되니까)
    if (cat === 'ENV' || cat === 'ACCOUNT' || cat === 'OTHER') {
      setDetectedType('TEXT');
    } else if (content.includes('http')) {
      setDetectedType('LINK');
    } else {
      setDetectedType('TEXT');
    }
  };

  // 삭제 핸들러 (컨펌 모달 적용)
  const handleDeleteClick = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    const confirmed = await openConfirm(
      '자산 삭제',
      '정말 이 자산을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      {
        isDestructive: true,
        confirmText: '삭제',
        cancelText: '취소',
      }
    );
    if (confirmed) {
      await onDeleteResource(resourceId);
    }
  };

  return (
    <div
      className={`fixed right-8 bottom-24 z-50 w-full max-w-sm transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[700px]">
        {/* Header */}
        <div
          className={`p-4 border-b transition-colors flex justify-between items-center shrink-0 
                    ${
                      editingResource
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                    }`}
        >
          <div>
            <h3
              className={`text-lg font-bold flex items-center gap-2 ${editingResource ? 'text-amber-700 dark:text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}
            >
              {editingResource ? '✏️ 자산 수정 중' : '🔐 프로젝트 자산 박스'}
            </h3>
            <p
              className={`text-xs mt-0.5 ${editingResource ? 'text-amber-600/80 dark:text-amber-400/80' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {editingResource
                ? '내용을 수정하면 자동 분류됩니다'
                : '팀원들과 공유할 리소스를 관리하세요'}
            </p>
          </div>
          {editingResource ? (
            <button
              onClick={resetForm}
              className="text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold"
            >
              취소
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Resource List */}
        <div className="p-4 space-y-3 overflow-y-auto bg-slate-50/50 dark:bg-black/20 min-h-[200px] flex-1">
          {filteredResources.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs text-balance">
              {filterCategory === 'ALL' ? (
                <>
                  등록된 자산이 없습니다.
                  <br />
                  아래에서 새로운 자산을 추가해보세요!
                </>
              ) : (
                <>
                  이 카테고리({categoryLabels[filterCategory]})에
                  <br />
                  등록된 자산이 없습니다.
                </>
              )}
            </div>
          ) : (
            filteredResources.map((res: IResource) => {
              const accountInfo =
                res.category === 'ACCOUNT' ? parseAccountContent(res.content) : null;
              const isPwVisible = (res._id && visiblePasswords[res._id]) || false;

              // ✨ 권한 체크 (본인 작성 or 프로젝트 관리자)
              const isOwner =
                res.userId === currentUserId || (!res.userId && currentUserId === projectAuthorId); // (레거시 데이터는 관리자만)
              const isAdmin = currentUserId === projectAuthorId;
              const hasPermission = isOwner || isAdmin;

              return (
                <div
                  key={res._id}
                  className={`relative group transition-opacity ${editingResource && editingResource._id !== res._id ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
                >
                  {/* 수정/삭제 버튼: 권한이 있는 경우에만 표시 */}
                  {!editingResource && hasPermission && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingResource(res);
                        }}
                        className="bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-sm"
                        title="수정"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, res._id!)}
                        className="bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm"
                        title="삭제"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Card Renderer */}
                  <div
                    className={`${res.category === 'ENV' ? 'bg-slate-900 dark:bg-slate-950 border-slate-800 dark:border-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} rounded-xl p-3 border shadow-sm`}
                  >
                    {/* Link Style (ENV, ACCOUNT, OTHER 제외) */}
                    {res.type === 'LINK' && !['ENV', 'ACCOUNT', 'OTHER'].includes(res.category) && (
                      <div
                        className="flex gap-3 items-center"
                        onClick={() => !editingResource && window.open(res.content, '_blank')}
                      >
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0">
                          {res.metadata?.image ? (
                            <Image
                              src={res.metadata.image}
                              alt=""
                              width={32}
                              height={32}
                              className="w-full h-full object-cover rounded-lg"
                              unoptimized
                            />
                          ) : (
                            <span className="text-sm">🔗</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">
                              {res.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {res.metadata?.title || res.content}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {res.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ENV Style */}
                    {res.category === 'ENV' && (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            ⚙️ ENV
                          </span>
                          <button
                            onClick={() => handleCopy(res.content)}
                            className="text-[10px] text-slate-500 hover:text-emerald-400"
                          >
                            Copy
                          </button>
                        </div>
                        <code className="text-xs text-slate-300 font-mono break-all block whitespace-pre-wrap">
                          {res.content}
                        </code>
                      </>
                    )}

                    {/* Account Style */}
                    {res.category === 'ACCOUNT' && accountInfo && (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            🔑 Account
                          </span>
                          {res.metadata?.title && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {res.metadata.title}
                            </span>
                          )}
                        </div>
                        {/* ID Row */}
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded border border-slate-100 dark:border-slate-700 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 w-4">
                              ID
                            </span>
                            <code className="text-xs text-slate-700 dark:text-slate-200 font-mono truncate">
                              {accountInfo.id}
                            </code>
                          </div>
                          <button
                            onClick={() => handleCopy(accountInfo.id!)}
                            className="text-[10px] text-blue-400 hover:text-blue-600 font-bold ml-1 shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                        {/* PW Row */}
                        {accountInfo.pw && (
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 w-4">
                                PW
                              </span>
                              <code className="text-xs text-slate-700 dark:text-slate-200 font-mono truncate">
                                {isPwVisible ? accountInfo.pw : '••••••••'}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => togglePassword(res._id!)}
                                className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
                              >
                                {isPwVisible ? '숨기기' : '보기'}
                              </button>
                              <button
                                onClick={() => handleCopy(accountInfo.pw!)}
                                className="text-[10px] text-blue-400 hover:text-blue-600 font-bold ml-1 shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Other Style */}
                    {res.category === 'OTHER' && (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            📝 MEMO
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                          {res.content}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Form (Footer) */}
        <div
          className={`p-4 border-t shrink-0 transition-colors ${
            editingResource
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
          }`}
        >
          {/* 카테고리 수동 선택 칩 */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 px-1 scrollbar-hide">
            <button
              onClick={(e) => {
                setFilterCategory('ALL');
                setIsManualCategory(false);
                resetForm();
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'center',
                  block: 'nearest',
                });
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border shrink-0 whitespace-nowrap
                                 ${
                                   filterCategory === 'ALL'
                                     ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700'
                                     : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                 }`}
            >
              전체
            </button>
            {(['DOCS', 'DESIGN', 'ENV', 'ACCOUNT', 'OTHER'] as const).map((cat) => (
              <button
                key={cat}
                onClick={(e) => {
                  handleCategorySelect(cat);
                  e.currentTarget.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest',
                  });
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border shrink-0 whitespace-nowrap
                                    ${
                                      detectedCategory === cat
                                        ? 'bg-purple-600 text-white border-purple-600' // 선택된 카테고리 강조
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* 설명(제목) 입력 (모든 타입에서 노출) */}
          <div className="mb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                detectedCategory === 'ACCOUNT'
                  ? '계정 설명 (예: AWS 루트 계정)'
                  : '설명 (선택사항, 링크 제목 등)'
              }
              className="w-full text-xs bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 focus:border-purple-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* 계정 프리뷰 */}
          {parsedAccount && !editingResource && (
            <div className="mb-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded p-2 text-xs text-purple-800 dark:text-purple-300">
              <div className="flex">
                <span className="w-6 font-bold opacity-50">ID</span> {parsedAccount.id}
              </div>
              <div className="flex">
                <span className="w-6 font-bold opacity-50">PW</span> {parsedAccount.pw}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="공유할 내용을 입력하세요... (자동 분류됨)"
              className={`w-full bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 transition-all resize-none min-h-[80px]
                                ${
                                  editingResource
                                    ? 'border-amber-200 dark:border-amber-800 focus:ring-amber-500'
                                    : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 dark:focus:ring-blue-600'
                                }`}
            />

            <button
              onClick={handleSubmit}
              className={`w-full py-2.5 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2
                                ${
                                  editingResource
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
                                }`}
            >
              {editingResource ? (
                <>
                  <span>💾</span> 수정 완료
                </>
              ) : (
                <>
                  <span>✨</span> 등록하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
