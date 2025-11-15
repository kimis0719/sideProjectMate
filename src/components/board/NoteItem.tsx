'use client';

import React from 'react';
import { useBoardStore } from '@/store/boardStore';

type Props = {
  id: string;
  x: number;
  y: number;
  text: string;
  color?: string;
};

export default function NoteItem({ id, x, y, text, color = '#FFFB8F' }: Props) {
  const moveNote = useBoardStore((s) => s.moveNote);
  const updateNote = useBoardStore((s) => s.updateNote);
  const removeNote = useBoardStore((s) => s.removeNote);

  const [dragging, setDragging] = React.useState(false); // 드래그 상태
  const [isEditing, setIsEditing] = React.useState(false); // 편집 모드
  const [draft, setDraft] = React.useState(text); // 편집 초안
  const startRef = React.useRef({ sx: 0, sy: 0, ox: 0, oy: 0 }); // 드래그 시작 스냅샷

  // 외부 텍스트가 바뀌면, 편집 중이 아닐 때만 draft 동기화
  React.useEffect(() => {
    if (!isEditing) setDraft(text);
  }, [text, isEditing]);

  // 편집 시작(더블클릭)
  const beginEdit = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDraft(text);
    setIsEditing(true);
  }, [text]);

  // 편집 저장
  const saveEdit = React.useCallback(() => {
    updateNote(id, { text: draft });
    setIsEditing(false);
  }, [draft, id, updateNote]);

  // 편집 취소
  const cancelEdit = React.useCallback(() => {
    setDraft(text);
    setIsEditing(false);
  }, [text]);

    /* onPointerDown(callback: React.PointerEvent<HTMLDivElement>), dependencies: [x, y])
      * 드래그의 시작 시점의 노트 원점(ox, oy) 를 [x, y]로 기록
      *
      * 1. pointerdown에서 시작값 기록 + 캡처 시작
      * - e.currentTarget.setPointerCapture(e.pointerId)
      * - ref에 시작 좌표/원점 좌표 저장
      * - dragging 상태 true
      * */
    const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isEditing) return;
      e.stopPropagation();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      startRef.current = { sx: e.clientX, sy: e.clientY, ox: x, oy: y };
      setDragging(true);
    },
    [x, y, isEditing]
  );
    /* onPointerMove(callback: React.PointerEvent<HTMLDivElement>, dependencies: [dragging, id, moveNote])
    *  드래그 이동 중 현재 대상(id) 의 드래그 수치 값 (dx,dy)을 현재 좌표값(startRef.current.ox, oy) 에 더하여
    *  moveNote(id, x, y) store 갱신
    *
    * 2. pointermove에서 이동 처리
    * - dragging일 때만 dx, dy 계산해서 위치 업데이트
    * - ref.current로 시작 스냅샷을 읽어 최신 델타 계산
    * */
  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || isEditing) return;
      const dx = e.clientX - startRef.current.sx;
      const dy = e.clientY - startRef.current.sy;
      moveNote(id, startRef.current.ox + dx, startRef.current.oy + dy);
    },
    [dragging, id, moveNote, isEditing]
  );

    /*
     * onPointerUp(callback: React.PointerEvent<HTMLDivElement>)
     * 드래그 이동 종료 시 상태값 false, 캡처 해제
     * 1. pointerup 또는 pointercancel에서 종료 + 캡처 해제
     * - dragging 상태 false
     * - e.currentTarget.releasePointerCapture(e.pointerId)
     * - 필요 시 저장/정리 작업
     */
  const onPointerUp = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  }, [dragging]);

  // 포인터 취소
  const onPointerCancel = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      role="note"
      aria-grabbed={dragging}
      onDoubleClick={beginEdit}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'absolute',
        transform: `translate3d(${x}px, ${y}px, 0)`,
        willChange: dragging ? 'transform' : 'auto',
        width: 200,
        height: 140,
        background: color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: 10,
        padding: 12,
        cursor: isEditing ? 'text' : dragging ? 'grabbing' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }}
    >
      {/* 삭제 버튼 */}
      <button
        type="button"
        aria-label="노트 삭제"
        title="삭제"
        onPointerDown={(e) => {
          // 드래그 시작 방지
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          removeNote(id);
        }}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 28,
          height: 28,
          // borderRadius: 6,
          // border: '1px solid rgba(0,0,0,0.12)',
          // background: 'rgba(255,255,255,0.9)',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        ×
      </button>

      {/* 보기 모드 */}
      {!isEditing && (
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            color: '#111827',
            whiteSpace: 'pre-wrap',
            height: '100%',
          }}
        >
          {text}
        </div>
      )}

      {/* 편집 모드 */}
      {isEditing && (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              cancelEdit();
              return;
            }
            // Cmd(맥)/Ctrl(윈) + Enter → 저장
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              saveEdit();
            }
          }}
          aria-label="노트 텍스트 편집"
          style={{
            position: 'absolute',
            inset: 8,
            resize: 'none',
            outline: '2px solid rgba(59,130,246,0.5)',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            padding: 8,
            fontSize: 14,
            lineHeight: 1.4,
            color: '#111827',
            background: 'rgba(255,255,255,0.95)',
          }}
        />
      )}
    </div>
  );
}
