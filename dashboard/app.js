const D = window.RADAR;
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + (n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n).toLocaleString('en-US'));
const f = n => n.toFixed(3);
let sortKey = 'rank', direction = 1;
$('date').textContent = 'AS OF / ' + D.as_of;
for (const [id, values] of [['category', D.rows.map(r => r.category || 'Other')], ['chain', D.rows.flatMap(r => r.chains)]]) {
  for (const value of [...new Set(values)].sort()) {
    const option = document.createElement('option'); option.value = value; option.textContent = value; $(id).append(option);
  }
}
function render() {
  const query = $('search').value.trim().toLowerCase();
  const rows = D.rows.filter(r => (!query || (r.name + ' ' + r.slug).toLowerCase().includes(query)) &&
    (!$('category').value || (r.category || 'Other') === $('category').value) &&
    (!$('chain').value || r.chains.includes($('chain').value)) && (!$('cohort').value || r.cohort === $('cohort').value));
  rows.sort((a,b) => {
    const x = a[sortKey], y = b[sortKey];
    return direction * (typeof x === 'string' ? x.localeCompare(y || '') : (x ?? -Infinity) - (y ?? -Infinity)) || a.rank - b.rank;
  });
  $('count').textContent = rows.length + ' / ' + D.rows.length + ' protocols';
  $('empty').hidden = rows.length !== 0;
  $('rows').innerHTML = rows.map(r => `<tr><td>${String(r.rank).padStart(2,'0')}</td><td><button class="protocol" data-slug="${esc(r.slug)}">${esc(r.name)}</button><small>${esc(r.cohort)}</small></td><td>${esc(r.category || 'Other')}</td><td title="${esc(r.chains.join(', '))}">${esc(r.chains[0] || 'Unreported')}${r.chains.length > 1 ? ' +' + (r.chains.length - 1) : ''}</td><td>${money(r.tvl_usd)}</td><td title="${r.implied_value_usd.toLocaleString('en-US')} USD">${money(r.implied_value_usd)}</td><td>${r.change_7d === null ? 'N/A' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(1) + '%'}</td><td><span class="badge">${r.verdict}</span></td></tr>`).join('');
}
function showDetail(slug) {
  const r = D.rows.find(r => r.slug === slug);
  $('detailContent').innerHTML = `<p class="eyebrow">FIELD NOTE / RANK ${r.rank} / ${esc(r.cohort)}</p><h2 class="detailtitle">${esc(r.name)}</h2><div class="detailmeta">${esc(r.category)} / ${esc(r.chains.join(', '))} / No token recorded</div><div class="detailgrid"><aside class="valuation"><span>IMPLIED MARKET CAP</span><strong>${money(r.implied_value_usd)}</strong><p>Comparable-based scenario, not a launch forecast.</p><dl><dt>TVL</dt><dd>${money(r.tvl_usd)}</dd><dt>Size multiple</dt><dd>${f(r.size_multiple)}x</dd><dt>Category factor</dt><dd>${f(r.category_adjustment)}x</dd><dt>Growth factor</dt><dd>${f(r.growth_multiplier)}x</dd><dt>Maturity factor</dt><dd>${f(r.maturity_multiplier)}x</dd><dt>Category comps</dt><dd>${r.category_samples}</dd></dl><p>Tracked since ${esc(r.listed_at || 'unknown; 365d assumed')}. Tracking age is not launch age.</p><p>LOO typical factor error: ${D.backtest.loo_multiple.toFixed(2)}x. No confidence interval is implied.</p><hr><p>TRIAL CAPITAL / $${r.capital_usd}<br>GAS / ${r.gas_estimate} entry + exit each<br>VERDICT / ${r.verdict.toUpperCase()}</p></aside><section class="steps"><h3>A mechanism-first action plan</h3><ol>${r.farm_steps.map(s => '<li>' + esc(s) + '</li>').join('')}</ol><p class="detailmeta">Costs are planning estimates. Asset support, eligibility and rewards require current verification.</p></section></div>`;
  $('detail').showModal();
}
$('rows').onclick = e => {const button = e.target.closest('[data-slug]'); if (button) showDetail(button.dataset.slug);};
$('closeDetail').onclick = () => $('detail').close();
for (const id of ['search','category','chain','cohort']) $(id).addEventListener('input', render);
$('reset').onclick = () => {for (const id of ['search','category','chain','cohort']) $(id).value = ''; render();};
for (const button of document.querySelectorAll('[data-sort]')) button.onclick = () => {
  direction = sortKey === button.dataset.sort ? -direction : (['rank','name','category'].includes(button.dataset.sort) ? 1 : -1);
  sortKey = button.dataset.sort; render();
};
function tab(research) {
  $('boardView').hidden = research; $('researchView').hidden = !research;
  $('boardTab').classList.toggle('active', !research); $('researchTab').classList.toggle('active', research);
}
$('boardTab').onclick = () => tab(false); $('researchTab').onclick = $('readResearch').onclick = () => tab(true);
const b = D.backtest;
$('risk').textContent = `128 calibration comps. LOO factor error ${b.loo_multiple.toFixed(2)}x. Time-split OOS ${b.time_multiple.toFixed(2)}x.`;
$('research').innerHTML = `<div class="researchgrid"><section><h3>01 / Fit the market, then adjust</h3><p>128 records have positive market cap and TVL. Ordinary least squares fits log10(market cap) = ${f(D.model.intercept)} + ${f(D.model.slope)} x log10(TVL). The fitted size multiple is 10^(intercept + (slope - 1) x log10(TVL)).</p><p>Category adjustment = (category median cap/TVL divided by global median cap/TVL)^(n/(n+8)). Global median: ${f(D.model.global)}x. Unseen categories use 1x. Implied value = TVL x size multiple x category adjustment x growth x maturity.</p><p>Growth = 1 + clamp(7d change, -60, 120)/200; missing growth uses zero. Maturity = 0.6 + 0.4 x min(tracking age,1095)/1095; missing age uses 365 days. Values are rounded to positive dollars and capped at $100T.</p></section><section><h3>02 / Out-of-sample reality check</h3><div class="metrics">LOO / ${b.comps} held-out predictions<br>Median |log10(predicted / actual)|: ${f(b.loo_log_error)}<br>Typical factor error: ${b.loo_multiple.toFixed(2)}x<br>TIME SPLIT / ${b.dated} dated records<br>${b.train} earlier train / ${b.test} later test<br>Median absolute log10 error: ${f(b.time_log_error)}<br>OOS factor error: ${b.time_multiple.toFixed(2)}x</div><p>Every LOO fold refits the curve and category medians without its test record. Time split uses listed_at before ${b.cut_date} for training; later records are held out. Both evaluate the full model including growth and maturity. Factor error = 10^median absolute log10 error.</p></section><section><h3>03 / The 20 inclusions we cannot hide</h3><p>758 protocols become 342 raw no-token records and 198 after the snapshot column screens. The board includes all 40 watchlist records, 138 below the $50M floor and 20 above it outside the watchlist.</p><p>Those 20 pass every available column screen. The house also used parentProtocol, which is absent from this snapshot; its parent exclusion cannot be reproduced. We retain and label these records rather than infer missing parents. Examples include sentora-curator and polymarket-international.</p><p>Documented inclusions: circle-gateway is a bridge (snapshot category Cross Chain Bridge), and usdcx is a stablecoin wrapper. Both receive THIN farm verdicts. Passing the screen does not prove an independent token opportunity.</p></section><section><h3>04 / What this evidence cannot say</h3><p>These are 128 protocol records, not independently verified token families; related protocols may share a token. Only 95 have listing dates. Category medians and the size curve can overlap in what they explain; small samples shrink toward the global ratio.</p><p>The time split is a cross-sectional holdout by tracking date, not a historical forecast: all TVL and caps come from the same sealed snapshot. Survivorship, parent overlap, token supply and category mix can bias results. Tracking age is not time without a token.</p><p>No revenue, circulating supply, unlock schedule or reward rules are provided. Implied market cap is neither FDV nor expected airdrop proceeds. FARM means a conditional small trial of a plausible mechanism; THIN means weak or indirect grounds; SKIP means no supported retail route established.</p></section></div>`;
render();
