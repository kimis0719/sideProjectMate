import React from 'react';
import { useBoardStore } from '@/store/boardStore';

type Props = {
    onFit: () => void;
};

const ZoomController: React.FC<Props> = ({ onFit }) => {
    const { zoom, setZoom } = useBoardStore((state) => ({
        zoom: state.zoom,
        setZoom: state.setZoom,
    }));

    const handleZoomIn = () => setZoom(Math.min(2, zoom + 0.1));
    const handleZoomOut = () => setZoom(Math.max(0.1, zoom - 0.1));

    return (
        <div className="flex items-center bg-card text-card-foreground rounded-full shadow-lg border border-border p-1 select-none animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5 dark:ring-white/10 pointer-events-none">
            <button
                onClick={handleZoomOut}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-colors pointer-events-auto"
                title="Zoom Out (-)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>

            <div className="px-3 min-w-[64px] text-center text-sm font-semibold text-foreground font-numerical tabular-nums">
                {Math.round(zoom * 100)}%
            </div>

            <button
                onClick={handleZoomIn}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-colors pointer-events-auto"
                title="Zoom In (+)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>

            <div className="w-px h-4 bg-border mx-1"></div>

            <button
                onClick={onFit}
                className="px-3 h-8 flex items-center justify-center rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors pointer-events-auto"
                title="Fit to Content (Shift + 1)"
            >
                FIT
            </button>
        </div>
    );
};

export default ZoomController;
