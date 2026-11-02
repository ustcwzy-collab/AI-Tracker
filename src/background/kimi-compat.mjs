// Local compatibility fix for AI Usage Tracker 0.1.26.
// Kimi membership v2 reports ratios; legacy billing reports absolute counts.
export const STATS_URL = 'https://www.kimi.com/apiv2/kimi.gateway.membership.v2.MembershipService/GetSubscriptionStats';
export const LEGACY_URL = 'https://www.kimi.com/apiv2/kimi.gateway.billing.v1.BillingService/GetUsages';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const number = value => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const unavailable = () => ({ percentage: 0, resetsAt: null, available: false });
const timestamp = (...values) => values.find(value => typeof value === 'string' && value && Number.isFinite(Date.parse(value))) ?? null;
const limit = (percentage, resetsAt) => ({ percentage: Math.min(100, Math.max(0, Math.round(percentage * 100) / 100)), resetsAt });

export function normalizeKimiDetail(detail) {
  if (!record(detail)) return unavailable();
  const maximum = number(detail.limit);
  const remaining = number(detail.remaining);
  let used = number(detail.used);
  // Do not turn malformed explicit counts into zero usage.
  if (detail.used != null && used === null && !(typeof detail.used === 'string' && !detail.used.trim())) return unavailable();
  if (used === null && maximum !== null && remaining !== null && remaining <= maximum) used = maximum - remaining;
  if (maximum === null || maximum <= 0 || used === null) return unavailable();
  return { ...limit(used / maximum * 100, timestamp(detail.resetTime, detail.resetAt, detail.reset_time, detail.reset_at)), used, limit: maximum };
}

function rateLimit(value) {
  if (!record(value) || value.enabled !== true) return unavailable();
  // This protobuf JSON response omits ratio when the enabled pool has 0 usage.
  const ratio = value.ratio === undefined ? 0 : number(value.ratio);
  if (ratio === null || ratio > 1) return unavailable();
  return limit(ratio * 100, timestamp(value.resetTime));
}

export function normalizeKimiStats(data, language = 'en') {
  if (!record(data)) return null;
  const session = rateLimit(data.ratelimitCode5h);
  const weekly = rateLimit(data.ratelimitCode7d);
  const balance = data.subscriptionBalance;
  const models = [];
  // Monthly total is shared between Kimi and Code. It is not the weekly pool.
  if (record(balance) && balance.feature === 'FEATURE_OMNI' && balance.type === 'SUBSCRIPTION') {
    const ratio = balance.amountUsedRatio === undefined ? 0 : number(balance.amountUsedRatio);
    if (ratio !== null && ratio <= 1) models.push({
      id: 'kimi-monthly-total',
      label: language.toLowerCase().startsWith('zh') ? '订阅总用量（Kimi + Code）' : 'Subscription total (Kimi + Code)',
      limit: {
        ...limit(ratio * 100, timestamp(balance.expireTime)),
        countLabel: language.toLowerCase().startsWith('zh') ? `已用 ${(ratio * 100).toFixed(2)}%` : `${(ratio * 100).toFixed(2)}% used`,
      },
    });
  }
  const visible = [session, weekly, ...models.map(model => model.limit)].filter(value => value.available !== false);
  if (!visible.length) return null;
  const maximum = Math.max(...visible.map(value => value.percentage));
  return { session, weekly, models, status: maximum >= 92 ? 'critical' : maximum >= 75 ? 'warning' : 'ok', lastUpdated: Date.now() };
}

async function fetchFromKimiTabs(tabs, normalizeLegacy, language) {
  if (!tabs?.query || !tabs?.sendMessage) return null;
  const pages = await tabs.query({ url: 'https://www.kimi.com/*' }).catch(() => []);
  for (const page of pages) {
    if (!Number.isInteger(page.id)) continue;
    const stats = await tabs.sendMessage(page.id, { type: 'KIMI_FETCH_USAGE', endpoint: 'stats' }).catch(() => null);
    const current = stats?.ok ? normalizeKimiStats(stats.data, language) : null;
    if (current) return current;
    const legacy = await tabs.sendMessage(page.id, { type: 'KIMI_FETCH_USAGE', endpoint: 'legacy' }).catch(() => null);
    const previous = legacy?.ok ? normalizeLegacy(legacy.data) : null;
    if (previous) return previous;
  }
  return null;
}

export async function fetchKimiUsage({ cookies, tabs, request, normalizeLegacy, language = 'en', timezone = 'UTC' }) {
  const cookie = await cookies.get({ url: 'https://www.kimi.com', name: 'kimi-auth' });
  const token = typeof cookie?.value === 'string' ? cookie.value.trim() : '';
  // New Kimi keeps access_token in site localStorage. The content script uses it
  // only on that site and returns quota fields, never the token itself.
  if (!token) return fetchFromKimiTabs(tabs, normalizeLegacy, language);
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Connect-Protocol-Version': '1',
      'X-Language': language,
      'X-Msh-Platform': 'web',
      'R-Timezone': timezone,
    },
  };
  const current = await request(STATS_URL, { ...options, body: '{}' }).catch(() => null);
  if (current?.ok) {
    const usage = normalizeKimiStats(current.data, language);
    if (usage) return usage;
  }
  // Keep older Kimi Code accounts working during the membership migration.
  const legacy = await request(LEGACY_URL, { ...options, body: JSON.stringify({ scope: ['FEATURE_CODING'] }) }).catch(() => null);
  const previous = legacy?.ok ? normalizeLegacy(legacy.data) : null;
  return previous ?? fetchFromKimiTabs(tabs, normalizeLegacy, language);
}
