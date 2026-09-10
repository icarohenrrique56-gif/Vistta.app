import React, { useMemo, useRef, useState } from 'react';
import { Archive, CheckCircle2, Clock3, Download, FileCheck2, FileSpreadsheet, FileText, LockKeyhole, RefreshCw, Settings2, ShieldCheck, Upload } from 'lucide-react';
import { ScreenHeader, FeedbackAlert } from '../components/SharedUI';
import { useAppContext } from '../context/AppContext';
import { backupSize, createBackup, downloadBackup, downloadCsv, formatBytes, listLocalBackups, saveLocalBackup, validateBackup, type BackupRecord } from '../utils/backup';

const MODULES = ['produtos', 'clientes', 'vendas', 'caixas', 'orcamentos', 'ordensServico', 'fornecedores', 'contas', 'categorias', 'usuarios'] as const;

export function BackupScreen() {
  const context = useAppContext();
  const { empresaId, dadosEmpresa } = context;
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [automatic, setAutomatic] = useState(() => localStorage.getItem('vistta:backup-auto') === 'true');
  const [time, setTime] = useState(() => localStorage.getItem('vistta:backup-time') || '18:00');
  const [retention, setRetention] = useState(() => localStorage.getItem('vistta:backup-retention') || '5');
  const [history, setHistory] = useState(listLocalBackups());
  const fileInput = useRef<HTMLInputElement>(null);
  const data = useMemo(() => ({
    produtos: context.produtos, clientes: context.clientes, vendas: context.vendas, caixas: context.caixas,
    orcamentos: context.orcamentos, ordensServico: context.ordensServico, fornecedores: context.fornecedores,
    contas: context.contas, categorias: context.categorias, usuarios: context.usuarios
  } as Record<typeof MODULES[number], unknown[]>), [context.produtos, context.clientes, context.vendas, context.caixas, context.orcamentos, context.ordensServico, context.fornecedores, context.contas, context.categorias, context.usuarios]);
  const latest = history[0];
  const totalRecords = latest ? Object.values(latest.manifest.recordCounts).reduce((sum, count) => sum + count, 0) : 0;

  const create = async (download: boolean) => {
    if (!empresaId) return setError('A empresa ainda não foi identificada.');
    setError('');
    try {
      const backup = await createBackup(empresaId, data);
      const validation = await validateBackup(backup);
      if (!validation.valid) throw new Error(validation.reason || 'O backup não passou na validação.');
      saveLocalBackup(backup);
      setHistory(listLocalBackups());
      if (download) downloadBackup(backup);
      setStatus(`Backup validado: ${validation.recordCount} registros, ${formatBytes(validation.size)}.`);
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : 'Não foi possível criar o backup.');
    }
  };
  const exportModule = (module: typeof MODULES[number]) => downloadCsv(`vistta-${module}`, data[module]);
  const validateFile = async (file: File) => {
    try {
      const result = await validateBackup(JSON.parse(await file.text()));
      setStatus(result.valid ? `Arquivo válido: ${result.recordCount} registros, ${formatBytes(result.size)}.` : `Arquivo inválido: ${result.reason}`);
    } catch {
      setError('Não foi possível ler o arquivo selecionado.');
    }
  };
  const setAuto = (value: boolean) => {
    setAutomatic(value);
    localStorage.setItem('vistta:backup-auto', String(value));
    localStorage.setItem('vistta:backup-time', time);
    localStorage.setItem('vistta:backup-retention', retention);
  };

  return <div className="flex h-full flex-col">
    <ScreenHeader eyebrow="Configurações" title="Backup e Exportação" description="Proteja e utilize os dados da sua ótica. Backup é recuperação; exportação é portabilidade." action={<button onClick={() => void create(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--vistta-plum)] px-5 py-3 font-semibold text-white hover:bg-[var(--vistta-violet)]"><Archive size={18} /> Fazer backup agora</button>} />
    {status && <div className="mb-4"><FeedbackAlert type="success">{status}</FeedbackAlert></div>}
    {error && <div className="mb-4"><FeedbackAlert>{error}</FeedbackAlert></div>}

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {([
        ['Último backup', latest ? new Date(latest.manifest.createdAt).toLocaleString('pt-BR') : 'Nunca', Clock3],
        ['Próximo backup', automatic ? `Hoje às ${time}` : 'Desativado', RefreshCw],
        ['Integridade', latest ? 'SHA-256 válido' : 'Sem backup', ShieldCheck],
        ['Registros', latest ? totalRecords : '—', FileCheck2],
        ['Tamanho', latest ? formatBytes(backupSize(latest)) : '—', Archive]
      ] as const).map(([label, value, Icon]) => <div key={String(label)} className="rounded-2xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-4"><Icon size={17} className="mb-3 text-[var(--vistta-violet)]" /><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--vistta-secondary)]">{label}</p><strong className="mt-1 block truncate text-sm text-[var(--vistta-ink)] dark:text-white">{String(value)}</strong></div>)}
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--vistta-violet)]">BACKUP · recuperação</p><h2 className="mt-1 text-lg font-bold text-[var(--vistta-ink)] dark:text-white">Proteção dos dados</h2></div><button onClick={() => void create(false)} className="rounded-xl border border-[var(--vistta-border)] px-3 py-2 text-xs font-bold">Criar cópia local</button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={() => fileInput.current?.click()} className="flex items-center gap-3 rounded-2xl bg-[var(--vistta-muted-surface)] p-4 text-left"><Upload className="text-[var(--vistta-violet)]" /><span><strong className="block text-sm">Validar backup</strong><small className="text-xs text-[var(--vistta-secondary)]">Ler manifest e checksum</small></span></button><div className="rounded-2xl bg-[var(--vistta-muted-surface)] p-4"><div className="flex items-center gap-2"><LockKeyhole size={18} className="text-emerald-600" /><strong className="text-sm">Segurança ativa</strong></div><small className="mt-2 block text-xs text-[var(--vistta-secondary)]">Secrets, tokens e credenciais não são exportados.</small></div></div>
        <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void validateFile(file); event.target.value = ''; }} />
        <div className="mt-5 flex items-center justify-between"><h3 className="font-bold text-[var(--vistta-ink)] dark:text-white">Histórico</h3><span className="text-xs text-[var(--vistta-secondary)]">{history.length} cópia(s) local(is)</span></div>
        <div className="mt-3 space-y-2">{history.length ? history.map(item => <div key={item.manifest.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--vistta-border)] p-3 text-sm"><span><strong>{new Date(item.manifest.createdAt).toLocaleString('pt-BR')}</strong><small className="ml-2 text-[var(--vistta-secondary)]">{Object.values(item.manifest.recordCounts).reduce((a, b) => a + b, 0)} registros · {formatBytes(backupSize(item))}</small></span><span className="flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} /> Íntegro</span></div>) : <p className="text-sm text-[var(--vistta-secondary)]">Nenhum backup local criado ainda.</p>}</div>
      </section>
      <section className="rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--vistta-violet)]">CONFIGURAR</p><h2 className="mt-1 text-lg font-bold text-[var(--vistta-ink)] dark:text-white">Backup automático</h2><p className="mt-2 text-xs leading-5 text-[var(--vistta-secondary)]">A configuração é local e serve como lembrete. Uma SPA não consegue criar arquivo em pasta do Windows com o navegador fechado sem um agente instalado.</p>
        <label className="mt-5 flex items-center justify-between rounded-2xl bg-[var(--vistta-muted-surface)] p-4 text-sm font-bold">Ativar lembrete diário<input type="checkbox" checked={automatic} onChange={event => setAuto(event.target.checked)} className="h-5 w-5 accent-[#6d4aff]" /></label>
        <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-bold text-[var(--vistta-secondary)]">Horário<input type="time" value={time} onChange={event => { setTime(event.target.value); localStorage.setItem('vistta:backup-time', event.target.value); }} className="mt-1 w-full rounded-xl border border-[var(--vistta-border)] bg-transparent p-2 text-sm" /></label><label className="text-xs font-bold text-[var(--vistta-secondary)]">Retenção<input type="number" min="1" max="20" value={retention} onChange={event => { setRetention(event.target.value); localStorage.setItem('vistta:backup-retention', event.target.value); }} className="mt-1 w-full rounded-xl border border-[var(--vistta-border)] bg-transparent p-2 text-sm" /></label></div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><Settings2 size={15} className="mb-1" /> Pasta de destino: download do navegador. Nenhum arquivo anterior é apagado antes da nova cópia ser validada.</div>
      </section>
    </div>
    <section className="mt-6 rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-5 shadow-sm"><div className="flex items-center gap-2"><FileSpreadsheet className="text-[var(--vistta-violet)]" /><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--vistta-violet)]">EXPORTAÇÃO · portabilidade</p><h2 className="mt-1 text-lg font-bold text-[var(--vistta-ink)] dark:text-white">Usar os dados fora do Vistta</h2></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void create(true)} className="flex items-center gap-2 rounded-xl bg-[var(--vistta-lavender)] px-4 py-2 text-sm font-bold text-[var(--vistta-plum)]"><FileText size={16} /> JSON completo</button>{MODULES.map(module => <button key={module} onClick={() => exportModule(module)} className="rounded-xl border border-[var(--vistta-border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--vistta-muted-surface)]">CSV · {module}</button>)}</div><p className="mt-3 text-xs text-[var(--vistta-secondary)]">Excel e PDF não são gerados nesta versão: CSV/JSON são formatos abertos e evitam dependências e custos adicionais.</p></section>
  </div>;
}
