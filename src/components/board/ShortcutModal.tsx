import React from 'react';

type Shortcut = {
    key: string;
    description: string;
};

const SHORTCUTS: Shortcut[] = [
    // View
    { key: 'Drag BG', description: '화면 이동 (Pan)' },
    { key: 'Mouse Wheel', description: '줌 확대/축소' },
    { key: 'Shift + 1', description: '전체 화면 맞춤 (Fit)' },

    // Selection
    { key: 'Shift + Drag', description: '다중 선택' },
    { key: 'Ctrl + A', description: '모든 노트 선택' },
    { key: 'Esc', description: '선택 해제 / 모달 닫기' },

    // Note Action
    { key: 'N', description: '새 노트 생성' },
    { key: 'Del / Backspace', description: '선택한 노트 삭제' },
    { key: 'Double Click / Enter', description: '노트 텍스트 수정' },
    { key: 'Ctrl + Enter', description: '노트 수정 (선택 시)' },
    { key: 'Ctrl + D', description: '노트 복제' },
    { key: 'Arrow Keys', description: '노트 이동 (미세)' },
    { key: 'Shift + Arrow', description: '노트 이동 (크게)' },

    // History
    { key: 'Ctrl + Z', description: '실행 취소 (Undo)' },
    { key: 'Ctrl + Shift + Z / Ctrl + Y', description: '다시 실행 (Redo)' },
];

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const ShortcutModal: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md bg-card text-card-foreground rounded-xl shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-semibold tracking-tight">단축키 가이드</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="p-2">
                    <table className="w-full text-left border-collapse">
                        <tbody>
                            {SHORTCUTS.map((shortcut, index) => (
                                <tr
                                    key={index}
                                    className="group border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                    <td className="py-3 px-6 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        {shortcut.description}
                                    </td>
                                    <td className="py-3 px-6 text-right">
                                        <kbd className="inline-flex items-center px-2 py-1 text-xs font-medium text-muted-foreground bg-muted border border-border rounded-md shadow-sm font-mono group-hover:bg-background group-hover:text-foreground group-hover:border-foreground/20 transition-colors">
                                            {shortcut.key}
                                        </kbd>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-muted/30 text-xs text-center text-muted-foreground border-t border-border">
                    단축키는 계속 추가될 예정입니다.
                </div>
            </div>
        </div>
    );
};

export default ShortcutModal;
