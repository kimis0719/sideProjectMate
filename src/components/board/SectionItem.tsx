'use client';

import React from 'react';
import { useBoardStore, Section } from '@/store/boardStore';
import { socketClient } from '@/lib/socket';
import { useSession } from 'next-auth/react';

// Color Gen Helper
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// --- Debounce Helper ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };

    debounced.cancel = () => {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced;
}
// --------------------

type Props = {
    section: Section;
};

export default function SectionItem({ section }: Props) {
    const {
        moveSection,
        updateSection,
        removeSection,
        zoom,
        moveNotes,
        notes,
        updateNotes,
        selectNotes,
        lockedSections,
        lockedNotes,
        lockSection,
        unlockSection,
        members,
    } = useBoardStore((s) => ({
        moveSection: s.moveSection,
        updateSection: s.updateSection,
        removeSection: s.removeSection,
        zoom: s.zoom,
        moveNotes: s.moveNotes,
        notes: s.notes,
        updateNotes: s.updateNotes,
        selectNotes: s.selectNotes,
        lockedSections: s.lockedSections,
        lockedNotes: s.lockedNotes,
        lockSection: s.lockSection,
        unlockSection: s.unlockSection,
        members: s.members,
    }));

    const { data: session } = useSession();
    const myUserId = session?.user?.id || 'anonymous';

    const [isEditingTitle, setIsEditingTitle] = React.useState(false);
    const [titleDraft, setTitleDraft] = React.useState(section.title);
    const isDragging = React.useRef(false);
    const hasMoved = React.useRef(false);
    const isResizing = React.useRef(false);
    const lastPointerRef = React.useRef({ x: 0, y: 0 });

    // [Refactoring] Visual Refs
    const visualRef = React.useRef<HTMLDivElement>(null);
    const currentVisual = React.useRef({ x: section.x, y: section.y, width: section.width, height: section.height });

    // Sync Visual State when props change (only if not interacting)
    React.useEffect(() => {
        if (!isDragging.current && !isResizing.current) {
            currentVisual.current = { x: section.x, y: section.y, width: section.width, height: section.height };
            if (visualRef.current) {
                visualRef.current.style.transform = `translate3d(${section.x}px, ${section.y}px, 0)`;
                visualRef.current.style.width = `${section.width}px`;
                visualRef.current.style.height = `${section.height}px`;
            }
        }
    }, [section.x, section.y, section.width, section.height]);


    const lockInfo = lockedSections && lockedSections[section.id];
    const isLockedByOther = !!(lockInfo && lockInfo.socketId !== socketClient.socket?.id);
    const lockedByUser = isLockedByOther ? members.find(m => m._id === lockInfo.userId) : null;
    const lockedByName = lockedByUser ? lockedByUser.nName : (lockInfo?.userId || 'Unknown');
    const lockedColor = lockInfo ? stringToColor(lockInfo.userId) : '#EF4444';


    // --- 서버 저장 로직 ---
    const saveChanges = React.useCallback(
        (patch: Partial<Omit<Section, 'id'>>) => {
            fetch(`/api/kanban/sections/${section.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            }).catch((error) => {
                console.error('Failed to save section changes:', error);
            });
        },
        [section.id]
    );

    const debouncedSave = React.useMemo(() => debounce(saveChanges, 500), [saveChanges]);

    // --- Title Edit ---
    const startEditTitle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLockedByOther) return;

        setIsEditingTitle(true);
        if (myUserId !== 'anonymous') {
            lockSection(section.id, myUserId);
        }
    };

    const saveTitle = () => {
        updateSection(section.id, { title: titleDraft });
        saveChanges({ title: titleDraft });
        setIsEditingTitle(false);
        unlockSection(section.id);
    };

    // --- Dragging (Move) ---
    const onPointerDownHeader = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (isEditingTitle) return;
        if (isLockedByOther) return;

        isDragging.current = true;
        hasMoved.current = false;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };

        // Capture start position
        currentVisual.current = { x: section.x, y: section.y, width: section.width, height: section.height };

        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

        // 섹션 내의 모든 노트 선택 -> 드래그 시 같이 보이기 위함? 
        // 다중 선택 상태로 만들면 NoteItem에서 제어하기 복잡해짐.
        // 여기서는 그냥 섹션 이동 시 'DOM 조작'으로 같이 이동시키므로 굳이 선택할 필요 없음.
        // 다만 UX상 선택되는게 자연스럽다면 유지. (일단 유지)
        const childNoteIds = notes
            .filter((n) => n.sectionId === section.id)
            .map((n) => n.id);

        if (childNoteIds.length > 0) {
            selectNotes(childNoteIds);
        }
    };

    const onPointerMoveHeader = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        e.stopPropagation();

        const dx = (e.clientX - lastPointerRef.current.x) / zoom;
        const dy = (e.clientY - lastPointerRef.current.y) / zoom;

        if (dx !== 0 || dy !== 0) {
            hasMoved.current = true;

            // 1. Update Section Visual
            const newX = currentVisual.current.x + dx;
            const newY = currentVisual.current.y + dy;
            currentVisual.current.x = newX;
            currentVisual.current.y = newY;

            if (visualRef.current) {
                visualRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
            }

            // 2. Update Child Notes Visuals (DOM Manipulation)
            const childNoteEls = document.querySelectorAll(`[data-section-id="${section.id}"]`);
            childNoteEls.forEach((el) => {
                const htmlEl = el as HTMLElement;
                // 현재 transform 읽기 (Regex or parsing)
                // translate3d(100px, 200px, 0)
                const transform = htmlEl.style.transform;
                const match = transform.match(/translate3d\(([^p]+)px,\s*([^p]+)px,\s*0\)/);
                if (match) {
                    const currentNoteX = parseFloat(match[1]);
                    const currentNoteY = parseFloat(match[2]);
                    htmlEl.style.transform = `translate3d(${currentNoteX + dx}px, ${currentNoteY + dy}px, 0)`;
                }
            });

            lastPointerRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const onPointerUpHeader = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

        if (!hasMoved.current) return;

        // 드래그 종료 시: 섹션 위치 저장 + 하위 노트 위치 저장 (Undo 1회)
        debouncedSave.cancel();

        const finalX = currentVisual.current.x;
        const finalY = currentVisual.current.y;

        // 1. Move Section (Store Update)
        moveSection(section.id, finalX, finalY);
        saveChanges({ x: finalX, y: finalY });

        // 2. Move Child Notes (DB Save Only - Store actions are handled by moveSection)
        // 섹션 이동량 계산
        const deltaX = finalX - section.x;
        const deltaY = finalY - section.y;

        // moveSection이 이미 Store의 노트 위치를 업데이트했으므로, 
        // 여기서는 DB 저장만 수행하여 이중 오프셋 적용을 방지합니다.
        // 주의: useBoardStore.getState().notes는 moveSection 호출 전일 수도, 후일 수도 있음(Zustand set은 동기적이나).
        // 안전하게 '이동 전 위치 + delta'로 계산하여 보냅니다. (여기서 section.x는 이동 전 props)

        const currentNotes = useBoardStore.getState().notes;
        const childNotes = currentNotes.filter(n => n.sectionId === section.id);

        if (childNotes.length > 0) {
            // moveSection 호출 후라면 이미 x,y가 변했을 수 있음.
            // 하지만 moveSection은 id, x, y 인자를 받아 set을 수행함.
            // 여기서 childNotes를 가져올 때, moveSection이 먼저 실행되었다면 이미 이동된 좌표일 것임.
            // moveSection 구현: set((state) => ... return { sections..., notes... })
            // Zustand set은 동기적으로 state를 바꿈.
            // 따라서 moveSection 호출 직후에는 notes가 이미 이동되어 있음.
            // 그렇다면 delta를 더하면 안 되고, 그냥 현재 notes의 좌표를 보내야 함.

            // 검증: moveSection(section.id, finalX, finalY) 호출 -> notes 업데이트됨 (x + dx).
            // 그 후 getState().notes 가져옴 -> 이미 업데이트된 notes.
            // 따라서 DB에 저장할 때는 그냥 그 notes의 x, y를 저장하면 됨.
            // delta를 더하면 '두 번' 더하는 셈이 됨 (만약 여기서 또 더하면).

            const updates = childNotes.map(n => ({
                id: n.id,
                changes: { x: n.x, y: n.y }
            }));

            // updateNotes(updates) 호출 금지 (Store 중복 업데이트 원인)
            fetch('/api/kanban/notes/batch', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            }).catch(err => console.error('Failed to batch update child notes:', err));
        }

        // Resize 종료 시 로직과 동일하게 Capture/Release 로직 수행?
        // 섹션을 이동해도 포함 관계가 바뀔 수 있음.
        // 간단하게 처리하기 위해 생략하거나, 필요하면 추가.
        // 여기서는 위치 동기화가 우선이므로 위치만 업데이트.
    };

    // --- Resizing ---
    const onPointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (isLockedByOther) return;

        isResizing.current = true;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };

        // Capture start
        currentVisual.current = { x: section.x, y: section.y, width: section.width, height: section.height };

        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    };

    const onPointerMoveResize = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isResizing.current) return;
        e.stopPropagation();

        const dx = (e.clientX - lastPointerRef.current.x) / zoom;
        const dy = (e.clientY - lastPointerRef.current.y) / zoom;

        if (dx !== 0 || dy !== 0) {
            const newWidth = Math.max(200, currentVisual.current.width + dx);
            const newHeight = Math.max(100, currentVisual.current.height + dy);

            // Visual Update Only
            currentVisual.current.width = newWidth;
            currentVisual.current.height = newHeight;

            if (visualRef.current) {
                visualRef.current.style.width = `${newWidth}px`;
                visualRef.current.style.height = `${newHeight}px`;
            }

            lastPointerRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const onPointerUpResize = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isResizing.current) return;
        isResizing.current = false;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        debouncedSave.cancel();

        const finalWidth = currentVisual.current.width;
        const finalHeight = currentVisual.current.height;

        // Store Update (Undo 1회)
        updateSection(section.id, { width: finalWidth, height: finalHeight });
        saveChanges({ width: finalWidth, height: finalHeight });

        // Resize 종료 시: 섹션 범위 내의 노트들을 자동으로 포함하거나, 벗어난 노트들을 방출
        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;
        const updates: { id: string; changes: Partial<any> }[] = [];

        // 최신 notes 상태 가져오기
        const currentNotes = useBoardStore.getState().notes;

        // 현재 Visual 위치 기준 (x,y는 안바뀌었지만 혹시 모르니 currentVisual 사용)
        const secX = currentVisual.current.x;
        const secY = currentVisual.current.y;

        currentNotes.forEach((note) => {
            const noteCenterX = note.x + NOTE_WIDTH / 2;
            const noteCenterY = note.y + NOTE_HEIGHT / 2;

            const isInside =
                noteCenterX >= secX &&
                noteCenterX <= secX + finalWidth &&
                noteCenterY >= secY &&
                noteCenterY <= secY + finalHeight;

            if (isInside) {
                // 범위 내에 있는데
                if (note.sectionId === null) {
                    // Orphan이면 -> Capture
                    updates.push({ id: note.id, changes: { sectionId: section.id } });
                }
            } else {
                // 범위 밖에 있는데
                if (note.sectionId === section.id) {
                    // 이 섹션 소속이면 -> Release (Orphan)
                    updates.push({ id: note.id, changes: { sectionId: null } });
                }
            }
        });

        if (updates.length > 0) {
            updateNotes(updates);
        }
    };

    // --- Delete ---
    const handleDelete = async () => {
        // 1. 잠금 확인 (노트가 다른 사람에 의해 수정 중인지)
        const childNoteIds = notes
            .filter((n) => n.sectionId === section.id)
            .map((n) => n.id);

        if (lockedSections && lockedSections[section.id] && lockedSections[section.id].socketId !== socketClient.socket?.id) {
            alert('다른 사용자가 이 섹션을 편집 중입니다.');
            return;
        }

        const lockedChildNotes = childNoteIds.filter(id => {
            const lock = lockedNotes && lockedNotes[id];
            return lock && lock.socketId !== socketClient.socket?.id;
        });

        if (lockedChildNotes.length > 0) {
            alert(`섹션 내에 다른 사용자가 편집 중인 노트가 ${lockedChildNotes.length}개 있습니다.\n삭제할 수 없습니다.`);
            return;
        }

        if (confirm('섹션을 삭제하시겠습니까?\n\n[확인]: 섹션과 내부 노트 모두 삭제\n[취소]: 섹션만 삭제하고 노트는 유지')) {
            // 모두 삭제 (deleteNotes=true)
            removeSection(section.id); // Store update
            await fetch(`/api/kanban/sections/${section.id}?deleteNotes=true`, { method: 'DELETE' });
        } else {
            // 섹션만 삭제 (deleteNotes=false)
            removeSection(section.id); // Store update
            await fetch(`/api/kanban/sections/${section.id}?deleteNotes=false`, { method: 'DELETE' });

            // Store 업데이트: 하위 노트들의 sectionId 해제
            const childNotes = notes.filter(n => n.sectionId === section.id);
            if (childNotes.length > 0) {
                const updates = childNotes.map(n => ({
                    id: n.id,
                    changes: { sectionId: null as any }
                }));
                updateNotes(updates);
            }
        }
    };

    return (
        <div
            ref={visualRef} // Attach Ref
            style={{
                position: 'absolute',
                transform: `translate3d(${section.x}px, ${section.y}px, 0)`,
                width: section.width,
                height: section.height,
                zIndex: section.zIndex || 0,
                display: 'flex',
                flexDirection: 'column',
                border: isLockedByOther ? `3px solid ${lockedColor}` : 'none',
                borderRadius: isLockedByOther ? 8 : 0,
            }}
        >
            {/* Lock Indicator */}
            {isLockedByOther && (
                <div style={{
                    position: 'absolute',
                    top: -24,
                    left: 0,
                    background: lockedColor,
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '4px 4px 4px 0',
                    zIndex: 100,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {lockedByName}
                </div>
            )}

            {/* Header (Drag Handle) */}
            <div
                onPointerDown={onPointerDownHeader}
                onPointerMove={onPointerMoveHeader}
                onPointerUp={onPointerUpHeader}
                onDoubleClick={startEditTitle}
                style={{
                    height: 40,
                    background: section.color || '#E5E7EB',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    cursor: isLockedByOther ? 'not-allowed' : 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                }}
            >
                {isEditingTitle ? (
                    <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid black',
                            outline: 'none',
                            fontSize: 16,
                            fontWeight: 'bold',
                            width: '100%',
                        }}
                    />
                ) : (
                    <span style={{ fontSize: 16, fontWeight: 'bold', color: '#374151' }}>{section.title}</span>
                )}

                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isLockedByOther) handleDelete();
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#6B7280',
                        opacity: isLockedByOther ? 0.5 : 1,
                        pointerEvents: isLockedByOther ? 'none' : 'auto',
                    }}
                >
                    ×
                </button>
            </div>

            {/* Body (Container) */}
            <div
                style={{
                    flex: 1,
                    background: `${section.color || '#E5E7EB'}33`, // 20% opacity
                    border: `2px dashed ${section.color || '#E5E7EB'}`,
                    borderTop: 'none',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    pointerEvents: 'none',
                }}
            />

            {/* Resize Handle */}
            <div
                onPointerDown={onPointerDownResize}
                onPointerMove={onPointerMoveResize}
                onPointerUp={onPointerUpResize}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 20,
                    height: 20,
                    cursor: isLockedByOther ? 'default' : 'nwse-resize',
                    touchAction: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isLockedByOther ? 0 : 1,
                    pointerEvents: isLockedByOther ? 'none' : 'auto',
                }}
            >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M10 0L0 10H10V0Z" fill="#9CA3AF" />
                </svg>
            </div>
        </div>
    );
}
