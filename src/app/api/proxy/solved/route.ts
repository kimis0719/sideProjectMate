import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const handle = searchParams.get('handle');

    if (!handle) {
        return NextResponse.json(
            { error: 'Solved.ac 사용자 핸들이 필요합니다.' },
            { status: 400 }
        );
    }

    try {
        // Solved.ac API 호출 (서버 전용)
        const response = await fetch(`https://solved.ac/api/v3/user/show?handle=${handle}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SideProjectMate/1.0', // 매너 있는 봇 사용을 위한 User-Agent 설정
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { error: '존재하지 않는 사용자입니다.' },
                    { status: 404 }
                );
            }
            throw new Error(`Solved.ac API Error: ${response.status}`);
        }

        const data = await response.json();

        // 클라이언트에 필요한 데이터만 정제해서 반환
        return NextResponse.json({
            handle: data.handle,
            tier: data.tier,
            solvedCount: data.solvedCount,
            rating: data.rating,
            rank: data.rank,
            class: data.class,
            exp: data.exp,
            maxStreak: data.maxStreak,
        });

    } catch (error) {
        console.error('Solved.ac Proxy Error:', error);
        return NextResponse.json(
            { error: 'Solved.ac 정보를 가져오는 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
