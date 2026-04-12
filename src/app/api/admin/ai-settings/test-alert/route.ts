import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { sendDiscordAlert } from '@/lib/notifications/discord';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// POST /api/admin/ai-settings/test-alert — Discord 테스트 알림 발송
async function handlePost() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!process.env.DISCORD_WEBHOOK_URL) {
    return NextResponse.json(
      {
        success: false,
        message:
          'DISCORD_WEBHOOK_URL 환경변수가 설정되지 않았습니다. Render Dashboard에서 추가해주세요.',
      },
      { status: 400 }
    );
  }

  const ok = await sendDiscordAlert({
    title: '✅ Discord Webhook 테스트',
    description:
      'Side Project Mate AI 사용량 알림이 정상적으로 연결되었습니다.\n이 메시지는 어드민 테스트입니다.',
    color: 0x2ecc71,
    fields: [
      { name: '상태', value: '정상 연결', inline: true },
      {
        name: '발송 시간',
        value: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        inline: true,
      },
    ],
    footer: { text: 'Side Project Mate — AI Usage Monitor' },
  });

  if (!ok) {
    return NextResponse.json(
      {
        success: false,
        message: 'Discord Webhook 전송에 실패했습니다. Webhook URL을 확인해주세요.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: '테스트 알림이 성공적으로 전송되었습니다. Discord 채널을 확인해주세요.',
  });
}

export const POST = withApiLogging(handlePost, '/api/admin/ai-settings/test-alert');
