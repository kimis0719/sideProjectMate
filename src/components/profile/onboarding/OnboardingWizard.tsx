'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CommunicationStyleSlider from '@/components/profile/CommunicationStyleSlider';
import AvailabilityScheduler from '@/components/profile/AvailabilityScheduler';
import { useSession } from 'next-auth/react';
import BlockEditor from '@/components/editor/BlockEditor';
import { useModal } from '@/hooks/useModal';

interface OnboardingWizardProps {
    initialData: any;
    onComplete: (saved?: boolean) => void;
}

export default function OnboardingWizard({ initialData, onComplete }: OnboardingWizardProps) {
    const router = useRouter();
    const { update: updateSession } = useSession();
    const { alert } = useModal();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [position, setPosition] = useState(initialData?.position || '');
    const [career, setCareer] = useState(initialData?.career || '');
    const [status, setStatus] = useState(initialData?.status || '구직중');
    const [techTags, setTechTags] = useState<string[]>(initialData?.techTags || []);
    const [introduction, setIntroduction] = useState(initialData?.introduction || '');
    const [schedule, setSchedule] = useState<any[]>(initialData?.schedule || []);
    const [preference, setPreference] = useState<number>(initialData?.preference ?? 50);
    const [personalityTags, setPersonalityTags] = useState<string[]>(initialData?.personalityTags || []);

    // Custom Input for Tech Tags
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag.length > 20) {
                await alert('입력 제한', '기술 태그는 20자 이내여야 합니다!');
                return;
            }
            if (!techTags.includes(newTag)) {
                setTechTags([...techTags, newTag]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTechTags(techTags.filter(tag => tag !== tagToRemove));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                position,
                career,
                status,
                techTags,
                introduction,
                schedule,
                preference,
                personalityTags
            };

            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('저장에 실패했습니다.');

            await updateSession(); // 세션 업데이트 (중요)
            onComplete(true); // 저장 완료 (true)
        } catch (error) {
            console.error(error);
            await alert('저장 실패', '프로필 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-border flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-muted p-6 border-b border-border text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">🚀 프로필 완성하기</h2>
                    <p className="text-muted-foreground text-sm">
                        멋진 프로젝트 참여를 위해 필수 정보를 입력해주세요. ({step}/3)
                    </p>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content Body (Scrollable) */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold text-foreground">1. 기본 정보</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">직군 (Position)</label>
                                <input
                                    type="text"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="예: 프론트엔드 개발자, UI 디자이너"
                                    className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">경력 (Career)</label>
                                <select
                                    value={career}
                                    onChange={(e) => setCareer(e.target.value)}
                                    className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                >
                                    <option value="" disabled>선택해주세요</option>
                                    <option value="신입 (0년)">신입 (0년)</option>
                                    <option value="1~3년차">1~3년차</option>
                                    <option value="4~6년차">4~6년차</option>
                                    <option value="7년차 이상">7년차 이상</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">현재 상태</label>
                                <div className="flex gap-3">
                                    {['구직중', '재직중', '팀빌딩중'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatus(s)}
                                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${status === s
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-background border-input text-muted-foreground hover:bg-muted'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold text-foreground">2. 기술 스택 및 자기소개</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">기술 태그 (Enter로 추가)</label>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder="React, TypeScript, Figma..."
                                    className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {techTags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium flex items-center gap-1">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-blue-800">×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">간단 자기소개</label>
                                <div className="border border-input rounded-lg overflow-hidden min-h-[300px]">
                                    <BlockEditor
                                        content={introduction}
                                        onChange={setIntroduction}
                                        editable={true}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold text-foreground">3. 협업 스타일</h3>

                            <div className="p-4 border border-border rounded-xl bg-background">
                                <CommunicationStyleSlider
                                    preference={preference}
                                    onChangePreference={setPreference}
                                    tags={personalityTags}
                                    onChangeTags={setPersonalityTags}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">활동 가능 시간</label>
                                <div className="border border-border rounded-xl p-4 bg-background max-h-[300px] overflow-y-auto">
                                    <AvailabilityScheduler
                                        initialSchedule={schedule}
                                        onChange={setSchedule}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2 text-center">드래그하여 시간을 선택하세요.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-border flex justify-between bg-white dark:bg-card">
                    {step > 1 ? (
                        <button
                            onClick={handlePrev}
                            className="px-6 py-2.5 text-muted-foreground hover:bg-muted rounded-lg font-medium transition-colors"
                        >
                            이전
                        </button>
                    ) : (
                        <button
                            onClick={() => onComplete(false)}
                            className="px-4 py-2.5 text-gray-400 hover:text-gray-600 font-medium text-sm underline transition-colors"
                        >
                            다음에 하기
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!position || !career} // Step 1 Validation
                            className="px-8 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            다음
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-70 flex items-center gap-2"
                        >
                            {isSubmitting ? '저장 중...' : '완료 및 시작하기 🎉'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
