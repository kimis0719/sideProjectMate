import AiUsage from '@/lib/models/AiUsage';
import AiUsageAlert from '@/lib/models/AiUsageAlert';
import AiSettings from '@/lib/models/AiSettings';
import { sendDiscordAlert } from '@/lib/notifications/discord';
import type { IUsageAlertThreshold } from '@/lib/models/AiSettings';

const LEVEL_COLORS: Record<string, number> = {
  info: 0x3498db, // 파랑
  warning: 0xf39c12, // 주황
  critical: 0xe74c3c, // 빨강
  kill: 0x8b0000, // 진한 빨강
};

const LEVEL_EMOJI: Record<string, string> = {
  info: '\u2139\uFE0F',
  warning: '\u26A0\uFE0F',
  critical: '\uD83D\uDED1',
  kill: '\uD83D\uDEAB',
};

const LEVEL_LABEL: Record<string, string> = {
  info: '알림',
  warning: '경고',
  critical: '위험',
  kill: '자동 차단',
};

interface DailyUsageStats {
  totalRequests: number;
  totalTokens: number;
}

async function getTodayUsageStats(): Promise<DailyUsageStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const result = await AiUsage.aggregate([
    { $match: { createdAt: { $gte: todayStart } } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } },
      },
    },
  ]);

  return result[0] ?? { totalRequests: 0, totalTokens: 0 };
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calcPercent(current: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.round((current / limit) * 100);
}

export async function checkUsageThreshold(): Promise<void> {
  const settings = await AiSettings.getInstance();

  const thresholds: IUsageAlertThreshold[] = settings.usageAlertThresholds ?? [];
  const dailyRequestLimit = settings.dailyRequestLimit ?? 1500;
  const dailyTokenLimit = settings.dailyTokenLimit ?? 1000000;
  const autoDisable = settings.autoDisableOnLimit ?? true;

  const stats = await getTodayUsageStats();
  const today = getTodayDateString();

  const requestPercent = calcPercent(stats.totalRequests, dailyRequestLimit);
  const tokenPercent = calcPercent(stats.totalTokens, dailyTokenLimit);
  const maxPercent = Math.max(requestPercent, tokenPercent);

  // 100% kill-switch 체크
  if (autoDisable && maxPercent >= 100) {
    const alreadySent = await AiUsageAlert.findOne({ date: today, level: 'kill' });
    if (!alreadySent) {
      // AiSettings.enabled → false
      await AiSettings.updateOne({}, { enabled: false });

      await AiUsageAlert.create({
        date: today,
        level: 'kill',
        percent: maxPercent,
        todayRequests: stats.totalRequests,
        todayTokens: stats.totalTokens,
        dailyRequestLimit,
        dailyTokenLimit,
      });

      await sendDiscordAlert({
        title: `${LEVEL_EMOJI.kill} Gemini API 자동 차단`,
        description:
          '일일 할당량 100%에 도달하여 **AI 지시서 기능이 자동 비활성화**되었습니다.\n어드민 페이지에서 수동으로 다시 활성화해야 합니다.',
        color: LEVEL_COLORS.kill,
        fields: [
          {
            name: '요청 수',
            value: `${stats.totalRequests.toLocaleString()} / ${dailyRequestLimit.toLocaleString()} (${requestPercent}%)`,
            inline: true,
          },
          {
            name: '토큰 수',
            value: `${stats.totalTokens.toLocaleString()} / ${dailyTokenLimit.toLocaleString()} (${tokenPercent}%)`,
            inline: true,
          },
          { name: '날짜', value: today, inline: true },
        ],
        footer: { text: 'Side Project Mate — AI Usage Monitor' },
      });
    }
    return;
  }

  // 임계값 알림 체크 (높은 % 부터 확인, 최고 단계만 발송)
  const sorted = [...thresholds].sort((a, b) => b.percent - a.percent);

  for (const threshold of sorted) {
    if (maxPercent >= threshold.percent) {
      const alreadySent = await AiUsageAlert.findOne({
        date: today,
        level: threshold.level,
      });
      if (alreadySent) return; // 이미 이 레벨 발송됨

      await AiUsageAlert.create({
        date: today,
        level: threshold.level,
        percent: maxPercent,
        todayRequests: stats.totalRequests,
        todayTokens: stats.totalTokens,
        dailyRequestLimit,
        dailyTokenLimit,
      });

      const emoji = LEVEL_EMOJI[threshold.level] ?? '';
      const label = LEVEL_LABEL[threshold.level] ?? threshold.level;

      await sendDiscordAlert({
        title: `${emoji} Gemini API 일일 사용량 ${label} (${threshold.percent}%)`,
        description: `일일 할당량의 **${maxPercent}%**에 도달했습니다.`,
        color: LEVEL_COLORS[threshold.level] ?? 0x95a5a6,
        fields: [
          {
            name: '요청 수',
            value: `${stats.totalRequests.toLocaleString()} / ${dailyRequestLimit.toLocaleString()} (${requestPercent}%)`,
            inline: true,
          },
          {
            name: '토큰 수',
            value: `${stats.totalTokens.toLocaleString()} / ${dailyTokenLimit.toLocaleString()} (${tokenPercent}%)`,
            inline: true,
          },
          { name: '날짜', value: today, inline: true },
        ],
        footer: { text: 'Side Project Mate — AI Usage Monitor' },
      });

      return; // 최고 단계 1회만 발송
    }
  }
}
