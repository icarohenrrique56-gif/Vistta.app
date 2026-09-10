export interface BackupPayload {
  manifest: {
    id: string;
    createdAt: string;
    empresaId: string;
    version: string;
    source: 'vistta-local-export';
    recordCounts: Record<string, number>;
  };
  data: Record<string, unknown[]>;
}
export type BackupRecord = BackupPayload & { checksum: string };

const LOCAL_BACKUP_KEY = 'vistta:local-backups';

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/senha|password|token|secret|privatekey|apikey|credential/i.test(key))
    .map(([key, child]) => [key, sanitize(child)]));
}

export async function createBackup(empresaId: string, data: Record<string, unknown[]>) {
  const safeData = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, sanitize(value) as unknown[]]));
  const payload: BackupPayload = {
    manifest: {
      id: `backup-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      empresaId,
      version: '1.0',
      source: 'vistta-local-export',
      recordCounts: Object.fromEntries(Object.entries(safeData).map(([key, value]) => [key, value.length]))
    },
    data: safeData
  };
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return { ...payload, checksum };
}

export async function validateBackup(value: unknown): Promise<{ valid: boolean; reason?: string; recordCount: number; size: number }> {
  if (!value || typeof value !== 'object') return { valid: false, reason: 'Arquivo ilegível.', recordCount: 0, size: 0 };
  const candidate = value as Partial<BackupRecord>;
  if (!candidate.manifest?.id || !candidate.manifest.empresaId || candidate.manifest.version !== '1.0' || !candidate.data || !candidate.checksum) {
    return { valid: false, reason: 'Manifesto incompleto ou versão incompatível.', recordCount: 0, size: 0 };
  }
  const payload = { manifest: candidate.manifest, data: candidate.data };
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const recordCount = Object.values(candidate.data).reduce((total, records) => total + (Array.isArray(records) ? records.length : 0), 0);
  const size = new Blob([JSON.stringify(value)]).size;
  return checksum === candidate.checksum
    ? { valid: true, recordCount, size }
    : { valid: false, reason: 'Checksum SHA-256 não confere.', recordCount, size };
}

export function downloadBackup(backup: BackupPayload & { checksum: string }) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `vistta-${backup.manifest.empresaId}-${backup.manifest.createdAt.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function saveLocalBackup(backup: BackupPayload & { checksum: string }) {
  const history = JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || '[]') as Array<BackupPayload & { checksum: string }>;
  const next = [backup, ...history.filter(item => item.manifest.id !== backup.manifest.id)].slice(0, 5);
  localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(next));
  localStorage.setItem(`${LOCAL_BACKUP_KEY}-count`, String(next.length));
}

export function listLocalBackups(): Array<BackupPayload & { checksum: string }> {
  try { return JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || '[]'); } catch { return []; }
}

export function backupSize(backup: BackupRecord): number {
  return new Blob([JSON.stringify(backup)]).size;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadCsv(name: string, records: unknown[]) {
  const rows = records.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>;
  const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [columns, ...rows.map(row => columns.map(column => row[column]))].map(row => row.map(escape).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
