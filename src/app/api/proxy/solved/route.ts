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
        // Solved.ac API 호출 (병렬 처리)
        const [userRes, statsRes] = await Promise.all([
            fetch(`https://solved.ac/api/v3/user/show?handle=${handle}`, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'SideProjectMate/1.0' },
            }),
            fetch(`https://solved.ac/api/v3/user/problem_stats?handle=${handle}`, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'SideProjectMate/1.0' },
            })
        ]);

        if (!userRes.ok) {
            if (userRes.status === 404) {
                return NextResponse.json({ error: '존재하지 않는 사용자입니다.' }, { status: 404 });
            }
            throw new Error(`Solved.ac User API Error: ${userRes.status}`);
        }

        const userData = await userRes.json();
        const statsData = statsRes.ok ? await statsRes.json() : [];

        // 클라이언트에 필요한 데이터만 정제해서 반환
        return NextResponse.json({
            handle: userData.handle,
            tier: userData.tier,
            solvedCount: userData.solvedCount,
            rating: userData.rating,
            rank: userData.rank,
            class: userData.class,
            exp: userData.exp,
            maxStreak: userData.maxStreak,
            // 추가 데이터: 문제 레벨별 분포
            problemStats: statsData
        });

    } catch (error) {
        console.error('Solved.ac Proxy Error:', error);
        return NextResponse.json(
            { error: 'Solved.ac 정보를 가져오는 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
