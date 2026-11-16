import { readFileSync, writeFileSync, copyFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBoard } from './lib/board.ts';
import { buildDossier } from './vendor/makefun-board.ts';
const root = fileURLToPath(new URL('.', import.meta.url));
const index = process.argv.indexOf('--input');
const input = index >= 0 ? process.argv[index + 1] : '/input/snapshot.json';
if (!input) throw new Error('--input requires a snapshot path');
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const data = buildBoard(JSON.parse(readFileSync(input, 'utf8')));
writeFileSync(join(out, 'board.json'), JSON.stringify(data) + '\n');
writeFileSync(join(out, 'data.js'), 'window.RADAR=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';\n');
for (const dir of ['dashboard', 'screenshots']) {
  mkdirSync(join(out, dir), { recursive: true });
  for (const name of readdirSync(join(root, dir)).sort()) {
    copyFileSync(join(root, dir, name), join(out, dir, name));
  }
}
writeFileSync(join(out, 'dossier.json'), buildDossier(out, {text_max_bytes: 65536}));
console.log(JSON.stringify({rows: data.rows.length, backtest: data.backtest}));
