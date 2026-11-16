import { fit, predict, median } from './model.ts';
import type { Protocol } from './model.ts';
export function backtest(comps: Protocol[], asOf: string) {
  const error = (p: Protocol, model: ReturnType<typeof fit>) =>
    Math.abs(Math.log10(predict(p, asOf, model).implied_value_usd / p.mcap_usd!));
  const looErrors = comps.map((p, i) => error(p, fit(comps.filter((_, j) => j !== i))));
  const dated = comps.filter(p => p.listed_at).sort((a, b) =>
    a.listed_at!.localeCompare(b.listed_at!) || a.slug.localeCompare(b.slug));
  const cutDate = dated[Math.floor(dated.length * 0.7)].listed_at!;
  const train = dated.filter(p => p.listed_at! < cutDate);
  const test = dated.filter(p => p.listed_at! >= cutDate);
  const model = fit(train);
  const timeError = median(test.map(p => error(p, model)));
  const looError = median(looErrors);
  return {comps: comps.length, dated: dated.length, train: train.length, test: test.length,
    cut_date: cutDate, loo_log_error: looError, loo_multiple: 10 ** looError,
    time_log_error: timeError, time_multiple: 10 ** timeError};
}
