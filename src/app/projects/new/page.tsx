'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ITechStack } from '@/lib/models/TechStack';
import Image from 'next/image';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    title: '',
    category: 'DEVELOPMENT', // 기본값은 코드로 설정 (나중에 API 로드 후 변경 가능)
    content: '',
    members: [{ role: '프론트엔드', current: 0, max: 1 }],
    deadline: '',
    selectedTags: new Set<string>(),
  });

  const [images, setImages] = useState<{ id: string; url: string; file: File }[]>([]);
  const [techStacks, setTechStacks] = useState<ITechStack[]>([]);
  const [categories, setCategories] = useState<{ code: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeImage = images.find(img => img.id === activeId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // --- SortableImage 컴포넌트들을 페이지 컴포넌트 내부에 정의 ---
  const SortableImage = ({ id, url }: { id: string; url: string; }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative w-32 h-32 touch-none select-none">
        <Image src={url} alt="업로드 이미지" fill className="rounded-lg object-cover" draggable={false} />
        <button
          type="button"
          onPointerDown={(e) => { e.stopPropagation(); handleRemoveImage(id); }}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none z-10 cursor-pointer"
        >
          X
        </button>
      </div>
    );
  };

  const Item = ({ url }: { url: string }) => {
    return (
      <div className="relative w-32 h-32 shadow-2xl rounded-lg">
        <Image src={url} alt="드래그 중인 이미지" fill className="rounded-lg object-cover" draggable={false} />
      </div>
    );
  };
  // --- 여기까지 내부 컴포넌트 정의 ---

  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        const res = await fetch('/api/tech-stacks');
        const data = await res.json();
        if (data.success) setTechStacks(data.data);
      } catch (e) { console.error('기술 스택 로딩 실패', e); }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/common-codes?group=CATEGORY');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
          // 카테고리 로드 후 첫 번째 값으로 기본값 설정
          if (data.data.length > 0) {
            // 기존 formData.category가 유효한 코드가 아닐 수 있으므로 첫 번째 코드로 설정
            // 단, 사용자가 이미 선택했을 수도 있으니 초기 로드 시에만 적용하는게 좋지만,
            // 여기서는 단순하게 첫 번째 값으로 덮어씌움 (초기화 시점)
            setFormData(prev => ({ ...prev, category: data.data[0].code }));
          }
        }
      } catch (e) { console.error('카테고리 로딩 실패', e); }
    };

    fetchTechStacks();
    fetchCategories();
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newMembers = [...formData.members];
    newMembers[index] = { ...newMembers[index], [name]: name === 'max' ? Number(value) : value };
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addMemberRole = () => setFormData(prev => ({ ...prev, members: [...prev.members, { role: '', current: 0, max: 1 }] }));
  const removeMemberRole = (index: number) => setFormData(prev => ({ ...prev, members: formData.members.filter((_, i) => i !== index) }));
  const handleTagChange = (tagId: string) => {
    setFormData(prev => {
      const newSelectedTags = new Set(prev.selectedTags);
      if (newSelectedTags.has(tagId)) newSelectedTags.delete(tagId);
      else newSelectedTags.add(tagId);
      return { ...prev, selectedTags: newSelectedTags };
    });
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newImageObjects = newFiles.map(file => ({
        id: self.crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file: file,
      }));
      setImages(prev => [...prev, ...newImageObjects]);
    }
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImages(prev => prev.filter(image => image.id !== idToRemove));
  };

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string); }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      setImages(arrayMove(images, oldIndex, newIndex));
    }
    setActiveId(null);
  }
  function handleDragCancel() { setActiveId(null); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const uploadedImageUrls = [];
      if (images.length > 0) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'side-project-mate';
        if (!cloudName) throw new Error('Cloudinary 설정이 필요합니다.');

        for (const img of images) {
          const formData = new FormData();
          formData.append('file', img.file);
          formData.append('upload_preset', uploadPreset);
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
          if (!uploadRes.ok) throw new Error('이미지 업로드에 실패했습니다.');
          const uploadData = await uploadRes.json();
          uploadedImageUrls.push(uploadData.secure_url);
        }
      }

      const projectData = { ...formData, tags: Array.from(formData.selectedTags), images: uploadedImageUrls };
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
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">새 프로젝트 만들기</h1>
          <p className="text-muted-foreground mt-2">당신의 아이디어를 현실로 만들어보세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-bold mb-1 text-foreground">프로젝트 제목</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-bold mb-1 text-foreground">카테고리</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground">
              {categories.map((cat) => (
                <option key={cat.code} value={cat.code}>{cat.label}</option>
              ))}
              {categories.length === 0 && <option value="DEVELOPMENT">개발</option>}
            </select>
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-bold mb-1 text-foreground">상세 설명</label>
            <textarea id="content" name="content" rows={10} value={formData.content} onChange={handleChange} required className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">모집 인원</label>
            <div className="space-y-4">
              {formData.members.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="text" name="role" value={member.role} onChange={(e) => handleMemberChange(index, e)} placeholder="역할" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground" />
                  <input type="number" name="max" value={member.max} onChange={(e) => handleMemberChange(index, e)} min="1" className="w-24 px-3 py-2 border border-input rounded-lg bg-background text-foreground" />
                  <button type="button" onClick={() => removeMemberRole(index)} className="text-red-500">삭제</button>
                </div>
              ))}
              <button type="button" onClick={addMemberRole} className="text-sm text-muted-foreground hover:text-foreground">+ 역할 추가</button>
            </div>
          </div>
          <div>
            <label htmlFor="deadline" className="block text-sm font-bold mb-1 text-foreground">모집 마감일</label>
            <input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">기술 스택</label>
            <div className="space-y-4">
              {Object.entries(groupedTechStacks).map(([category, stacks]) => (
                <div key={category}>
                  <h4 className="font-semibold capitalize mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {stacks.map(stack => (
                      <label key={String(stack._id)} className={`cursor-pointer px-3 py-1.5 border rounded-full text-sm ${formData.selectedTags.has(String(stack._id)) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground'}`}>
                        <input type="checkbox" checked={formData.selectedTags.has(String(stack._id))} onChange={() => handleTagChange(String(stack._id))} className="sr-only" />
                        {stack.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">프로젝트 이미지 (드래그해서 순서 변경)</label>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
              <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
                <div className="flex flex-wrap gap-4 mb-4">
                  {images.map(({ id, url }) => (
                    <SortableImage key={id} id={id} url={url} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId && activeImage ? <Item url={activeImage.url} /> : null}
              </DragOverlay>
            </DndContext>
            <div className="flex items-center justify-center w-full mt-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-sm text-muted-foreground"><span className="font-semibold">클릭하여 이미지 추가</span></p>
                </div>
                <input type="file" multiple className="hidden" onChange={handleNewImageChange} accept="image/*" />
              </label>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="text-right">
            <button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg hover:bg-primary/90">
              {isLoading ? '생성 중...' : '프로젝트 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
