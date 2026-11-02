// Isolated-world quota bridge. Revalidate page messages before crossing extension boundaries.
(() => {
  const origin = location.origin;
  if (!['https://chatgpt.com', 'https://chat.openai.com'].includes(origin)) return;
  const installed = Symbol.for('ai-usage-tracker.chatgpt-quota-bridge.v1');
  if (window[installed]) return;
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' && value.trim() && value.length <= 160 && !/[\u0000-\u001f\u007f]/.test(value) ? value.trim() : undefined;
  const count = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  const reset = value => {
    if (count(value) !== undefined) return value;
    if (typeof value !== 'string' || value.length > 80 || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return undefined;
    return Number.isFinite(Date.parse(value)) ? value : undefined;
  };
  const sanitize = data => {
    if (!record(data) || data.error != null) return null;
    const schema = {
      model_limits: { model_slug: text, resets_after: reset },
      blocked_features: { name: text, limit: count, resets_after: reset },
      limits_progress: { feature_name: text, remaining: count, reset_after: reset },
    };
    if (!Object.keys(schema).some(key => Array.isArray(data[key]))) return null;
    return Object.fromEntries(Object.entries(schema).map(([key, fields]) => [key,
      Array.isArray(data[key]) ? data[key].slice(0, 100).flatMap(item => {
        if (!record(item)) return [];
        const id = Object.keys(fields)[0];
        if (fields[id](item[id]) === undefined) return [];
        const entry = {};
        for (const [field, read] of Object.entries(fields)) {
          const value = read(item[field]);
          if (value !== undefined) entry[field] = value;
        }
        return [entry];
      }) : [],
    ]));
  };
  let latest = null;
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== origin || event.data?.type !== 'AI_USAGE_CHATGPT_QUOTA_V1') return;
    const data = sanitize(event.data.data);
    if (!data) return;
    latest = data;
    try {
      const pending = chrome.runtime.sendMessage({ type: 'CHATGPT_QUOTA_CAPTURE', data });
      pending?.catch?.(() => {});
    } catch { /* Extension reloads can invalidate this content-script context. */ }
  });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || message?.type !== 'CHATGPT_GET_QUOTA') return;
    respond(latest ? { ok: true, data: latest } : { ok: false });
  });
  Object.defineProperty(window, installed, { value: true });
})();
