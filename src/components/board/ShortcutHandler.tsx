'use client';

import React, { useEffect } from 'react';
import { useBoardStore } from '@/store/boardStore';

export default function ShortcutHandler() {
    const {
        addNote,
        removeNotes,
        selectedNoteIds,
        selectNote,
        duplicateNotes,
        moveNotes,
        notes,
        setOpenPaletteNoteId,
    } = useBoardStore((s) => ({
        addNote: s.addNote,
        removeNotes: s.removeNotes,
        selectedNoteIds: s.selectedNoteIds,
        selectNote: s.selectNote,
        duplicateNotes: s.duplicateNotes,
        moveNotes: s.moveNotes,
        notes: s.notes,
        setOpenPaletteNoteId: s.setOpenPaletteNoteId,
    }));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 입력 요소(input, textarea)에 포커스가 있으면 단축키 무시
            // 단, ESC는 예외적으로 허용할 수도 있지만, 보통 input 포커스 해제 용도로 쓰임.
            // 여기서는 input 내부에서의 키 입력을 방해하지 않도록 처리.
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
                if (e.key === 'Escape') {
                    target.blur(); // 포커스 해제
                }
                return;
            }

            // 1. 새 노트 생성 (N)
            if (e.key.toLowerCase() === 'n' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                // 화면 중앙 또는 마우스 위치 기반 생성이 이상적이나, 여기서는 기본 addNote 사용
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
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                const allNoteIds = useBoardStore.getState().notes.map((n) => n.id);
                useBoardStore.getState().selectNotes(allNoteIds);
            }

            // 5. 복제 (Ctrl + D)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                if (selectedNoteIds.length > 0) {
                    duplicateNotes(selectedNoteIds);
                }
            }

            // 6. 키보드 이동 (Arrow Keys)
            if (selectedNoteIds.length > 0) {
                const STEP = e.shiftKey ? 50 : 10; // Shift 누르면 크게 이동
                let dx = 0;
                let dy = 0;

                switch (e.key) {
                    case 'ArrowUp': dy = -STEP; break;
                    case 'ArrowDown': dy = STEP; break;
                    case 'ArrowLeft': dx = -STEP; break;
                    case 'ArrowRight': dx = STEP; break;
                    default: return; // 화살표 키가 아니면 종료
                }

                e.preventDefault();
                moveNotes(selectedNoteIds, dx, dy);

                // 키보드 이동 후 서버 저장 (Debounce 처리는 moveNotes 내부나 개별 NoteItem에서 처리되지만,
                // moveNotes 함수는 상태만 바꾸고 API 호출은 별도로 해야 할 수 있음.
                // 현재 moveNotes는 socket emit만 하고 DB 저장은 안 할 수 있음. 확인 필요.)
                // -> NoteItem의 useEffect나 별도 로직이 필요할 수 있음.
                // 여기서는 일단 이동만 시킴.

                // TODO: 키보드 이동 시 DB 저장 로직 추가 필요 (moveNotes 개선 시)
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [addNote, removeNotes, selectedNoteIds, selectNote, duplicateNotes, moveNotes, setOpenPaletteNoteId]);

    return null; // Headless component
}
