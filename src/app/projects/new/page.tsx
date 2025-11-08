'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ITechStack } from '@/lib/models/TechStack';

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    title: '',
    category: '개발',
    content: '',
    members: { current: 1, max: 4 },
    selectedTags: new Set<string>(),
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [techStacks, setTechStacks] = useState<ITechStack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        const res = await fetch('/api/tech-stacks');
        const data = await res.json();
        if (data.success) setTechStacks(data.data);
      } catch (e) { console.error('기술 스택 로딩 실패', e); }
    };
    fetchTechStacks();
  }, []);

  const groupedTechStacks = useMemo(() => {
    return techStacks.reduce((acc, tech) => {
      const { category } = tech;
      if (!acc[category]) acc[category] = [];
      acc[category].push(tech);
      return acc;
    }, {} as Record<string, ITechStack[]>);
  }, [techStacks]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'current' || name === 'max') {
      setFormData(prev => ({ ...prev, members: { ...prev.members, [name]: Number(value) } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagChange = (tagId: string) => {
    setFormData(prev => {
      const newSelectedTags = new Set(prev.selectedTags);
      if (newSelectedTags.has(tagId)) newSelectedTags.delete(tagId);
      else newSelectedTags.add(tagId);
      return { ...prev, selectedTags: newSelectedTags };
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. 이미지 업로드
      const uploadedImageUrls = [];
      if (selectedFiles.length > 0) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'side-project-mate';

        if (!cloudName) {
          throw new Error('Cloudinary 설정이 필요합니다. 관리자에게 문의하세요.');
        }

        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            throw new Error(errorData.error?.message || '이미지 업로드에 실패했습니다.');
          }

          const uploadData = await uploadRes.json();
          uploadedImageUrls.push(uploadData.secure_url);
        }
      }

      // 2. 프로젝트 생성 API 호출
      const projectData = {
        ...formData,
        tags: Array.from(formData.selectedTags),
        images: uploadedImageUrls,
      };

      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      const createData = await createRes.json();
      if (createData.success) {
        router.push(`/projects/${createData.data.pid}`);
      } else {
        throw new Error(createData.message || '프로젝트 생성에 실패했습니다.');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">새 프로젝트 만들기</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">당신의 아이디어를 현실로 만들어보세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 제목, 카테고리, 상세설명, 모집인원, 기술스택 UI */}
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">프로젝트 제목</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" placeholder="예: 사이드 프로젝트 팀원 모집 플랫폼" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">카테고리</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400">
              <option>개발</option> <option>디자인</option> <option>게임</option> <option>데이터</option> <option>AI</option> <option>기획</option> <option>마케팅</option>
            </select>
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">상세 설명</label>
            <textarea id="content" name="content" rows={10} value={formData.content} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" placeholder="프로젝트에 대해 자세히 설명해주세요."></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">모집 인원</label>
            <div className="flex items-center gap-4">
              <input type="number" name="current" value={formData.members.current} onChange={handleChange} min="1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="현재 인원" />
              <span className="text-gray-500 dark:text-gray-400">/</span>
              <input type="number" name="max" value={formData.members.max} onChange={handleChange} min={formData.members.current} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="최대 인원" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">기술 스택</label>
            <div className="space-y-4">
              {Object.entries(groupedTechStacks).map(([category, stacks]: [string, ITechStack[]]) => (
                <div key={category}>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 capitalize mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {stacks.map(stack => (
                      <label key={String(stack._id)} className={`cursor-pointer px-3 py-1.5 border rounded-full text-sm transition-colors ${formData.selectedTags.has(String(stack._id)) ? 'bg-gray-800 dark:bg-gray-700 text-white border-gray-800 dark:border-gray-700' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100'}`}>
                        <input type="checkbox" checked={formData.selectedTags.has(String(stack._id))} onChange={() => handleTagChange(String(stack._id))} className="sr-only" />
                        {stack.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 이미지 첨부 UI */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">프로젝트 이미지</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF</p>
                </div>
                <input type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">선택된 파일:</p>
                <ul className="list-disc list-inside">
                  {selectedFiles.map(file => <li key={file.name} className="text-sm text-gray-600 dark:text-gray-400">{file.name}</li>)}
                </ul>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

          <div className="text-right">
            <button type="submit" disabled={isLoading} className="bg-gray-900 dark:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors">
              {isLoading ? '생성 중...' : '프로젝트 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
