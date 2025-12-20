import { NextRequest, NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

/**
 * @description
 * 오픈 그래프(Open Graph) 메타데이터를 가져오는 API 라우트입니다.
 * 
 * [교육적 목적의 설명]
 * 프론트엔드(브라우저)에서 직접 네이버나 유튜브 같은 외부 URL로 요청을 보내면 
 * 브라우저 보안 정책인 CORS(Cross-Origin Resource Sharing) 에러가 발생합니다.
 * 
 * 이를 해결하기 위해 Next.js 서버(Backend)가 대신 요청을 보내고(Proxy), 
 * 그 결과를 프론트엔드에 전달해주는 방식을 사용합니다.
 */
export async function GET(req: NextRequest) {
    // 1. URL 쿼리 파라미터에서 target url 가져오기
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    // 유효성 검사: URL이 없으면 400 에러 반환
    if (!targetUrl) {
        return NextResponse.json({ error: 'URL 주소가 필요합니다.' }, { status: 400 });
    }

    try {
        /**
         * open-graph-scraper 라이브러리를 사용하여 메타데이터 추출
         * 
         * @param options
         * - url: 스크래핑할 대상 주소
         * - timeout: 무한 대기를 방지하기 위해 5초(5000ms) 제한 설정 (네트워크 지연 대비)
         */
        const { result, error } = await ogs({
            url: targetUrl,
            timeout: 5000,
        });

        if (error) {
            console.error('OGS Error:', result);
            throw new Error('오픈 그래프 정보를 가져오는데 실패했습니다.');
        }

        /**
         * [데이터 정규화]
         * 클라이언트가 사용하기 편하도록 필요한 데이터만 골라서 반환합니다.
         * ogImage는 배열일 수도 있고 객체일 수도 있어서 안전하게 첫 번째 이미지를 선택합니다.
         */
        const responseData = {
            title: result.ogTitle || result.twitterTitle || '',
            description: result.ogDescription || result.twitterDescription || '',
            image: result.ogImage?.[0]?.url || result.ogImage?.[0]?.url || null, // 배열 처리
            url: result.ogUrl || targetUrl,
            siteName: result.ogSiteName || '',
        };

        // 성공적으로 파싱된 데이터 반환 (Status 200)
        return NextResponse.json(responseData);

    } catch (err: any) {
        console.error('API Error:', err.message);

        // 실패하더라도 클라이언트가 깨지지 않도록 적절한 에러 메시지 반환
        return NextResponse.json(
            { error: '메타 데이터를 가져올 수 없습니다.', details: err.message },
            { status: 500 }
        );
    }
}
