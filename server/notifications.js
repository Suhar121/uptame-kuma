import { getSettingsFromDb, saveSettingsToDb } from './db.js';

export function getSettings() {
  try {
    const s = getSettingsFromDb();
    if (s && Object.keys(s).length > 0) {
      return s;
    }
  } catch (e) {
    console.error('Failed to read settings from DB:', e);
  }
  return {
    telegram: {
      enabled: false,
      botToken: '',
      chatId: ''
    }
  };
}

export function saveSettings(settings) {
  try {
    saveSettingsToDb(settings);
  } catch (e) {
    console.error('Failed to save settings to DB:', e);
  }
}

export async function sendTelegramNotification({ botToken, chatId, text }) {
  if (!botToken || !chatId) {
    throw new Error('Telegram Bot Token and Chat ID are required.');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    })
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || 'Failed to send Telegram message');
  }
  return data;
}

export async function triggerAlert(monitor, newStatus, previousStatus, details) {
  // Check if Telegram alert is disabled for this specific monitor
  if (monitor.telegramEnabled === false) {
    console.log(`Telegram notification skipped for [${monitor.name}] (disabled per monitor)`);
    return;
  }

  const settings = getSettings();
  if (!settings.telegram || !settings.telegram.enabled) return;

  const botToken = monitor.telegramBotToken || settings.telegram.botToken;
  // Use monitor's specific Chat ID if configured, otherwise fall back to global Chat ID
  const chatId = monitor.telegramChatId || settings.telegram.chatId;

  if (!botToken || !chatId) return;

  const isDown = newStatus === 'down';
  const icon = isDown ? '🔴' : '🟢';
  const statusText = isDown ? 'DOWN' : 'UP';
  const targetText = monitor.url || monitor.target || monitor.type;

  const message = `
<b>${icon} [${monitor.name}] is ${statusText}</b>

<b>Service:</b> ${monitor.tag || monitor.name}
<b>Target:</b> <code>${targetText}</code>
<b>Time:</b> ${new Date().toLocaleString()}
${details ? `<b>Details:</b> <i>${details}</i>` : ''}
`.trim();

  try {
    await sendTelegramNotification({ botToken, chatId, text: message });
    console.log(`Telegram alert sent for [${monitor.name}] to chat ${chatId} (${statusText})`);
  } catch (err) {
    console.error('Failed to send Telegram alert:', err.message);
  }
}
