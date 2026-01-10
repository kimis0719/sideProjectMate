'use client';

import React, { useEffect } from 'react';
import { useBoardStore } from '@/store/boardStore';

export default function ShortcutHandler() {
    // 상태 구독을 제거하고 이벤트 핸들러 내부에서 getState()를 사용하여
    // 불필요한 리렌더링 및 리스너 재등록 방지

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            console.log('Key pressed:', e.key, 'Code:', e.code, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey, 'Meta:', e.metaKey);

            // 입력 요소(input, textarea)에 포커스가 있으면 단축키 무시
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
                console.log('Ignored due to input focus');
                if (e.key === 'Escape') {
                    target.blur(); // 포커스 해제
                }
                return;
            }

            const store = useBoardStore.getState();
            const {
                addNote,
                removeNotes,
                selectedNoteIds,
                selectNote,
                duplicateNotes,
                moveNotes,
                setOpenPaletteNoteId,
                selectNotes,
                undo,
                redo
            } = store;

            // 1. 새 노트 생성 (N)
            // e.code === 'KeyN' 체크 추가 (한글 입력 상태 호환)
            if ((e.key.toLowerCase() === 'n' || e.code === 'KeyN') && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                addNote();
            }

            // 2. 삭제 (Delete / Backspace)
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNoteIds.length > 0) {
                    e.preventDefault();
                    removeNotes(selectedNoteIds);
                }
            }

            // 3. 선택 해제 (Escape)
            if (e.key === 'Escape') {
                e.preventDefault();
                selectNote(null);
                setOpenPaletteNoteId(null);
            }

            // 4. 전체 선택 (Ctrl + A)
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'a' || e.code === 'KeyA')) {
                e.preventDefault();
                const allNoteIds = store.notes.map((n) => n.id);
                selectNotes(allNoteIds);
            }

            // 5. 복제 (Ctrl + D)
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'd' || e.code === 'KeyD')) {
                e.preventDefault();
                if (selectedNoteIds.length > 0) {
                    duplicateNotes(selectedNoteIds);
                }
            }

            // 6. 키보드 이동 (Arrow Keys)
            if (selectedNoteIds.length > 0) {
                const STEP = e.shiftKey ? 50 : 10;
                let dx = 0;
                let dy = 0;

                // 화살표 키는 e.code도 ArrowUp 등으로 동일함
                switch (e.key) {
                    case 'ArrowUp': dy = -STEP; break;
                    case 'ArrowDown': dy = STEP; break;
                    case 'ArrowLeft': dx = -STEP; break;
                    case 'ArrowRight': dx = STEP; break;
                    default: break;
                }

                if (dx !== 0 || dy !== 0) {
                    e.preventDefault();
                    moveNotes(selectedNoteIds, dx, dy);
                    return;
                }
            }

            // 7. Undo (Ctrl + Z)
            // 한글 입력 중일 때(Process) e.key가 'z'가 아닐 수 있음 -> e.code === 'KeyZ' 확인
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ')) {
                console.log('Undo Triggered (ShortcutHandler)');
                e.preventDefault();
                undo();
            }

            // 8. Redo (Ctrl + Shift + Z or Ctrl + Y)
            if (
                ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ')) ||
                ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || e.code === 'KeyY'))
            ) {
                console.log('Redo Triggered (ShortcutHandler)');
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // 의존성 배열 비움

    return null;
}
