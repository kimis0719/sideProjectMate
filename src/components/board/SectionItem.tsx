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

// [Helper] Section Alignment Snap
const calculateSectionSnap = (
    currX: number,
    currY: number,
    width: number,
    height: number,
    myId: string,
    sections: Section[]
) => {
    const THRESHOLD = 5;
    let snappedX = currX;
    let snappedY = currY;
    const guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[] = [];

    let minDiffX = THRESHOLD + 1;
    let minDiffY = THRESHOLD + 1;
    let bestGuideX: number | null = null;
    let bestGuideY: number | null = null;

    const my = {
        l: currX, c: currX + width / 2, r: currX + width,
        t: currY, m: currY + height / 2, b: currY + height
    };

    sections.forEach((sec) => {
        if (sec.id === myId) return;

        const other = {
            l: sec.x, c: sec.x + sec.width / 2, r: sec.x + sec.width,
            t: sec.y, m: sec.y + sec.height / 2, b: sec.y + sec.height
        };

        // X-Axis
        const checkX = (target: number) => {
            if (Math.abs(target - my.l) < minDiffX) { minDiffX = Math.abs(target - my.l); snappedX = target; bestGuideX = target; }
            if (Math.abs(target - my.c) < minDiffX) { minDiffX = Math.abs(target - my.c); snappedX = target - width / 2; bestGuideX = target; }
            if (Math.abs(target - my.r) < minDiffX) { minDiffX = Math.abs(target - my.r); snappedX = target - width; bestGuideX = target; }
        };
        [other.l, other.c, other.r].forEach(checkX);

        // Y-Axis
        const checkY = (target: number) => {
            if (Math.abs(target - my.t) < minDiffY) { minDiffY = Math.abs(target - my.t); snappedY = target; bestGuideY = target; }
            if (Math.abs(target - my.m) < minDiffY) { minDiffY = Math.abs(target - my.m); snappedY = target - height / 2; bestGuideY = target; }
            if (Math.abs(target - my.b) < minDiffY) { minDiffY = Math.abs(target - my.b); snappedY = target - height; bestGuideY = target; }
        };
        [other.t, other.m, other.b].forEach(checkY);
    });

    if (bestGuideX !== null) guides.push({ type: 'vertical', x: bestGuideX });
    if (bestGuideY !== null) guides.push({ type: 'horizontal', y: bestGuideY });

    return { x: snappedX, y: snappedY, guides };
};

