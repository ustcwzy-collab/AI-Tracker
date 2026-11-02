import { normalizeChatGPTUsage } from './chatgpt-details.mjs';

// The page only reports quota metadata; never retain account or conversation data.
export function installChatGPTCapture(chrome, saveSnapshot) {
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== 'CHATGPT_QUOTA_CAPTURE') return;
    let allowed = false;
    try {
      const url = new URL(sender?.url ?? '');
      allowed = sender?.id === chrome.runtime.id && sender?.tab?.id != null &&
        (sender.frameId == null || sender.frameId === 0) &&
        ['https://chatgpt.com', 'https://chat.openai.com'].includes(url.origin);
    } catch {}
    if (!allowed) { respond({ok:false}); return; }
    const data = message.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) { respond({ok:false}); return; }
    const safe = {};
    for (const key of ['model_limits', 'blocked_features', 'limits_progress']) {
      if (Array.isArray(data[key])) safe[key] = data[key].slice(0, 100);
    }
    const usage = normalizeChatGPTUsage(safe, chrome.i18n.getUILanguage());
    if (!usage) { respond({ok:false}); return; }
    const snapshot = {...usage, lastUpdated:Date.now(), status:'ok'};
    Promise.resolve().then(() => saveSnapshot(snapshot))
      .then(() => respond({ok:true})).catch(() => respond({ok:false}));
    return true;
  });
}
