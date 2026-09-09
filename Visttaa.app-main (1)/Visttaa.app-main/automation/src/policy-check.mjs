import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const policy = JSON.parse(await fs.readFile(path.join(root, 'automation/policy.json'), 'utf8'));
const input = await new Promise((resolve, reject) => {
  let value = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { value += chunk; });
  process.stdin.on('end', () => resolve(value));
  process.stdin.on('error', reject);
});
const files = [...new Set(input.split(/\r?\n/).map((file) => file.trim()).filter(Boolean))];
const blocked = files.filter((file) => policy.blockedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix)));
const outsideAllowlist = files.filter((file) => !policy.allowedPrefixes.some((prefix) => file.startsWith(prefix)));

if (files.length > policy.maxChangedFiles) {
  throw new Error(`Policy violation: maximum of ${policy.maxChangedFiles} changed files exceeded.`);
}
if (blocked.length > 0) throw new Error(`Policy violation: blocked files: ${blocked.join(', ')}`);
if (outsideAllowlist.length > 0) throw new Error(`Policy violation: files outside allowlist: ${outsideAllowlist.join(', ')}`);

process.stdout.write(`Policy passed for ${files.length} file(s).\n`);
