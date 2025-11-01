'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">내 정보</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">기본 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">이메일</label>
                <p className="text-gray-900">{user.authorEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">닉네임</label>
                <p className="text-gray-900">{user.nName || '설정되지 않음'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">휴대폰 번호</label>
                <p className="text-gray-900">{user.mblNo || '설정되지 않음'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">회원 타입</label>
                <p className="text-gray-900">{user.memberType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">가입일</label>
                <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">활동 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">사용자 ID</label>
                <p className="text-gray-900">{user.uid}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">마지막 로그인</label>
                <p className="text-gray-900">{new Date().toLocaleDateString('ko-KR')}</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/projects')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  내 프로젝트 보기
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">계정 설정</h2>
          <div className="space-y-3">
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              비밀번호 변경
            </button>
            <br />
            <button className="text-red-600 hover:text-red-800 text-sm">
              계정 탈퇴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

