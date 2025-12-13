import { NextRequest, NextResponse } from 'next/server';
import { getLatestBlogPosts } from '@/lib/blog/rss';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const blogUrl = searchParams.get('url');

  // [상황 1] 블로그 연결 안 한 경우 (URL이 아예 없음)
  // 에러 내지 말고 '글 없음(빈 배열)'이라고 알려줌 -> 프론트에서 "블로그를 연결해보세요" 띄우기 좋음
  if (!blogUrl || blogUrl.trim() === '') {
    return NextResponse.json([]);
  }

  try {
    const url = new URL(blogUrl);
    let rssUrl = url.href;

    // [1] Velog 처리 (핵심 수정 부분!) 🛠️
    if (url.hostname.includes('velog.io')) {
      // 경로에서 아이디 추출 (예: /@test -> test)
      // 정규식으로 /@ 뒤에 오는 아이디만 쏙 뽑아냄
      const match = url.pathname.match(/\/@([^/]+)/);

      if (match && match[1]) {
        const username = match[1];
        // Velog의 진짜 RSS 주소 형식으로 변환 (v2 서버 사용, @ 제거)
        rssUrl = `https://v2.velog.io/rss/${username}`;
      } else {
        // 아이디가 없는 메인 페이지 등의 경우 빈 배열 반환
        console.log('Velog 아이디를 찾을 수 없습니다.');
        return NextResponse.json([]);
      }
    }
    // [2] Tistory 처리 (기존 유지)
    else if (url.hostname.includes('tistory.com')) {
      if (!url.pathname.endsWith('/rss')) {
        rssUrl = `${url.origin}/rss`;
      }
    }

    // 실제 RSS 데이터 가져오기
    const posts = await getLatestBlogPosts(rssUrl);
    return NextResponse.json(posts);

  } catch (error) {
    // [상황 3] URL은 있는데 RSS를 못 가져오는 경우 (404 등)
    // 서버 터트리지 말고 로그만 남기고 '빈 배열' 반환
    console.error(`RSS Fetch Error (${blogUrl}):`, error);
    return NextResponse.json([]);
  }
}