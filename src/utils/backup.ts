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
  localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify([backup, ...history.filter(item => item.manifest.id !== backup.manifest.id)].slice(0, 5)));
}

export function listLocalBackups(): Array<BackupPayload & { checksum: string }> {
  try { return JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || '[]'); } catch { return []; }
}
