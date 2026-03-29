import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// POST /api/admin/ai-settings/check-connection — 모델 연결 상태 확인
export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { provider, modelName } = await request.json();

    if (!provider || !modelName) {
      return NextResponse.json(
        { success: false, message: 'provider와 modelName은 필수입니다.' },
        { status: 400 }
      );
    }

    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          success: true,
          data: { status: 'error', message: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
        });
      }

      // 최소 토큰으로 연결 테스트 (1토큰 출력 요청)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hi' }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg = body?.error?.message || `HTTP ${res.status}`;

        // 에러 종류별 사용자 친화적 메시지
        if (res.status === 429) {
          const msg = errMsg.includes('spending cap')
            ? 'API 지출 한도(spending cap) 초과. Google Cloud Console에서 한도를 확인하세요.'
            : 'API 할당량 초과. 잠시 후 다시 시도하세요.';
          return NextResponse.json({
            success: true,
            data: { status: 'rate_limited', message: msg },
          });
        }
        if (res.status === 404) {
          return NextResponse.json({
            success: true,
            data: { status: 'not_found', message: `모델 "${modelName}"을 찾을 수 없습니다.` },
          });
        }
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({
            success: true,
            data: { status: 'auth_error', message: 'API 키가 유효하지 않거나 권한이 없습니다.' },
          });
        }

        return NextResponse.json({
          success: true,
          data: { status: 'error', message: errMsg },
        });
      }

      return NextResponse.json({
        success: true,
        data: { status: 'connected', message: '연결 성공' },
      });
    }

    // 다른 provider
    return NextResponse.json({
      success: true,
      data: { status: 'unsupported', message: `${provider} 연결 테스트는 아직 지원하지 않습니다.` },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({
      success: true,
      data: { status: 'error', message },
    });
  }
}
