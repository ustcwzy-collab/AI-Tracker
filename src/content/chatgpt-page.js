// Observe quota metadata from ChatGPT's normal startup requests. Never send a request.
(() => {
  const origin = location.origin;
  if (!['https://chatgpt.com', 'https://chat.openai.com'].includes(origin)) return;
  const hook = Symbol.for('ai-usage-tracker.chatgpt-quota-fetch.v1');
  if (window[hook] || typeof window.fetch !== 'function') return;
  const messageType = 'AI_USAGE_CHATGPT_QUOTA_V1';
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
  const matches = value => {
    try {
      const url = new URL(value, origin);
      return url.origin === origin && url.pathname === '/backend-api/conversation/init';
    } catch { return false; }
  };
  const originalFetch = window.fetch;
  const wrappedFetch = function (...args) {
    // Preserve the original promise, response identity, arguments and rejection behavior.
    const result = Reflect.apply(originalFetch, this, args);
    try {
      const input = args[0];
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
      if (typeof url !== 'string' || !matches(url)) return result;
      Promise.resolve(result).then(async response => {
        try {
          if (response?.ok !== true || (response.url && !matches(response.url))) return;
          const data = sanitize(await response.clone().json());
          if (data) window.postMessage({ type: messageType, data }, origin);
        } catch { /* A failed or non-JSON response must not affect ChatGPT. */ }
      }, () => {});
    } catch { /* Observation must never change fetch behavior. */ }
    return result;
  };
  window.fetch = wrappedFetch;
  Object.defineProperty(window, hook, { value: true });
})();
