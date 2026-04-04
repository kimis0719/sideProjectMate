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
    <div className="flex items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-100 px-2 py-1 select-none">
      <button
        onClick={handleZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
        title="Zoom Out (-)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <div className="px-2 min-w-[52px] text-center text-[13px] font-bold text-zinc-500 tabular-nums">
        {Math.round(zoom * 100)}%
      </div>

      <button
        onClick={handleZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
        title="Zoom In (+)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <div className="w-px h-5 bg-zinc-200 mx-1"></div>

      <button
        onClick={onFit}
        className="px-3 h-8 flex items-center justify-center rounded-xl hover:bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-widest transition-colors"
        title="Fit to Content (Shift + 1)"
      >
        FIT
      </button>
    </div>
  );
};

export default ZoomController;
