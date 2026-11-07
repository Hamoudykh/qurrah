// One-time access code, asked the first time the app is opened on a device.
//
// Honest limits: this is a static site with no server, so the check runs on the phone. It keeps
// casual visitors out; it is not real security (someone technical can get around it).
// Only a salted PBKDF2-SHA-256 hash of the code is stored here, never the code itself.
//
// To change the code:  node scripts/make-access.mjs            (random 6-digit code)
//                      node scripts/make-access.mjs 123456     (a code you choose)
// That rewrites ACCESS below and gives it a new `id`, so every device asks for the new code once.
// Add --keep-devices to keep the `id`: devices that are already in stay in.

export const ACCESS = {"id":"k1","digits":6,"iterations":200000,"salt":"5a466603912e2e206634812c34697f67","hash":"0d3d1eef9dcb397e8640abccd414d876db45927f48f4d3dc2bb247516ea26e99"};

const FLAG = 'qurrah:access';

/** Keep digits only; Arabic-Indic (٠-٩) and Eastern Arabic (۰-۹) digits become 0-9. */
export function normalizeCode(input) {
  let out = '';
  for (const ch of String(input ?? '')) {
    const c = ch.charCodeAt(0);
    if (c >= 48 && c <= 57) out += ch;
    else if (c >= 0x660 && c <= 0x669) out += String(c - 0x660);
    else if (c >= 0x6F0 && c <= 0x6F9) out += String(c - 0x6F0);
  }
  return out;
}

const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));

export async function deriveHash(code, saltHex, iterations) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto is not available (the app must be opened over https)');
  const key = await subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations }, key, 256);
  return toHex(new Uint8Array(bits));
}

export async function checkCode(input, rec = ACCESS) {
  const code = normalizeCode(input);
  if (code.length !== rec.digits) return false;
  return (await deriveHash(code, rec.salt, rec.iterations)) === rec.hash;
}

export function isUnlocked(rec = ACCESS) {
  try { return localStorage.getItem(FLAG) === rec.id; } catch { return false; }
}

export function unlock(rec = ACCESS) {
  try { localStorage.setItem(FLAG, rec.id); } catch { /* storage blocked: asked again next time */ }
}
