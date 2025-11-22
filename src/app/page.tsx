import React from 'react';
import HomeBanner from '@/components/HomeBanner';
import ProjectList from '@/components/projects/ProjectList';
import dbConnect from '@/lib/mongodb';
import CommonCode, { ICommonCode } from '@/lib/models/CommonCode';

// 공통 코드를 가져오는 헬퍼 함수 (서버 사이드)
async function getCommonCodes(group: string) {
  await dbConnect();
  // order 순으로 정렬하여 가져옴
  const codes: any[] = await CommonCode.find({ group, isActive: true }).sort('order').lean();

  // Mongoose 문서를 Plain Object로 변환 (직렬화 문제 방지)
  return codes.map(code => ({
    ...code,
    _id: code._id.toString(),
  })) as ICommonCode[];
}

// 메인 페이지 컴포넌트 (Server Component)
// 서버에서 필요한 데이터를 미리 fetch하여 클라이언트 컴포넌트에 전달
export default async function Home() {
  // 카테고리와 상태 코드를 병렬로 조회
  const [categoryCodes, statusCodes] = await Promise.all([
    getCommonCodes('CATEGORY'),
    getCommonCodes('STATUS'),
  ]);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* 배너 영역 (클라이언트 컴포넌트) */}
      <HomeBanner />

      {/* 프로젝트 목록 및 필터 영역 (클라이언트 컴포넌트) */}
      {/* 서버에서 가져온 공통 코드를 props로 전달 */}
      <ProjectList categoryCodes={categoryCodes} statusCodes={statusCodes} />
    </div>
  );
}
