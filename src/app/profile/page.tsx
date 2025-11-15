'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface MyApplication {
  _id: string;
  projectId: {
    title: string;
    pid: number;
  };
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);

  const fetchMyApplications = useCallback(async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (data.success) {
        setMyApplications(data.data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('지원 내역을 불러오는 중 오류 발생', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchMyApplications();
    }
  }, [status, router, fetchMyApplications]);

  const handleCancelApplication = async (appId: string) => {
    if (confirm('정말 지원을 취소하시겠습니까?')) {
      try {
        const response = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          alert('지원서가 삭제되었습니다.');
          fetchMyApplications(); // 목록 새로고침
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">내 정보</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">기본 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">이메일</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">닉네임</label>
                <p className="text-gray-900">{user.name || '설정되지 않음'}</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">활동 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">사용자 고유 ID</label>
                <p className="text-gray-900 text-xs">{user._id}</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push(`/projects?authorId=${user._id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  내 프로젝트 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">내 지원 현황</h2>
        <div className="space-y-4">
          {myApplications.length > 0 ? (
            myApplications.map(app => (
              <div key={app._id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <Link href={`/projects/${app.projectId.pid}`} className="font-semibold text-blue-600 hover:underline">
                    {app.projectId.title}
                  </Link>
                  <p className="text-sm text-gray-600">지원 역할: {app.role}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status}
                  </span>
                  {app.status === 'pending' && (
                    <button onClick={() => handleCancelApplication(app._id)} className="text-sm text-red-500 hover:underline">
                      지원 취소
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">아직 지원한 프로젝트가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
