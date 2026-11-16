export type Protocol = {
  slug: string; name: string; category: string | null; chains: string[];
  tvl_usd: number; mcap_usd: number | null; change_7d: number | null;
  listed_at: string | null; gecko_id: string | null; symbol: string | null;
};
export const median = (values: number[]) => {
  const a = [...values].sort((x, y) => x - y);
  const n = a.length;
  return n ? (a[Math.floor((n - 1) / 2)] + a[Math.floor(n / 2)]) / 2 : 0;
};
export function fit(comps: Protocol[]) {
  const xs = comps.map(p => Math.log10(p.tvl_usd));
  const ys = comps.map(p => Math.log10(p.mcap_usd!));
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(xs), my = mean(ys);
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) /
    xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const global = median(comps.map(p => p.mcap_usd! / p.tvl_usd));
  const categories: Record<string, {n: number; ratio: number; adjustment: number}> = {};
  for (const category of [...new Set(comps.map(p => p.category || 'Other'))].sort()) {
    const group = comps.filter(p => (p.category || 'Other') === category);
    const ratio = median(group.map(p => p.mcap_usd! / p.tvl_usd));
    const weight = group.length / (group.length + 8);
    categories[category] = {n: group.length, ratio,
      adjustment: Math.exp(weight * Math.log(ratio / global))};
  }
  return {intercept: my - slope * mx, slope, global, categories, n: comps.length};
}
export function predict(p: Protocol, asOf: string, model: ReturnType<typeof fit>) {
  const age = p.listed_at ? Math.max(0, (Date.parse(asOf) - Date.parse(p.listed_at)) / 86400000) : null;
  const growth = 1 + Math.min(120, Math.max(-60, p.change_7d ?? 0)) / 200;
  const maturity = 0.6 + 0.4 * Math.min(age ?? 365, 1095) / 1095;
  const sizeMultiple = 10 ** (model.intercept + (model.slope - 1) * Math.log10(p.tvl_usd));
  const category = model.categories[p.category || 'Other'];
  const categoryAdjustment = category?.adjustment ?? 1;
  const value = p.tvl_usd * sizeMultiple * categoryAdjustment * growth * maturity;
  return {implied_value_usd: Math.min(1e14, Math.max(1, Math.round(value))), age_days: age,
    size_multiple: sizeMultiple, category_adjustment: categoryAdjustment,
    category_samples: category?.n ?? 0, growth_multiplier: growth, maturity_multiplier: maturity};
}
