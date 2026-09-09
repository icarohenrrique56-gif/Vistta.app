import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = process.env.AUTOMATION_OUTPUT_DIR || path.join(root, 'automation/artifacts');
const issueId = process.env.GLITCHTIP_ISSUE_ID || process.argv[2];
const maxText = 16000;
const blockedKeys = new Set(['password', 'senha', 'token', 'accesstoken', 'refreshtoken', 'apikey', 'secret', 'authorization', 'cookie', 'cardnumber', 'cvv', 'claims']);

if (!issueId || !/^[a-zA-Z0-9_-]{1,100}$/.test(issueId)) throw new Error('A valid GLITCHTIP_ISSUE_ID is required.');
if (!process.env.AI_API_URL || !process.env.AI_API_KEY || !process.env.AI_MODEL) throw new Error('AI_API_URL, AI_API_KEY and AI_MODEL are required in the protected worker environment.');

function sanitize(value, depth = 0) {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value.slice(0, 1000);
  if (depth >= 4) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 40).map((item) => sanitize(item, depth + 1));
  if (typeof value !== 'object') return String(value).slice(0, 1000);
  return Object.fromEntries(Object.entries(value).slice(0, 40).filter(([key]) => !blockedKeys.has(key.toLowerCase())).map(([key, item]) => [key, sanitize(item, depth + 1)]));
}

async function fetchIssue() {
  if (process.env.GLITCHTIP_ISSUE_JSON) return JSON.parse(process.env.GLITCHTIP_ISSUE_JSON);
  const baseUrl = process.env.GLITCHTIP_BASE_URL;
  const token = process.env.GLITCHTIP_API_TOKEN;
  if (!baseUrl || !token) throw new Error('GLITCHTIP_BASE_URL and GLITCHTIP_API_TOKEN are required when issue JSON is not supplied.');
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/0/issues/${encodeURIComponent(issueId)}/`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GlitchTip API returned HTTP ${response.status}.`);
  return response.json();
}

function stackFiles(issue) {
  const text = JSON.stringify(issue);
  return [...new Set([...text.matchAll(/(?:^|[(/])((?:src|tests)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx))/g)].map((match) => match[1]))].slice(0, 8);
}

async function readRelevantFiles(files) {
  const entries = [];
  for (const file of files) {
    const absolute = path.resolve(root, file);
    if (!absolute.startsWith(`${root}${path.sep}`)) continue;
    try {
      const content = await fs.readFile(absolute, 'utf8');
      entries.push({ file, content: content.slice(0, maxText) });
    } catch {
      // Stack traces can refer to generated or deleted files.
    }
  }
  return entries;
}

const issue = sanitize(await fetchIssue());
const relevantFiles = await readRelevantFiles(stackFiles(issue));
const previousFeedback = (process.env.AUTOMATION_FEEDBACK || '').slice(0, maxText);
const currentDiff = (process.env.AUTOMATION_DIFF || '').slice(0, maxText);
const prompt = [
  'Você é um engenheiro de software seguro analisando uma Issue do GlitchTip do VISTTA ERP.',
  'Responda SOMENTE JSON válido com: diagnosis, cause, risk, files, patch.',
  'patch deve ser um unified diff aplicável por git apply. Se não houver correção segura, use string vazia.',
  'Não altere Firebase, autenticação, regras, secrets, package-lock, vite.config ou funções backend.',
  'Não inclua credenciais, PII, valores financeiros ou dados sensíveis.',
  `Issue sanitizada: ${JSON.stringify(issue)}`,
  `Arquivos relacionados: ${JSON.stringify(relevantFiles)}`,
  `Feedback de validação anterior: ${previousFeedback || 'nenhum'}`,
  `Diff atual: ${currentDiff || 'nenhum'}`
].join('\n\n');

const response = await fetch(process.env.AI_API_URL, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: process.env.AI_MODEL, temperature: 0, messages: [{ role: 'system', content: 'Retorne apenas JSON válido.' }, { role: 'user', content: prompt }] })
});
if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}.`);
const payload = await response.json();
const content = payload.choices?.[0]?.message?.content;
if (typeof content !== 'string') throw new Error('AI response did not contain message content.');
const result = JSON.parse(content.replace(/^```json\s*/i, '').replace(/\s*```$/i, ''));
if (typeof result.patch !== 'string') throw new Error('AI response must contain a patch string.');

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, 'analysis.json'), JSON.stringify({ issueId, ...sanitize(result) }, null, 2));
await fs.writeFile(path.join(outputDir, 'repair.patch'), result.patch);
process.stdout.write(JSON.stringify({ issueId, diagnosis: result.diagnosis, files: result.files, patchFile: path.join(outputDir, 'repair.patch') }) + '\n');
