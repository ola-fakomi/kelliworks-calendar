export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, channelText, dmText } = req.body;

  // Support legacy { text } calls (e.g. approval notifications)
  const toChannel = channelText || text;
  const toDM = dmText || null;

  const results = [];

  // ── Channel webhook ──────────────────────────────────────────
  if (toChannel && toChannel.trim()) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).json({ error: 'SLACK_WEBHOOK_URL not configured' });
    }
    const r = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: toChannel }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Channel delivery failed' });
    results.push('channel');
  }

  // ── Kelli DM via Slack Web API ───────────────────────────────
  if (toDM && toDM.trim()) {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const kelliUserId = process.env.SLACK_KELLI_USER_ID;
    if (!botToken || !kelliUserId) {
      return res.status(500).json({ error: 'SLACK_BOT_TOKEN or SLACK_KELLI_USER_ID not configured' });
    }
    const r = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${botToken}`,
      },
      body: JSON.stringify({ channel: kelliUserId, text: toDM }),
    });
    const data = await r.json();
    if (!data.ok) return res.status(502).json({ error: 'DM delivery failed', detail: data.error });
    results.push('dm');
  }

  return res.status(200).json({ ok: true, sent: results });
}
