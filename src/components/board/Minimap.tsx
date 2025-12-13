'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Note, Section } from '@/store/boardStore';

interface MinimapProps {
    notes: Note[];
    sections: Section[];
    pan: { x: number; y: number };
    zoom: number;
    containerWidth: number;
    containerHeight: number;
    setPan: (x: number, y: number) => void;
}

const MINIMAP_SIZE = 200; // 미니맵의 최대 크기 (width or height)
const PADDING = 1000; // 미니맵에 표시할 여백 (World Coordinate 기준)

export default function Minimap({
    notes,
    sections,
    pan,
    zoom,
    containerWidth,
    containerHeight,
    setPan,
}: MinimapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 1. 전체 콘텐츠의 Bounding Box 계산
    const getBounds = () => {
        if (notes.length === 0 && sections.length === 0) {
            return { minX: 0, minY: 0, maxX: 2000, maxY: 1500, width: 2000, height: 1500 }; // 기본 범위
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // 노트 범위
        notes.forEach((n) => {
            const nW = n.width || 200;
            const nH = n.height || 140;
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + nW); // Note Width
            maxY = Math.max(maxY, n.y + nH); // Note Height
        });

        // 섹션 범위
        sections.forEach((s) => {
            minX = Math.min(minX, s.x);
            minY = Math.min(minY, s.y);
            maxX = Math.max(maxX, s.x + s.width);
            maxY = Math.max(maxY, s.y + s.height);
        });

        // 여백 추가
        minX -= PADDING;
        minY -= PADDING;
        maxX += PADDING;
        maxY += PADDING;

        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    };

    // 2. 렌더링 로직
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bounds = getBounds();

        // Aspect Ratio 유지하며 캔버스 크기 설정
        const aspectRatio = bounds.width / bounds.height;
        let canvasWidth = MINIMAP_SIZE;
        let canvasHeight = MINIMAP_SIZE;

        if (aspectRatio > 1) {
            canvasHeight = MINIMAP_SIZE / aspectRatio;
        } else {
            canvasWidth = MINIMAP_SIZE * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Scale 계산
        const scaleX = canvasWidth / bounds.width;
        const scaleY = canvasHeight / bounds.height;
        const scale = Math.min(scaleX, scaleY);

        // 그리기 시작
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 배경
        ctx.fillStyle = '#f3f4f6'; // gray-100
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 좌표 변환 헬퍼
        const toMini = (x: number, y: number) => ({
            x: (x - bounds.minX) * scale,
            y: (y - bounds.minY) * scale,
        });

        // 섹션 그리기
        sections.forEach((s) => {
            const pos = toMini(s.x, s.y);
            const sectionColor = s.color || '#9CA3AF'; // Default color
            ctx.fillStyle = sectionColor + '40'; // 투명도 추가
            ctx.fillRect(pos.x, pos.y, s.width * scale, s.height * scale);
            ctx.strokeStyle = sectionColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(pos.x, pos.y, s.width * scale, s.height * scale);
        });

        // 노트 그리기
        notes.forEach((n) => {
            const nW = n.width || 200;
            const nH = n.height || 140;
            const pos = toMini(n.x, n.y);
            ctx.fillStyle = n.color;
            ctx.fillRect(pos.x, pos.y, nW * scale, nH * scale);
        });

        // 뷰포트 프레임 그리기
        // Viewport Center = (-pan.x + containerWidth/2) / zoom
        // Viewport TopLeft in World = (-pan.x / zoom, -pan.y / zoom)
        const viewportWorldX = -pan.x / zoom;
        const viewportWorldY = -pan.y / zoom;
        const viewportWorldW = containerWidth / zoom;
        const viewportWorldH = containerHeight / zoom;

        const vpPos = toMini(viewportWorldX, viewportWorldY);

        ctx.strokeStyle = '#ef4444'; // red-500
        ctx.lineWidth = 2;
        ctx.strokeRect(vpPos.x, vpPos.y, viewportWorldW * scale, viewportWorldH * scale);

    }, [notes, sections, pan, zoom, containerWidth, containerHeight]);


    const isDragging = useRef(false);

    // 3. 인터랙션 핸들러
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        handleMove(e); // 클릭 시 즉시 이동
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging.current) return;
        handleMove(e);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleMove = (e: React.PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const bounds = getBounds();

        // 캔버스 크기 재계산 (useEffect와 동일한 로직)
        const aspectRatio = bounds.width / bounds.height;
        let canvasWidth = MINIMAP_SIZE;
        let canvasHeight = MINIMAP_SIZE;
        if (aspectRatio > 1) {
            canvasHeight = MINIMAP_SIZE / aspectRatio;
        } else {
            canvasWidth = MINIMAP_SIZE * aspectRatio;
        }
        const scale = Math.min(canvasWidth / bounds.width, canvasHeight / bounds.height);

        // Mini -> World 변환
        // clickX = (worldX - bounds.minX) * scale
        // worldX = clickX / scale + bounds.minX
        const targetWorldX = clickX / scale + bounds.minX;
        const targetWorldY = clickY / scale + bounds.minY;

        // 뷰포트의 중앙을 클릭한 지점으로 이동
        // targetWorldX = (-pan.x + containerWidth/2) / zoom
        // -pan.x = targetWorldX * zoom - containerWidth/2
        // pan.x = -(targetWorldX * zoom - containerWidth/2)

        // 클릭한 위치가 뷰포트의 중심이 되도록 pan 설정
        const newPanX = -(targetWorldX * zoom - containerWidth / 2);
        const newPanY = -(targetWorldY * zoom - containerHeight / 2);

        setPan(newPanX, newPanY);
    };

    return (
        <canvas
            ref={canvasRef}
            className="border border-gray-300 bg-white shadow-lg rounded-lg cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
        />
    );
}
