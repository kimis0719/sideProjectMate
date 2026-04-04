'use client';

import { useState, useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ProjectThumbnail from './projects/ProjectThumbnail';

interface ProjectImageSliderProps {
  images: string[];
  title: string;
}

export default function ProjectImageSlider({ images, title }: ProjectImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const sliderRef = useRef<Slider>(null);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    beforeChange: (_: number, next: number) => setCurrent(next),
    arrows: false,
  };

  return (
    <div className="mb-8 space-y-4">
      {/* 메인 슬라이더 */}
      <div className="relative rounded-xl overflow-hidden">
        <Slider ref={sliderRef} {...settings}>
          {images.map((image, index) => (
            <div
              key={index}
              className="aspect-video bg-surface-container-low rounded-xl relative overflow-hidden group"
            >
              <ProjectThumbnail
                src={image}
                alt={`${title} 이미지 ${index + 1}`}
                fallbackText={title.charAt(0)}
                className="rounded-xl"
                priority={index === 0}
              />
            </div>
          ))}
        </Slider>

        {/* 카운터 배지 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-on-surface/60 text-surface-container-lowest text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
            {current + 1} / {images.length}
          </div>
        )}
      </div>

      {/* 썸네일 인디케이터 */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => sliderRef.current?.slickGoTo(index)}
              className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                current === index
                  ? 'ring-2 ring-primary-container opacity-100'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <ProjectThumbnail
                src={image}
                alt={`썸네일 ${index + 1}`}
                fallbackText={(index + 1).toString()}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
