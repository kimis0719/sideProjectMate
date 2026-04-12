import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AiSettings from '@/lib/models/AiSettings';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/ai-settings — 현재 AI 설정 조회
async function handleGet() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const settings = await AiSettings.findOne().lean();
    return NextResponse.json({ success: true, data: settings || {} });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: 'AI 설정을 불러오는 중 오류가 발생했습니다.', error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/ai-settings — AI 설정 변경
async function handlePatch(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();

    // 허용 필드만 추출
    const allowedFields = [
      'provider',
      'modelName',
      'modelPriority',
      'enabled',
      'cooldownMinutes',
      'dailyLimitPerProject',
      'systemPromptTemplate',
      'contextIncludeOverview',
      'contextIncludeResources',
      'contextIncludeMembers',
      'contextIncludeDeadline',
      'defaultPresets',
      'usageAlertThresholds',
      'dailyRequestLimit',
      'dailyTokenLimit',
      'autoDisableOnLimit',
    ] as const;

    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: '변경할 필드가 없습니다.' },
        { status: 400 }
      );
    }

    // provider 유효성 검사
    if (update.provider && !['gemini', 'anthropic', 'openai'].includes(update.provider as string)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 provider입니다.' },
        { status: 400 }
      );
    }

    update.updatedBy = session!.user._id;

    const settings = await AiSettings.getInstance();
    Object.assign(settings, update);
    await settings.save();

    return NextResponse.json({ success: true, data: settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: 'AI 설정 변경 중 오류가 발생했습니다.', error: message },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/ai-settings');
export const PATCH = withApiLogging(handlePatch, '/api/admin/ai-settings');
