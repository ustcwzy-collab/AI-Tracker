// Additional Codex metadata. Missing counters are never rendered as zero usage.
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const numeric = value => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
};
const plans = {
  free: 'Free', go: 'Go', plus: 'Plus', pro: 'Pro', team: 'Team',
  business: 'Business', enterprise: 'Enterprise', edu: 'Edu',
};
const iso = milliseconds => {
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};
const dateFrom = value => {
  const number = numeric(value);
  if (number !== null && number > 0) return iso(number >= 1e12 ? number : number * 1000);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  return iso(Date.parse(value));
};
const windowReset = window => {
  const absolute = numeric(window.reset_at);
  if (absolute !== null) return iso(absolute * 1000);
  const relative = numeric(window.reset_after_seconds);
  return relative === null ? null : iso(Date.now() + relative * 1000);
};
const modelName = value => value.split(/[-_]+/).map(part => part.toLowerCase() === 'gpt' ? 'GPT' : part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

function reviewWindows(rate, zh) {
  if (!record(rate)) return [];
  return ['primary_window', 'secondary_window'].flatMap(slot => {
    const window = rate[slot];
    if (!record(window)) return [];
    const percentage = numeric(window.used_percent);
    if (percentage === null) return [];
    const seconds = numeric(window.limit_window_seconds);
    let period = slot === 'primary_window' ? (zh ? '主要窗口' : 'Primary window') : (zh ? '次要窗口' : 'Secondary window');
    if (seconds !== null && seconds > 0) {
      if (seconds % 86400 === 0) period = zh ? `${seconds / 86400} 天` : `${seconds / 86400}d`;
      else if (seconds % 3600 === 0) period = zh ? `${seconds / 3600} 小时` : `${seconds / 3600}h`;
      else period = zh ? `${Math.round(seconds / 60)} 分钟` : `${Math.round(seconds / 60)}m`;
    }
    return [{
      id: `codex:code-review:${slot}`,
      label: `${zh ? '代码审查' : 'Code review'} · ${period}`,
      metric: 'codeReview',
      limit: { percentage: Math.min(100, percentage), resetsAt: windowReset(window) },
    }];
  });
}

export function enrichCodexUsage(raw, base, language = 'en') {
  if (!record(raw) || !record(base)) return null;
  const zh = String(language).toLowerCase().startsWith('zh');
  const details = [];
  const add = (id, metric, label, value) => details.push({ id, metric, label, value });

  const rate = raw.rate_limit;
  if (record(rate)) {
    if (rate.limit_reached === true) add('codex:quota-status', 'quotaStatus', zh ? '额度状态' : 'Quota status', zh ? '已达到限额' : 'Limit reached');
    else if (typeof rate.allowed === 'boolean') add('codex:quota-status', 'quotaStatus', zh ? '额度状态' : 'Quota status', rate.allowed ? (zh ? '可用' : 'Available') : (zh ? '暂不可用' : 'Unavailable'));
  }

  const credits = raw.credits;
  if (record(credits)) {
    const balance = numeric(credits.balance);
    if (credits.unlimited === true) add('codex:credits', 'credits', zh ? '额度余额' : 'Credit balance', zh ? '不限额' : 'Unlimited');
    else if (balance !== null) add('codex:credits', 'credits', zh ? '额度余额' : 'Credit balance', `${balance.toLocaleString(zh ? 'zh-CN' : 'en-US', { maximumFractionDigits: 6 })} credits`);
    else if (typeof credits.has_credits === 'boolean') add('codex:credits', 'credits', zh ? '额外额度' : 'Additional credits', credits.has_credits ? (zh ? '有可用额度' : 'Available') : (zh ? '无可用额度' : 'None available'));
    if (credits.overage_limit_reached === true) add('codex:overage-limit', 'credits', zh ? '额外额度状态' : 'Additional credit status', zh ? '已达到限额' : 'Limit reached');
  }

  const resetCredits = raw.rate_limit_reset_credits;
  const applicable = record(resetCredits) ? numeric(resetCredits.applicable_available_count) : null;
  if (applicable !== null && Number.isInteger(applicable)) add('codex:applicable-resets', 'availableResets', zh ? '当前可使用重置' : 'Resets usable now', String(applicable));

  if (record(raw.model_usage)) {
    for (const [name, value] of Object.entries(raw.model_usage)) {
      if (!record(value) || typeof value.available !== 'boolean' || !name.trim()) continue;
      let status = value.available ? (zh ? '可用' : 'Available') : (zh ? '暂不可用' : 'Unavailable');
      if (!value.available) {
        const availableAt = dateFrom(value.available_at);
        if (availableAt) status += ` · ${zh ? '可用时间' : 'Available at'} ${new Date(availableAt).toLocaleString(zh ? 'zh-CN' : 'en-US')}`;
        if (value.credits_would_enable === true) status += ` · ${zh ? '额外额度可启用' : 'Additional credits can enable access'}`;
      }
      add(`codex:model:${name}`, 'modelStatus', modelName(name), status);
    }
  }

  const plan = typeof raw.plan_type === 'string' ? plans[raw.plan_type.toLowerCase()] : undefined;
  return {
    ...base,
    ...(typeof plan === 'string' ? { plan } : {}),
    details,
    models: [
      ...(Array.isArray(base.models) ? base.models : []).filter(model => !String(model?.id).startsWith('codex:code-review:')),
      ...reviewWindows(raw.code_review_rate_limit, zh),
    ],
  };
}
