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
  currentUserId: string;
  projectAuthorId: string;
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

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  const [detectedType, setDetectedType] = useState<'LINK' | 'TEXT'>('LINK');
  const [detectedCategory, setDetectedCategory] = useState<ResourceCategory>('DOCS');
  const [isManualCategory, setIsManualCategory] = useState(false);

  const [parsedAccount, setParsedAccount] = useState<{ id?: string; pw?: string } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingResource, setEditingResource] = useState<IResource | null>(null);

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  // 자동 분류 로직
  useEffect(() => {
    if (editingResource || isManualCategory) return;

    const trimmed = content.trim();
    setParsedAccount(null);

    if (!trimmed) {
      setDetectedType('LINK');
      setDetectedCategory('DOCS');
      return;
    }

    if (/^[A-Z0-9_]+=.+$/m.test(trimmed)) {
      setDetectedType('TEXT');
      setDetectedCategory('ENV');
      return;
    }

    const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      setDetectedType('LINK');
      if (!['DOCS', 'DESIGN', 'OTHER'].includes(detectedCategory)) {
        setDetectedCategory('DOCS');
      }
      const url = urlMatch[0];
      const otherText = trimmed.replace(url, '').trim();
      if (otherText.length > 0) {
        setContent(url);
        setTitle(otherText.replace(/[\r\n]+/g, ' '));
      }
      return;
    }

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

    setDetectedType('TEXT');
    if (detectedCategory === 'ACCOUNT' || detectedCategory === 'ENV') {
      setDetectedCategory('OTHER');
    }
  }, [content, editingResource, isManualCategory, detectedCategory, title]);

  useEffect(() => {
    if (editingResource) {
      setContent(editingResource.content);
      setTitle(editingResource.metadata?.title || '');
      setDetectedType(editingResource.type);
      setDetectedCategory(editingResource.category as ResourceCategory);
      setIsManualCategory(true);
    }
  }, [editingResource]);

  const resetForm = () => {
    setEditingResource(null);
    setContent('');
    setTitle('');
    setDetectedType('LINK');
    setDetectedCategory('DOCS');
    setIsManualCategory(false);
    setParsedAccount(null);
    setFilterCategory('ALL');
  };

  const filteredResources = resources.filter((res) => {
    if (filterCategory === 'ALL') return true;
    return res.category === filterCategory;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
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
    if (title.trim()) finalMetadata.title = title;

    if (editingResource) {
      await onUpdateResource(editingResource._id!, detectedCategory, content, finalMetadata);
      setEditingResource(null);
      resetForm();
    } else {
      await onAddResource(detectedType, detectedCategory, content, finalMetadata);
      resetForm();
    }
  };

  const categoryLabels: Record<string, string> = {
    DOCS: '🔗 링크/문서',
    ENV: '⚙️ 환경변수',
    ACCOUNT: '🔑 계정',
    OTHER: '📝 메모',
    CODE: '💻 코드',
    DESIGN: '🎨 디자인',
  };

  const handleCategorySelect = (cat: string) => {
    setDetectedCategory(cat as ResourceCategory);
    setIsManualCategory(true);
    setFilterCategory(cat);
    if (cat === 'ENV' || cat === 'ACCOUNT' || cat === 'OTHER') {
      setDetectedType('TEXT');
    } else if (content.includes('http')) {
      setDetectedType('LINK');
    } else {
      setDetectedType('TEXT');
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    const confirmed = await openConfirm(
      '자산 삭제',
      '정말 이 자산을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      { isDestructive: true, confirmText: '삭제', cancelText: '취소' }
    );
    if (confirmed) await onDeleteResource(resourceId);
  };

  return (
    <div
      className={`fixed right-8 bottom-24 z-50 w-full max-w-sm transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_60px_rgba(26,28,28,0.15),0_8px_24px_rgba(26,28,28,0.1)] ring-1 ring-outline-variant/10 overflow-hidden flex flex-col max-h-[700px]">
        {/* Header */}
        <div
          className={`p-4 flex justify-between items-center shrink-0 ${
            editingResource ? 'bg-tertiary-fixed/20' : 'bg-surface-container-lowest'
          }`}
        >
          <div>
            <h3
              className={`text-lg font-bold font-headline flex items-center gap-2 ${editingResource ? 'text-tertiary' : 'text-on-surface'}`}
            >
              {editingResource ? '✏️ 자산 수정 중' : '🔐 프로젝트 자산 박스'}
            </h3>
            <p
              className={`text-xs mt-0.5 ${editingResource ? 'text-tertiary/80' : 'text-on-surface-variant'}`}
            >
              {editingResource
                ? '내용을 수정하면 자동 분류됩니다'
                : '팀원들과 공유할 리소스를 관리하세요'}
            </p>
          </div>
          {editingResource ? (
            <button
              onClick={resetForm}
              className="text-xs bg-surface-container-lowest px-2 py-1 rounded text-tertiary font-bold hover:bg-surface-container-low transition-colors"
            >
              취소
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Resource List */}
        <div className="p-4 space-y-3 overflow-y-auto bg-surface-container-low/50 min-h-[200px] flex-1">
          {filteredResources.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant/50 text-xs">
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
              const isOwner =
                res.userId === currentUserId || (!res.userId && currentUserId === projectAuthorId);
              const isAdmin = currentUserId === projectAuthorId;
              const hasPermission = isOwner || isAdmin;

              return (
                <div
                  key={res._id}
                  className={`relative group transition-opacity ${editingResource && editingResource._id !== res._id ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
                >
                  {/* 수정/삭제 버튼 */}
                  {!editingResource && hasPermission && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingResource(res);
                        }}
                        className="bg-surface-container-lowest p-1 rounded text-primary-container hover:bg-primary-container/10 shadow-sm"
                        title="수정"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, res._id!)}
                        className="bg-surface-container-lowest p-1 rounded text-error hover:bg-error-container/30 shadow-sm"
                        title="삭제"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  )}

                  {/* Card */}
                  <div
                    className={`rounded-xl p-3 ${
                      res.category === 'ENV'
                        ? 'bg-inverse-surface text-inverse-on-surface'
                        : 'bg-surface-container-lowest'
                    }`}
                  >
                    {/* Link Style */}
                    {res.type === 'LINK' && !['ENV', 'ACCOUNT', 'OTHER'].includes(res.category) && (
                      <div
                        className="flex gap-3 items-center cursor-pointer"
                        onClick={() => !editingResource && window.open(res.content, '_blank')}
                      >
                        <div className="w-8 h-8 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary-container shrink-0">
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
                          <span className="text-[10px] font-bold text-primary-container uppercase tracking-wider">
                            {res.category}
                          </span>
                          <h4 className="text-xs font-semibold text-on-surface truncate">
                            {res.metadata?.title || res.content}
                          </h4>
                          <p className="text-[10px] text-on-surface-variant truncate">
                            {res.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ENV Style */}
                    {res.category === 'ENV' && (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            ⚙️ ENV
                          </span>
                          <button
                            onClick={() => handleCopy(res.content)}
                            className="text-[10px] text-inverse-on-surface/60 hover:text-emerald-400 font-semibold"
                          >
                            Copy
                          </button>
                        </div>
                        <code className="text-xs text-inverse-on-surface/80 font-mono break-all block whitespace-pre-wrap">
                          {res.content}
                        </code>
                      </>
                    )}

                    {/* Account Style */}
                    {res.category === 'ACCOUNT' && accountInfo && (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                            🔑 Account
                          </span>
                          {res.metadata?.title && (
                            <span className="text-[10px] text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded">
                              {res.metadata.title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-low p-1.5 rounded mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-bold text-on-surface-variant/50 w-4">
                              ID
                            </span>
                            <code className="text-xs text-on-surface font-mono truncate">
                              {accountInfo.id}
                            </code>
                          </div>
                          <button
                            onClick={() => handleCopy(accountInfo.id!)}
                            className="text-[10px] text-primary-container hover:text-primary font-bold ml-1 shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                        {accountInfo.pw && (
                          <div className="flex items-center justify-between bg-surface-container-low p-1.5 rounded">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[9px] font-bold text-on-surface-variant/50 w-4">
                                PW
                              </span>
                              <code className="text-xs text-on-surface font-mono truncate">
                                {isPwVisible ? accountInfo.pw : '••••••••'}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => togglePassword(res._id!)}
                                className="text-[10px] text-on-surface-variant hover:text-on-surface font-bold"
                              >
                                {isPwVisible ? '숨기기' : '보기'}
                              </button>
                              <button
                                onClick={() => handleCopy(accountInfo.pw!)}
                                className="text-[10px] text-primary-container hover:text-primary font-bold ml-1 shrink-0"
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
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                            📝 MEMO
                          </span>
                        </div>
                        <p className="text-xs text-on-surface whitespace-pre-wrap break-all">
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
          className={`p-4 shrink-0 transition-colors ${
            editingResource ? 'bg-tertiary-fixed/10' : 'bg-surface-container-low/50'
          }`}
        >
          {/* 카테고리 칩 */}
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
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 whitespace-nowrap ${
                filterCategory === 'ALL'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
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
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 whitespace-nowrap ${
                  detectedCategory === cat
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* 설명 입력 */}
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
              className="w-full text-xs bg-surface-container-low border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-container/20 outline-none placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* 계정 프리뷰 */}
          {parsedAccount && !editingResource && (
            <div className="mb-2 bg-secondary-container/20 rounded-lg p-2 text-xs text-secondary">
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
              className={`w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 transition-all resize-none min-h-[80px] ${
                editingResource ? 'focus:ring-tertiary/30' : 'focus:ring-primary-container/20'
              }`}
            />

            <button
              onClick={handleSubmit}
              className={`w-full py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                editingResource
                  ? 'bg-tertiary text-on-tertiary hover:bg-tertiary/90'
                  : 'bg-primary-container text-on-primary hover:bg-primary'
              }`}
            >
              {editingResource ? (
                <>
                  <span className="material-symbols-outlined text-sm">save</span> 수정 완료
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">add_circle</span> 등록하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