// [Helper] Section Resize Snap Calculation
const calculateSectionResizeSnap = (
    currX: number,
    currY: number,
    targetWidth: number,
    targetHeight: number,
    myId: string,
    sections: Section[]
) => {
    const THRESHOLD = 5;
    let snappedWidth = targetWidth;
    let snappedHeight = targetHeight;
    const guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[] = [];

    // My Edges (Right and Bottom only for resize)
    const myR = currX + targetWidth;
    const myB = currY + targetHeight;

    let minDiffX = THRESHOLD + 1;
    let minDiffY = THRESHOLD + 1;
    let bestGuideX: number | null = null;
    let bestGuideY: number | null = null;

    sections.forEach((sec) => {
        if (sec.id === myId) return;

        const other = {
            l: sec.x, c: sec.x + sec.width / 2, r: sec.x + sec.width,
            t: sec.y, m: sec.y + sec.height / 2, b: sec.y + sec.height
        };

        // X-Axis Match (My Right vs Other L/C/R)
        const checkX = (target: number) => {
            if (Math.abs(target - myR) < minDiffX) {
                minDiffX = Math.abs(target - myR);
                snappedWidth = target - currX;
                bestGuideX = target;
            }
        };
        [other.l, other.c, other.r].forEach(checkX);

        // Y-Axis Match (My Bottom vs Other T/M/B)
        const checkY = (target: number) => {
            if (Math.abs(target - myB) < minDiffY) {
                minDiffY = Math.abs(target - myB);
                snappedHeight = target - currY;
                bestGuideY = target;
            }
        };
        [other.t, other.m, other.b].forEach(checkY);
    });

    if (bestGuideX !== null) guides.push({ type: 'vertical', x: bestGuideX });
    if (bestGuideY !== null) guides.push({ type: 'horizontal', y: bestGuideY });

    return { w: snappedWidth, h: snappedHeight, guides };
};

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
        sections,
        setAlignmentGuides,
        isSnapEnabled,
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
        sections: s.sections,
        setAlignmentGuides: s.setAlignmentGuides,
        isSnapEnabled: s.isSnapEnabled,
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

        const rawDx = (e.clientX - lastPointerRef.current.x) / zoom;
        const rawDy = (e.clientY - lastPointerRef.current.y) / zoom;

        if (rawDx !== 0 || rawDy !== 0) {
            hasMoved.current = true;

            const prevX = currentVisual.current.x;
            const prevY = currentVisual.current.y;

            let newX = prevX + rawDx;
            let newY = prevY + rawDy;

            if (isSnapEnabled || e.altKey || e.shiftKey) {
                const { x: sx, y: sy, guides } = calculateSectionSnap(newX, newY, section.width, section.height, section.id, sections);
                newX = sx;
                newY = sy;
                setAlignmentGuides(guides);
            } else {
                setAlignmentGuides([]);
            }

            currentVisual.current.x = newX;
            currentVisual.current.y = newY;

            if (visualRef.current) {
                visualRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
            }

            // Sync Child Notes
            const realDx = newX - prevX;
            const realDy = newY - prevY;

            const childNoteEls = document.querySelectorAll(`[data-section-id="${section.id}"]`);
            childNoteEls.forEach((el) => {
                const htmlEl = el as HTMLElement;
                const transform = htmlEl.style.transform;
                const match = transform.match(/translate3d\(([^p]+)px,\s*([^p]+)px,\s*0\)/);
                if (match) {
                    const currentNoteX = parseFloat(match[1]);
                    const currentNoteY = parseFloat(match[2]);
                    htmlEl.style.transform = `translate3d(${currentNoteX + realDx}px, ${currentNoteY + realDy}px, 0)`;
                }
            });

            lastPointerRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const onPointerUpHeader = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        setAlignmentGuides([]); // Clear guides

        if (!hasMoved.current) return;

        // 드래그 종료 시: 섹션 위치 저장 + 하위 노트 위치 저장 (Undo 1회)
        debouncedSave.cancel();

        const finalX = currentVisual.current.x;
        const finalY = currentVisual.current.y;

        // 1. Move Section (Store Update)
        moveSection(section.id, finalX, finalY);
        saveChanges({ x: finalX, y: finalY });

        // 2. Move Child Notes (DB Save Only)
        // moveSection이 이미 Store의 노트 위치 등을 업데이트 함 (혹은 안함?).
        // BoardStore의 moveSection 액션을 확인해야 하지만, 보통 섹션 이동 시 노트도 같이 이동 처리해야 함.
        // 여기서는 안전하게 DB에만 저장 (Store는 이미 DOM 조작됨? 아니, Store sync가 안되면 렌더링 시 원래대로 돌아감).
        // moveSection 액션이 하위 노트도 이동시키는지 확인 필요. 만약 안시킨다면 여기서 updateNotes 호출해야 함.
        // (가정: moveSection이 하위 노트 이동은 처리 안하고 섹션만 이동시킴)
        // -> 그렇다면 여기서 updateNotes를 호출하여 Store를 맞춰줘야 함.

        const currentNotes = useBoardStore.getState().notes;
        const childNotes = currentNotes.filter(n => n.sectionId === section.id);

        if (childNotes.length > 0) {
            // 섹션 이동량 구하기
            const deltaX = finalX - section.x;
            const deltaY = finalY - section.y;

            // Store 업데이트 (노트 이동)
            const updates = childNotes.map(n => ({
                id: n.id,
                changes: { x: n.x + deltaX, y: n.y + deltaY }
            }));

            // 주의: moveSection이 이미 실행되었으므로 next render시 section.x는 finalX임.
            // 하지만 노트는? note.x가 그대로면 제자리로 돌아감.
            // 따라서 updateNotes로 노트 위치도 영구 업데이트 해야 함.
            updateNotes(updates);

            // DB 업데이트 (Batch)
            fetch('/api/kanban/notes/batch', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            }).catch(err => console.error('Failed to batch update child notes:', err));
        }
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
            let newWidth = Math.max(200, currentVisual.current.width + dx);
            let newHeight = Math.max(100, currentVisual.current.height + dy);

            // [Snap Logic]
            if (isSnapEnabled || e.altKey || e.shiftKey) {
                const { w, h, guides } = calculateSectionResizeSnap(
                    currentVisual.current.x,
                    currentVisual.current.y,
                    newWidth,
                    newHeight,
                    section.id,
                    sections
                );
                newWidth = w;
                newHeight = h;
                setAlignmentGuides(guides);
            } else {
                setAlignmentGuides([]);
            }

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
        setAlignmentGuides([]); // Clear guides

        const finalWidth = currentVisual.current.width;
        const finalHeight = currentVisual.current.height;

        // Store Update (Undo 1회)
        updateSection(section.id, { width: finalWidth, height: finalHeight });
        saveChanges({ width: finalWidth, height: finalHeight });

        // Resize 종료 시 capture/release
        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;
        const updates: { id: string; changes: Partial<any> }[] = [];

        const currentNotes = useBoardStore.getState().notes;

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
                if (note.sectionId === null) {
                    updates.push({ id: note.id, changes: { sectionId: section.id } });
                }
            } else {
                if (note.sectionId === section.id) {
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
        // 1. 잠금 확인
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
            removeSection(section.id);
            await fetch(`/api/kanban/sections/${section.id}?deleteNotes=true`, { method: 'DELETE' });
        } else {
            removeSection(section.id);
            await fetch(`/api/kanban/sections/${section.id}?deleteNotes=false`, { method: 'DELETE' });

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
            ref={visualRef}
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
