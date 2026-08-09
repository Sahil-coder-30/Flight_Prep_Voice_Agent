#!/usr/bin/env node
/**
 * scripts/generate-keys.js
 *
 * One-off script to regenerate the RSA-4096 key pair used for JWT signing.
 * Run with: node scripts/generate-keys.js
 *
 * ⚠️  This REPLACES existing keys. Any active access tokens (15m lifetime)
 *     signed with the old key will fail verification until they expire.
 *     For zero-downtime rotation, follow the dual-key JWKS procedure
 *     documented in the auth_security_architecture_plan.md.
 */

import { generateKeyPairSync } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keysDir = path.join(__dirname, '../keys');

if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
}

console.log('[generate-keys] Generating RSA-4096 key pair...');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey, 'utf-8');
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey, 'utf-8');

console.log('[generate-keys] ✅ Keys written to Auth/keys/private.pem and Auth/keys/public.pem');
console.log('[generate-keys] ⚠️  These files are gitignored. Back them up securely (e.g., k8s secrets).');
