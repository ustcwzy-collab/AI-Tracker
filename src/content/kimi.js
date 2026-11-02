// Query Kimi using its own current session. Credentials stay on the Kimi page.
(() => {
  if (location.origin !== 'https://www.kimi.com') return;
  const endpoints = {
    stats: '/apiv2/kimi.gateway.membership.v2.MembershipService/GetSubscriptionStats',
    legacy: '/apiv2/kimi.gateway.billing.v1.BillingService/GetUsages',
  };
  const pick = (object, keys) => {
    if (!object || typeof object !== 'object' || Array.isArray(object)) return undefined;
    return Object.fromEntries(keys.filter(key => Object.prototype.hasOwnProperty.call(object, key)).map(key => [key, object[key]]));
  };
  const detail = value => pick(value, ['used', 'limit', 'remaining', 'resetTime', 'resetAt', 'reset_time', 'reset_at']);
  const quotaOnly = (data, endpoint) => endpoint === 'stats' ? {
    ratelimitCode5h: pick(data.ratelimitCode5h, ['enabled', 'ratio', 'resetTime']),
    ratelimitCode7d: pick(data.ratelimitCode7d, ['enabled', 'ratio', 'resetTime']),
    subscriptionBalance: pick(data.subscriptionBalance, ['feature', 'type', 'amountUsedRatio', 'expireTime']),
  } : {
    usages: Array.isArray(data.usages) ? data.usages.filter(usage => usage?.scope === 'FEATURE_CODING').map(usage => ({
      scope: usage.scope,
      detail: detail(usage.detail),
      limits: Array.isArray(usage.limits) ? usage.limits.map(value => ({
        window: pick(value?.window, ['duration', 'timeUnit']),
        detail: detail(value?.detail),
      })) : [],
    })) : [],
  };
  async function query(endpoint) {
    const token = localStorage.getItem('access_token')?.trim();
    if (!token) return { ok: false };
    const response = await fetch(new URL(endpoints[endpoint], location.origin).href, {
      method: 'POST',
      credentials: 'include',
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
        'X-Language': navigator.language || 'en-US',
        'X-Msh-Platform': 'web',
        'R-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      body: JSON.stringify(endpoint === 'stats' ? {} : { scope: ['FEATURE_CODING'] }),
    });
    if (!response.ok) return { ok: false };
    const data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false };
    return { ok: true, data: quotaOnly(data, endpoint) };
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || message?.type !== 'KIMI_FETCH_USAGE' || !Object.prototype.hasOwnProperty.call(endpoints, message.endpoint)) return;
    query(message.endpoint).then(respond).catch(() => respond({ ok: false }));
    return true;
  });
})();
