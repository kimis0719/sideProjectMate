import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Side Project Mate</h1>
        <p className="text-lg mb-6">
          사이드 프로젝트를 위한 협업 플랫폼에 오신 것을 환영합니다!!!!!
        </p>
        <div className="space-x-4">
          <Link 
            href="/projects"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            프로젝트 탐색하기
          </Link>
          <Link
            href="/login"
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md transition-colors"
          >
            로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
