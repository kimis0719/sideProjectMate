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
        moveNotes, // 섹션 이동 시 노트도 함께 이동시키기 위해 필요 (Store에서 처리하지만, 여기서 호출)
        notes, // 섹션 내 노트 찾기용
        updateNotes, // 섹션 이동 종료 시 노트 위치 저장용
        selectNotes,
        lockedSections,
        lockedNotes, // Added lockedNotes
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
        lockedNotes: s.lockedNotes, // Map state
        lockSection: s.lockSection,
        unlockSection: s.unlockSection,
        members: s.members,
    }));

    const { data: session } = useSession();
    const myUserId = session?.user?.id || 'anonymous';

    // NOTE: variables 'lockInfo' etc were erroneously declared here. Removing them.


    const [isEditingTitle, setIsEditingTitle] = React.useState(false);
    const [titleDraft, setTitleDraft] = React.useState(section.title);
    const isDragging = React.useRef(false);
    const hasMoved = React.useRef(false);
    const isResizing = React.useRef(false);
    const lastPointerRef = React.useRef({ x: 0, y: 0 });

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
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

        // 섹션 내의 모든 노트 선택
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
            const newX = section.x + dx;
            const newY = section.y + dy;

            // Store Action 호출 (섹션 이동 + 하위 노트 이동)
            moveSection(section.id, newX, newY);

            // 디바운스 저장 (섹션 위치만)
            debouncedSave({ x: newX, y: newY });

            lastPointerRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const onPointerUpHeader = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

        if (!hasMoved.current) return; // 이동하지 않았으면 저장 안 함

        // 드래그 종료 시: 섹션 위치 저장 + 하위 노트 위치 저장
        debouncedSave.cancel(); // 중복 저장 방지
        saveChanges({ x: section.x, y: section.y });

        // 하위 노트들도 서버에 저장해야 함 (Batch Update)
        const childNotes = notes.filter(n => n.sectionId === section.id);
        if (childNotes.length > 0) {
            const updates = childNotes.map(n => ({
                id: n.id,
                changes: { x: n.x, y: n.y }
            }));
            updateNotes(updates);
        }

        // Resize 종료 시: 섹션 범위 내의 노트들을 자동으로 포함하거나, 벗어난 노트들을 방출
        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;
        const updates: { id: string; changes: Partial<any> }[] = [];

        notes.forEach((note) => {
            const noteCenterX = note.x + NOTE_WIDTH / 2;
            const noteCenterY = note.y + NOTE_HEIGHT / 2;

            const isInside =
                noteCenterX >= section.x &&
                noteCenterX <= section.x + section.width &&
                noteCenterY >= section.y &&
                noteCenterY <= section.y + section.height;

            if (isInside) {
                // 범위 내에 있는데
                if (note.sectionId === null) {
                    // Orphan이면 -> Capture
                    updates.push({ id: note.id, changes: { sectionId: section.id } });
                } else if (note.sectionId !== section.id) {
                    // 다른 섹션에 속해있으면 -> Steal? (일단은 Orphan만 캡처하는 것으로 유지)
                    // 사용자가 원하면 Steal 로직 추가 가능
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

    // --- Resizing ---
    const onPointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (isLockedByOther) return;

        isResizing.current = true;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    };

    const onPointerMoveResize = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isResizing.current) return;
        e.stopPropagation();

        const dx = (e.clientX - lastPointerRef.current.x) / zoom;
        const dy = (e.clientY - lastPointerRef.current.y) / zoom;

        if (dx !== 0 || dy !== 0) {
            const newWidth = Math.max(200, section.width + dx); // 최소 너비 200
            const newHeight = Math.max(100, section.height + dy); // 최소 높이 100

            updateSection(section.id, { width: newWidth, height: newHeight });
            debouncedSave({ width: newWidth, height: newHeight });

            lastPointerRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const onPointerUpResize = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isResizing.current) return;
        isResizing.current = false;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        debouncedSave.cancel(); // 중복 저장 방지
        saveChanges({ width: section.width, height: section.height });

        // Resize 종료 시: 섹션 범위 내의 노트들을 자동으로 포함하거나, 벗어난 노트들을 방출
        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;
        const updates: { id: string; changes: Partial<any> }[] = [];

        notes.forEach((note) => {
            const noteCenterX = note.x + NOTE_WIDTH / 2;
            const noteCenterY = note.y + NOTE_HEIGHT / 2;

            const isInside =
                noteCenterX >= section.x &&
                noteCenterX <= section.x + section.width &&
                noteCenterY >= section.y &&
                noteCenterY <= section.y + section.height;

            if (isInside) {
                // 범위 내에 있는데
                if (note.sectionId === null) {
                    // Orphan이면 -> Capture
                    updates.push({ id: note.id, changes: { sectionId: section.id } });
                } else if (note.sectionId !== section.id) {
                    // 다른 섹션에 속해있으면 -> Steal? (일단은 Orphan만 캡처하는 것으로 유지)
                    // 사용자가 원하면 Steal 로직 추가 가능
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
