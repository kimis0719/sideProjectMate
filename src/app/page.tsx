'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IProject } from '@/lib/models/Project';

interface PopulatedProject extends Omit<IProject, 'tags'> {
  tags: { _id: string; name: string; category: string }[];
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [projects, setProjects] = useState<PopulatedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    sortBy: 'latest',
  });

  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        if (data.success) {
          setProjects(data.data.slice(0, 8));
        } else {
          throw new Error(data.message || '프로젝트를 불러오는데 실패했습니다.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const banners = [
    { id: 1, title: '함께 만드는\n즐거운 사이드 프로젝트', description: '디자이너, 기획자, 개발자를 위한 프로젝트 매칭 플랫폼', bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100' },
    { id: 2, title: '당신의 아이디어를\n현실로 만들어보세요', description: '열정 넘치는 팀원들과 함께 성장하세요', bgColor: 'bg-gradient-to-r from-blue-100 to-cyan-100' },
    { id: 3, title: '새로운 협업의 시작\nSide Project Mate', description: '지금 바로 프로젝트를 시작해보세요', bgColor: 'bg-gradient-to-r from-green-100 to-teal-100' },
  ];

  const handlePrevSlide = () => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const handleNextSlide = () => setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (filters.category !== 'all') params.append('category', filters.category);
    if (filters.status !== 'all') params.append('status', filters.status);
    if (filters.sortBy !== 'latest') params.append('sortBy', filters.sortBy);
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <div className="bg-white">
      {/* 이미지 배너 영역 */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <div className="flex transition-transform duration-500 ease-in-out h-full" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {banners.map((banner) => (
            <div key={banner.id} className={`min-w-full h-full flex items-center justify-center ${banner.bgColor}`}>
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 whitespace-pre-line">{banner.title}</h2>
                <p className="text-lg md:text-xl text-gray-700 mb-8">{banner.description}</p>
                <Link href="/register" className="inline-block px-8 py-3 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors">지금 시작하기</Link>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handlePrevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"><svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
        <button onClick={handleNextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"><svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? 'bg-gray-800 w-8' : 'bg-white/60'}`} />
          ))}
        </div>
      </section>

      {/* 검색 및 필터링 영역 */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <div className="relative">
                <input type="text" placeholder="프로젝트를 검색하세요" className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
              <select name="category" value={filters.category} onChange={handleFilterChange} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
                <option value="all">전체 카테고리</option> <option value="디자인">디자인</option> <option value="개발">개발</option> <option value="게임">게임</option> <option value="데이터">데이터</option> <option value="AI">AI</option>
              </select>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
                <option value="all">전체 상태</option> <option value="recruiting">모집중</option> <option value="completed">완료</option>
              </select>
              <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
                <option value="latest">최신순</option> <option value="deadline">마감임박순</option>
              </select>
              <button type="submit" className="px-6 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors">검색</button>
            </div>
          </form>
        </div>
      </section>

      {/* 추천 프로젝트 목록 */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">추천 프로젝트</h2>
          <Link href="/projects" className="text-sm font-medium text-gray-700 hover:text-gray-900">전체보기 →</Link>
        </div>
        {isLoading ? <div className="text-center">로딩 중...</div> : error ? <div className="text-center text-red-500">{error}</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link key={project.pid} href={`/projects/${project.pid}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {project.images && project.images.length > 0 ? <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover" /> : <span className="text-6xl">🚀</span>}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">{project.category}</span>
                    <span className="text-xs text-gray-500">{project.members.current}/{project.members.max}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">{project.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tags.map((tag) => <span key={tag._id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">#{tag.name}</span>)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>{project.author}</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          <Link href="/projects" className="px-12 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200">더 많은 프로젝트 보기</Link>
        </div>
      </section>
    </div>
  );
}
