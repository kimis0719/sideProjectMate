import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

interface GeminiModel {
  name: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
}

// GET /api/admin/ai-settings/models?provider=gemini — 사용 가능한 모델 목록
async function handleGet(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || 'gemini';

  try {
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { success: false, message: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
          { status: 500 }
        );
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { cache: 'no-store' }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, message: body?.error?.message || `Gemini API 오류 (${res.status})` },
          { status: res.status }
        );
      }

      const data = await res.json();
      const models = (data.models as GeminiModel[])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => ({
          id: m.name.replace('models/', ''),
          name: m.displayName,
          description: m.description,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return NextResponse.json({ success: true, data: models });
    }

    // 다른 provider는 아직 미지원
    return NextResponse.json({
      success: true,
      data: [],
      message: `${provider} 모델 목록 자동 조회는 아직 지원하지 않습니다.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: `모델 목록 조회 실패: ${message}` },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/ai-settings/models');
