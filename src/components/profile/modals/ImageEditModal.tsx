'use client';

import React, { useState } from 'react';

interface ImageEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string) => Promise<void>;
    currentUrl?: string;
}

export default function ImageEditModal({ isOpen, onClose, onSave, currentUrl }: ImageEditModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file && previewUrl === currentUrl) {
            onClose();
            return;
        }

        try {
            setIsUploading(true);
            let finalUrl = previewUrl;

            // 파일이 새로 선택된 경우에만 업로드 진행
            if (file) {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'side-project-mate';

                if (!cloudName) throw new Error('Cloudinary configuration is missing');

                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error('Image upload failed');

                const data = await res.json();
                finalUrl = data.secure_url;
            }

            await onSave(finalUrl);
            onClose();
        } catch (error) {
            console.error('Upload Error:', error);
            alert('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-card w-full max-w-sm rounded-xl shadow-xl border border-gray-100 dark:border-border p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-4">프로필 이미지 변경</h3>

                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-muted shadow-inner">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}
                        </div>

                        <label className="cursor-pointer">
                            <span className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-muted dark:hover:bg-muted/80 text-sm font-medium rounded-lg transition-colors">
                                이미지 선택하기
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    업로드 중...
                                </>
                            ) : (
                                '저장하기'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
