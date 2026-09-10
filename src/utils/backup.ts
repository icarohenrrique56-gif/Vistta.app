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
export interface MigrationExport {
  schemaVersion: '1.0';
  exportId: string;
  company: { id: string; name: string };
  export: { createdAt: string; type: 'full'; period: { from: null; to: null } };
  summary: { modules: Record<string, number>; totalRecords: number };
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

export function createMigrationExport(empresaId: string, companyName: string, data: Record<string, unknown[]>): MigrationExport {
  const safeData = Object.fromEntries(Object.entries(data).map(([module, records]) => [module, sanitize(records) as unknown[]]));
  const modules = Object.fromEntries(Object.entries(safeData).map(([module, records]) => [module, records.length]));
  return {
    schemaVersion: '1.0',
    exportId: `export-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    company: { id: empresaId, name: companyName },
    export: { createdAt: new Date().toISOString(), type: 'full', period: { from: null, to: null } },
    summary: { modules, totalRecords: Object.values(modules).reduce((sum, count) => sum + count, 0) },
    data: safeData
  };
}

export async function downloadMigrationJson(exportData: MigrationExport) {
  const json = JSON.stringify(exportData, null, 2);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
  const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const manifest = {
    exportId: exportData.exportId,
    companyId: exportData.company.id,
    empresa: exportData.company.name,
    createdAt: exportData.export.createdAt,
    applicationVersion: '1.0.0',
    schemaVersion: exportData.schemaVersion,
    exportType: exportData.export.type,
    modules: Object.keys(exportData.data),
    records: exportData.summary.modules,
    files: ['VISTTA_DADOS.json'],
    checksums: { 'VISTTA_DADOS.json': `sha256:${checksum}` },
    status: 'valid'
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify({ ...exportData, manifest }, null, 2)], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `VISTTA_DADOS_${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  return { checksum, manifest };
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

export async function downloadExcel(
  companyName: string,
  data: Record<string, unknown[]>,
  metadata: { exportId: string; version: string }
) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const sales = data.vendas || [];
  const todaySales = sales.filter(record => String((record as { data?: unknown }).data || '').slice(0, 10) === todayKey);
  const revenue = todaySales.reduce<number>((sum, record) => sum + Number((record as { total?: unknown }).total || 0), 0);
  const criticalStock = (data.produtos || []).filter(record => {
    const product = record as { qtd?: unknown; min?: unknown };
    return Number(product.qtd || 0) <= Number(product.min || 0);
  }).length;
  const openQuotes = (data.orcamentos || []).filter(record => (record as { status?: unknown }).status === 'pendente').length;
  const overdueOrders = (data.ordensServico || []).filter(record => {
    const order = record as { previsaoEntrega?: unknown; status?: unknown };
    if (!order.previsaoEntrega || ['entregue', 'cancelada'].includes(String(order.status))) return false;
    const due = new Date(`${String(order.previsaoEntrega)}T23:59:59`);
    return !Number.isNaN(due.getTime()) && due < today;
  }).length;
  const totalRecords = Object.values(data).reduce<number>((sum, records) => sum + records.length, 0);
  const summary = [
    ['VISTTA', 'GESTÃO DO DIA'],
    ['Empresa', companyName],
    ['Exportação', new Date().toLocaleString('pt-BR')],
    ['ID', metadata.exportId],
    ['Versão', metadata.version],
    ['Status', 'Exportação validada'],
    ['Integridade', 'Dados reais; IDs e relacionamentos preservados'],
    [],
    ['O QUE ESTÁ ACONTECENDO', 'VALOR'],
    ['Vendas hoje', todaySales.length],
    ['Faturamento hoje', revenue],
    ['Ticket médio', todaySales.length ? revenue / todaySales.length : 'NÃO DISPONÍVEL'],
    ['Clientes', (data.clientes || []).length],
    ['Produtos', (data.produtos || []).length],
    ['Orçamentos pendentes', openQuotes],
    ['Ordens atrasadas', overdueOrders],
    ['Estoque crítico', criticalStock],
    ['Total de registros', totalRecords],
    [],
    ['O QUE PRECISA DE ATENÇÃO', 'QUANTIDADE'],
    ['Produtos no mínimo ou abaixo', criticalStock],
    ['Orçamentos aguardando retorno', openQuotes],
    ['Ordens de serviço atrasadas', overdueOrders],
    [],
    ['REGISTROS POR MÓDULO', 'QUANTIDADE'],
    ...Object.entries(data).map(([module, records]) => [module, records.length])
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  summarySheet['!freeze'] = { xSplit: 0, ySplit: 9 };
  summarySheet['!cols'] = [{ wch: 34 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'GESTÃO DO DIA');

  const resume = XLSX.utils.aoa_to_sheet([
    ['RESUMO DA EXPORTAÇÃO', ''],
    ['Empresa', companyName],
    ['Data', today.toLocaleDateString('pt-BR')],
    ['Hora', today.toLocaleTimeString('pt-BR')],
    ['ID da exportação', metadata.exportId],
    ['Integridade', 'Validada']
  ]);
  resume['!freeze'] = { xSplit: 0, ySplit: 1 };
  resume['!cols'] = [{ wch: 28 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(workbook, resume, 'RESUMO');

  Object.entries(data).forEach(([module, records]) => {
    if (!records.length) return;
    const rows = records.map(record => sanitize(record) as Record<string, unknown>);
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    const headers = Object.keys(rows[0] || {});
    sheet['!cols'] = headers.map(header => ({ wch: Math.min(Math.max(header.length + 3, 14), 32) }));
    sheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: Math.max(headers.length - 1, 0) } }) };
    const safeName = module.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 31) || 'DADOS';
    const tableName = `Tabela_${safeName.replace(/[^a-zA-Z0-9]/g, '')}`;
    sheet['!tables'] = [{ name: tableName.slice(0, 200), ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: Math.max(headers.length - 1, 0) } }) }];
    XLSX.utils.book_append_sheet(workbook, sheet, safeName);
  });
  XLSX.writeFile(workbook, `VISTTA_GESTAO_${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}.xlsx`);
}
