'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProjectThumbnailProps {
  src: string | null;
  alt: string;
  fallbackText: string;
  className?: string;
  priority?: boolean;
}

export default function ProjectThumbnail({
  src,
  alt,
  fallbackText,
  className,
  priority,
}: ProjectThumbnailProps) {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(src);

  // src prop이 변경되면 상태 초기화
  useEffect(() => {
    setCurrentSrc(src);
    setError(false);
  }, [src]);

  if (!currentSrc || error) {
    return (
      <div
        className={`w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold ${className ? '' : 'text-4xl'}`}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${className || ''}`}
      unoptimized
      priority={priority}
      onError={() => setError(true)}
    />
  );
}
