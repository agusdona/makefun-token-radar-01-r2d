import type { Protocol } from './model.ts';
export function farmPlan(p: Protocol) {
  const chain = p.chains[0] || 'the recorded network';
  const c = p.category || 'Other';
  const gas = chain === 'Ethereum' ? '$8-30' : '$0.20-5';
  const thin = /bridge|stablecoin wrapper/i.test(c);
  let verdict = 'thin', capital = 50, action = '', monitor = '', exit = '';
  if (/lending|cdp/i.test(c)) {
    verdict = 'farm'; capital = 100;
    action = 'Supply one supported asset; check utilization and withdrawal liquidity first. Do not borrow or loop collateral just for activity.';
    monitor = 'Check supply balance and utilization weekly for 30 days; do not add leverage. Lending losses and contract risk remain.';
    exit = 'Withdraw a small portion first, then redeem the balance and revoke unused approvals.';
  } else if (/dexs/i.test(c)) {
    verdict = 'farm';
    action = 'Quote a $20 swap in a liquid pair, set slippage at most 0.5%, and execute only if the route is economical. Keep the remainder liquid.';
    monitor = 'Over 14 days, use swaps only when needed; avoid circular volume. LP positions add impermanent-loss risk and are optional.';
    exit = 'Swap back only if needed; compare fees and price impact, then revoke unused spending approvals.';
  } else if (/perpetual|derivative|options/i.test(c)) {
    action = 'Inspect collateral, funding and liquidation rules. If already hedging a real exposure, test $25 margin at no more than 1x; otherwise stay in research mode.';
    monitor = 'Review funding daily for 7 days. Never manufacture leveraged volume for hypothetical rewards; stop if costs exceed $5.';
    exit = 'Close the hedge, cancel all resting orders, and withdraw available margin; allow for settlement delays.';
  } else if (thin) {
    action = 'Do not bridge or wrap solely for rewards. For an existing transfer need, quote a $20 test, verify both network endpoints and redemption support.';
    monitor = 'Track finality and receipt for one transfer over 1-2 days; wrapper or bridge usage does not establish an independent token claim.';
    exit = 'Verify the destination receipt and test the supported redemption path before sending additional capital.';
  } else if (/yield|curator|allocator|vault/i.test(c)) {
    verdict = 'farm'; capital = 100;
    action = 'Inspect the vault assets, manager permissions, fees and redemption queue. If public deposits are supported, test $100 and record shares received.';
    monitor = 'Review share value and underlying exposures weekly for 30 days. Stop on unexplained losses or a changed withdrawal queue.';
    exit = 'Request redemption, wait through any disclosed queue, and verify assets returned before redepositing.';
  } else if (/prediction/i.test(c)) {
    action = 'Check local eligibility and resolution rules; if eligible, use at most $10 for a position you understand. Do not trade just to generate volume.';
    monitor = 'Track the market until resolution, up to 30 days; the entire stake can be lost. No points or token entitlement is established.';
    exit = 'Close the position where liquidity permits or redeem after resolution; record realized costs and withdraw unused funds.';
  } else {
    verdict = 'skip'; capital = 0;
    action = `Inspect the ${c} product documentation and eligibility. The snapshot does not establish a public retail deposit or reward mechanism; allocate $0 until one is verified.`;
    monitor = 'Spend 15 minutes on documentation now and recheck in 30 days; do not invent staking, minting or deposit routes from a TVL record.';
    exit = 'Keep funds in the wallet. Only reconsider after supported assets, access requirements and an exit path are independently verified.';
  }
  return {verdict, capital_usd: capital, gas_estimate: capital ? gas : '$0', farm_steps: [
    `${verdict.toUpperCase()} / ${p.name} on ${chain}: verify the official application, supported assets and current token status before connecting. Snapshot category: ${c}. Research: 15 minutes, $0 gas and $0 committed capital.`,
    `${p.name}: ${action} Budget: up to $${capital} capital (at risk, not a fee); estimated transaction gas ${capital ? gas : '$0'}, not a live quote. Setup: 15-25 minutes.`,
    `${p.name} on ${chain}: ${monitor} Review cost: $0 gas; optional transactions must fit the same gas budget. These are trial windows, not proven eligibility periods.`,
    `${p.name}: ${exit} Allow ${capital ? gas : '$0'} extra gas for exit and 10-20 minutes of active work. Rewards and launch timing are unconfirmed; check published terms before any claim.`
  ]};
}
