'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useModal } from '@/hooks/useModal';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => Promise<void>;
  currentUrl?: string;
}

export default function ImageEditModal({
  isOpen,
  onClose,
  onSave,
  currentUrl,
}: ImageEditModalProps) {
  const { alert } = useModal();
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

      if (file) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset =
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'side-project-mate';

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
      await alert('업로드 실패', '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/20 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full max-w-[480px] rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.04)] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold font-headline text-on-surface">이미지 업로드</h2>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-8">
          {/* 프리뷰 영역 */}
          <label className="relative aspect-square bg-surface-container-low rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-outline-variant/30 cursor-pointer group">
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  sizes="480px"
                  className="object-cover"
                  unoptimized
                />
                {/* 원형 크롭 가이드 — 영역 최대 크기, 시각적 가이드만 */}
                <div className="absolute inset-0 bg-on-surface/30 pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[calc(100%-2rem)] h-[calc(100%-2rem)] border-2 border-white rounded-full shadow-[0_0_0_1000px_rgba(0,0,0,0.15)]" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-outline group-hover:text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                <span className="text-sm">클릭하여 이미지를 선택해주세요</span>
              </div>
            )}
            {!previewUrl && (
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            )}
          </label>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full bg-primary-container text-on-primary py-4 rounded-lg font-bold hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  업로드 중...
                </>
              ) : (
                '변경사항 저장'
              )}
            </button>
            {previewUrl && (
              <div className="flex gap-3">
                <label className="flex-1 py-4 text-center text-on-surface-variant font-semibold hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer">
                  다시 업로드
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    await onSave('');
                    onClose();
                  }}
                  className="flex-1 py-4 text-on-error font-semibold bg-error hover:bg-error/90 rounded-lg transition-colors active:scale-[0.98]"
                >
                  이미지 삭제
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
