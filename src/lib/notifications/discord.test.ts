import { describe, it, expect, beforeEach, vi } from 'vitest';

// fetch mock
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { sendDiscordAlert } from './discord';

const EMBED = {
  title: 'Test Alert',
  description: 'Test description',
  color: 0x3498db,
};

describe('sendDiscordAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  it('DISCORD_WEBHOOK_URL 미설정 시 false를 반환한다', async () => {
    const result = await sendDiscordAlert(EMBED);
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('Webhook URL이 설정되어 있으면 fetch를 호출한다', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
    mockFetch.mockResolvedValue({ ok: true });

    const result = await sendDiscordAlert(EMBED);
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://discord.com/api/webhooks/test');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.embeds).toHaveLength(1);
    expect(body.embeds[0].title).toBe('Test Alert');
    expect(body.embeds[0].timestamp).toBeDefined();
  });

  it('fetch 실패 시 false를 반환한다', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
    mockFetch.mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request' });

    const result = await sendDiscordAlert(EMBED);
    expect(result).toBe(false);
  });

  it('네트워크 오류 시 false를 반환한다', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
    mockFetch.mockRejectedValue(new Error('network error'));

    const result = await sendDiscordAlert(EMBED);
    expect(result).toBe(false);
  });
});
