import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

// Discord Webhook mock
const mockSendDiscordAlert = vi.fn().mockResolvedValue(true);
vi.mock('@/lib/notifications/discord', () => ({
  sendDiscordAlert: (...args: unknown[]) => mockSendDiscordAlert(...args),
}));

import AiUsage from '@/lib/models/AiUsage';
import AiUsageAlert from '@/lib/models/AiUsageAlert';
import AiSettings from '@/lib/models/AiSettings';
import { checkUsageThreshold } from './usageMonitor';

beforeAll(async () => await setupTestDB());
afterEach(async () => {
  await clearTestDB();
  vi.clearAllMocks();
});
afterAll(async () => await teardownTestDB());

async function createSettings(overrides?: Record<string, unknown>) {
  return AiSettings.create({
    provider: 'gemini',
    modelName: 'gemini-2.5-flash',
    enabled: true,
    dailyRequestLimit: 100,
    dailyTokenLimit: 10000,
    usageAlertThresholds: [
      { percent: 50, level: 'info' },
      { percent: 80, level: 'warning' },
      { percent: 95, level: 'critical' },
    ],
    autoDisableOnLimit: true,
    ...overrides,
  });
}

async function createUsageRecords(count: number, tokensPerRecord = 100) {
  const records = Array.from({ length: count }, () => ({
    userId: new mongoose.Types.ObjectId(),
    projectId: 1,
    boardId: new mongoose.Types.ObjectId(),
    provider: 'gemini',
    modelName: 'gemini-2.5-flash',
    inputTokens: tokensPerRecord,
    outputTokens: 0,
  }));
  await AiUsage.insertMany(records);
}

describe('checkUsageThreshold', () => {
  it('사용량이 임계값 미만이면 알림을 보내지 않는다', async () => {
    await createSettings();
    await createUsageRecords(10); // 10/100 = 10%

    await checkUsageThreshold();

    expect(mockSendDiscordAlert).not.toHaveBeenCalled();
    const alerts = await AiUsageAlert.find();
    expect(alerts).toHaveLength(0);
  });

  it('50% 도달 시 info 알림을 발송한다', async () => {
    await createSettings();
    await createUsageRecords(50); // 50/100 = 50%

    await checkUsageThreshold();

    expect(mockSendDiscordAlert).toHaveBeenCalledTimes(1);
    const embed = mockSendDiscordAlert.mock.calls[0][0];
    expect(embed.title).toContain('50%');
    const alerts = await AiUsageAlert.find();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe('info');
  });

  it('80% 도달 시 warning 알림을 발송한다 (info 건너뜀)', async () => {
    await createSettings();
    await createUsageRecords(80); // 80/100 = 80%

    await checkUsageThreshold();

    expect(mockSendDiscordAlert).toHaveBeenCalledTimes(1);
    const embed = mockSendDiscordAlert.mock.calls[0][0];
    expect(embed.title).toContain('경고');
    const alerts = await AiUsageAlert.find();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe('warning');
  });

  it('같은 레벨의 알림은 중복 발송하지 않는다', async () => {
    await createSettings();
    await createUsageRecords(50);

    await checkUsageThreshold();
    await checkUsageThreshold();

    expect(mockSendDiscordAlert).toHaveBeenCalledTimes(1);
    const alerts = await AiUsageAlert.find();
    expect(alerts).toHaveLength(1);
  });

  it('100% 도달 시 kill-switch로 AiSettings.enabled를 false로 변경한다', async () => {
    await createSettings();
    await createUsageRecords(100); // 100/100 = 100%

    await checkUsageThreshold();

    expect(mockSendDiscordAlert).toHaveBeenCalledTimes(1);
    const embed = mockSendDiscordAlert.mock.calls[0][0];
    expect(embed.title).toContain('자동 차단');

    const updated = await AiSettings.findOne();
    expect(updated!.enabled).toBe(false);

    const alerts = await AiUsageAlert.find();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe('kill');
  });

  it('autoDisableOnLimit이 false이면 100% 도달해도 차단하지 않는다', async () => {
    await createSettings({ autoDisableOnLimit: false });
    await createUsageRecords(100);

    await checkUsageThreshold();

    const updated = await AiSettings.findOne();
    expect(updated!.enabled).toBe(true);

    // critical (95%) 알림이 발송됨
    const alerts = await AiUsageAlert.find();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe('critical');
  });

  it('토큰 기준으로도 임계값을 체크한다', async () => {
    await createSettings({ dailyRequestLimit: 10000, dailyTokenLimit: 1000 });
    // 5개 레코드 × 100토큰 = 500/1000 = 50%
    await createUsageRecords(5, 100);

    await checkUsageThreshold();

    expect(mockSendDiscordAlert).toHaveBeenCalledTimes(1);
    const alerts = await AiUsageAlert.find();
    expect(alerts[0].level).toBe('info');
  });
});
