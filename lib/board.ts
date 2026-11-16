import { fit, predict } from './model.ts';
import type { Protocol } from './model.ts';
import { farmPlan } from './farm.ts';
import { backtest } from './backtest.ts';
const excluded = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);
export function eligible(p: Protocol) {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null &&
    !excluded.has(p.category || '') && !/\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/.test(p.name) &&
    !/\b(wrapped|staked|staking)\b/i.test(p.name) &&
    !/^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)/i.test(p.name);
}
export function buildBoard(snapshot: {protocols: Protocol[]; watchlist: string[]; as_of: string; floor_usd: number}) {
  const comps = snapshot.protocols.filter(p => p.mcap_usd! > 0 && p.tvl_usd > 0);
  const model = fit(comps);
  const rows = snapshot.protocols.filter(eligible).map(p => ({...p,
    ...predict(p, snapshot.as_of, model), ...farmPlan(p),
    cohort: snapshot.watchlist.includes(p.slug) ? 'Watchlist' : p.tvl_usd < snapshot.floor_usd ? 'Below floor' : 'Additional inclusion'
  })).sort((a, b) => b.implied_value_usd - a.implied_value_usd || a.slug.localeCompare(b.slug))
    .map((p, i) => ({rank: i + 1, ...p}));
  for (const slug of snapshot.watchlist) if (!rows.some(p => p.slug === slug)) throw new Error(`Missing watchlist: ${slug}`);
  return {as_of: snapshot.as_of, floor_usd: snapshot.floor_usd, universe: snapshot.protocols.length,
    rows, model, backtest: backtest(comps, snapshot.as_of)};
}
