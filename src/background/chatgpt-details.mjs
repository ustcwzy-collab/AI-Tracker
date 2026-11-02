// ChatGPT Chat metadata, separate from Codex /wham/usage.
// Verified field contracts (remaining is a count; reset_after is an absolute time):
// https://github.com/AstroQore/vibe-bar/blob/main/Sources/VibeBarCore/Adapters/ChatGPTChatParser.swift
// https://github.com/voyager-crew/voyager/blob/main/src/features/plugins/builtin/chatgptProUsage/usageStore.ts
// https://github.com/laowang74152/gpt2api/blob/main/API_NOTES.md
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const count = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
const features = {
  deep_research: ['深度研究', 'Deep research'],
  image_gen: ['图像生成', 'Image generation'],
  odyssey: ['Agent 模式', 'Agent mode'],
  file_upload: ['文件上传', 'File uploads'],
  paste_text_to_file: ['粘贴文本转文件', 'Pasted text files'],
  reason: ['推理额度', 'Reasoning allowance'],
};
const modelSlug = value => typeof value === 'string' && /^(?:gpt-|chatgpt-|o\d(?:-|$))[a-z0-9._-]*$/i.test(value) && value.length <= 100 ? value.toLowerCase() : null;
const modelLabel = value => value.replace(/^(chatgpt|gpt)-/i, (_, prefix) => `${prefix.toLowerCase() === 'gpt' ? 'GPT' : 'ChatGPT'}-`).replace(/-pro(?:-|$)/g, ' Pro ').replace(/-thinking(?:-|$)/g, ' Thinking ').trim();
const resetDate = value => {
  // The frontend fields are dates, not durations. Never add numeric values to now.
  const milliseconds = typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value * 1000
    : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? Date.parse(value) : NaN;
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

/**
 * Text-only metadata: { details: [{ id, metric, label, value, resetsAt? }], models: [] }.
 * Missing arrays mean an unrecognized response (null). Empty arrays mean unknown
 * usage, never full allowance. No raw response, credentials, percentage or total
 * inferred from a plan is retained. The UI controls resetsAt with its reset toggle.
 */
export function normalizeChatGPTUsage(raw, language = 'en', now = Date.now()) {
  if (!record(raw) || raw.error != null || !['model_limits', 'blocked_features', 'limits_progress'].some(key => Array.isArray(raw[key]))) return null;
  const zh = String(language).toLowerCase().startsWith('zh');
  const clock = typeof now === 'number' && Number.isFinite(now) ? now : Date.now();
  const rows = new Map();
  const text = (cn, en) => zh ? cn : en;
  const formatCount = value => value.toLocaleString(zh ? 'zh-CN' : 'en-US');
  const featureLabel = name => `ChatGPT ${features[name][zh ? 0 : 1]}`;
  const hasFeature = name => typeof name === 'string' && Object.hasOwn(features, name);
  const expired = resetsAt => resetsAt !== null && Date.parse(resetsAt) <= clock;
  const add = (id, metric, label, value, resetsAt = null) => rows.set(id, { id, metric, label, value, ...(resetsAt ? { resetsAt } : {}) });

  for (const item of Array.isArray(raw.limits_progress) ? raw.limits_progress : []) {
    if (!record(item) || !hasFeature(item.feature_name)) continue;
    const remaining = count(item.remaining);
    if (remaining === null) continue;
    const name = item.feature_name;
    const resetsAt = resetDate(item.reset_after);
    let value = text(`接口剩余 ${formatCount(remaining)} 次`, `${formatCount(remaining)} remaining (reported)`);
    if (expired(resetsAt)) value += text(' · 待刷新', ' · Refresh needed');
    add(`chatgpt:feature:${name}`, name === 'reason' ? 'chatModels' : 'chatFeatures', featureLabel(name), value, resetsAt);
  }

  for (const item of Array.isArray(raw.blocked_features) ? raw.blocked_features : []) {
    if (!record(item) || !hasFeature(item.name)) continue;
    const name = item.name;
    const id = `chatgpt:feature:${name}`;
    const previous = rows.get(id);
    const resetsAt = resetDate(item.resets_after) ?? previous?.resetsAt ?? null;
    let value = expired(resetsAt)
      ? text('限额状态待刷新', 'Limit status needs refresh')
      : text('暂不可用', 'Unavailable');
    if (previous) value += ` · ${previous.value}`;
    const limit = count(item.limit);
    if (limit !== null) value += text(` · 上限 ${formatCount(limit)} 次`, ` · Limit ${formatCount(limit)}`);
    add(id, name === 'reason' ? 'chatModels' : 'chatFeatures', featureLabel(name), value, resetsAt);
  }

  for (const item of Array.isArray(raw.model_limits) ? raw.model_limits : []) {
    if (!record(item)) continue;
    const slug = modelSlug(item.model_slug);
    if (!slug) continue;
    const resetsAt = resetDate(item.resets_after);
    add(`chatgpt:model:${slug}`, 'chatModels', `ChatGPT ${modelLabel(slug)}`,
      expired(resetsAt) ? text('限额状态待刷新', 'Limit status needs refresh') : text('已达到限额', 'Limit reached'), resetsAt);
  }

  // An empty model_limits array only says no model throttle was reported.
  add('chatgpt:models:unreported', 'chatModels', text('ChatGPT 模型次数', 'ChatGPT model counts'), text('接口未提供各模型剩余次数', 'Per-model remaining counts are not provided'));
  if (![...rows.values()].some(row => row.metric === 'chatFeatures')) {
    add('chatgpt:features:unreported', 'chatFeatures', text('ChatGPT 功能额度', 'ChatGPT feature allowances'), text('接口未提供功能剩余次数', 'Feature remaining counts are not provided'));
  }
  return { details: [...rows.values()], models: [] };
}
