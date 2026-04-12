interface DiscordEmbed {
  title: string;
  description: string;
  color: number; // decimal color
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export async function sendDiscordAlert(embed: DiscordEmbed): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[Discord] DISCORD_WEBHOOK_URL 환경변수가 설정되지 않았습니다.');
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{ ...embed, timestamp: embed.timestamp ?? new Date().toISOString() }],
      }),
    });

    if (!res.ok) {
      console.error(`[Discord] Webhook 전송 실패: ${res.status} ${res.statusText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Discord] Webhook 전송 오류:', err);
    return false;
  }
}
