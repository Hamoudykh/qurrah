#!/usr/bin/env node
// Set the app's one-time access code. Writes only a salted hash into js/core/access.js and
// prints the code once. The code itself is never saved anywhere.
//
//   node scripts/make-access.mjs                 random 6-digit code
//   node scripts/make-access.mjs 123456          a code you choose (digits only)
//   ... --keep-devices                           keep the id, so devices already in stay in
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ACCESS, deriveHash, normalizeCode } from '../js/core/access.js';

const file = join(dirname(fileURLToPath(import.meta.url)), '../js/core/access.js');
const args = process.argv.slice(2);
const keep = args.includes('--keep-devices');
const given = args.find((a) => !a.startsWith('--'));

const code = given != null ? normalizeCode(given) : String(randomInt(0, 1_000_000)).padStart(6, '0');
if (code.length < 4 || code.length > 12 || (given != null && code !== given)) {
  console.error('The code must be 4-12 digits.');
  process.exit(1);
}

const iterations = 200000;
const salt = randomBytes(16).toString('hex');
const hash = await deriveHash(code, salt, iterations);
const n = Number(String(ACCESS.id).replace(/\D/g, '')) || 0;
const rec = { id: keep ? ACCESS.id : `k${n + 1}`, digits: code.length, iterations, salt, hash };

const src = readFileSync(file, 'utf8');
const line = /^export const ACCESS = .*;$/m;
if (!line.test(src)) { console.error('ACCESS line not found in js/core/access.js'); process.exit(1); }
writeFileSync(file, src.replace(line, `export const ACCESS = ${JSON.stringify(rec)};`));

console.log(`Access code: ${code}`);
console.log(`Written to js/core/access.js (id ${rec.id}${keep ? ', devices already in stay in' : ', every device asks once'}).`);
console.log('Bump VERSION in sw.js, then commit and push.');
