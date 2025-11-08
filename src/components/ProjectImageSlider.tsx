'use client';

import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

interface ProjectImageSliderProps {
  images: string[];
  title: string;
}

export default function ProjectImageSlider({ images, title }: ProjectImageSliderProps) {
  const settings = {
    dots: true,
    infinite: false, // 복제 버그를 방지하기 위해 false로 유지
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true, // 자동 넘김은 다시 활성화
    autoplaySpeed: 3000,
  };

  return (
    <div className="mb-8">
      <Slider {...settings}>
        {images.map((image, index) => (
          <div key={index} className="aspect-video bg-gray-100 rounded-lg">
            <img src={image} alt={`${title} 이미지 ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
          </div>
        ))}
      </Slider>
    </div>
  );
}
