import React, { useMemo, useState } from 'react';
import { Archive, CheckCircle2, Download, ShieldCheck } from 'lucide-react';
import { ScreenHeader, FeedbackAlert } from '../components/SharedUI';
import { useAppContext } from '../context/AppContext';
import { createBackup, downloadBackup, listLocalBackups, saveLocalBackup } from '../utils/backup';

export function BackupScreen() {
  const { empresaId, dadosEmpresa, produtos, clientes, vendas, caixas, orcamentos, ordensServico, fornecedores, contas, categorias, usuarios } = useAppContext();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const history = useMemo(() => listLocalBackups(), [status]);
  const exportar = async (download: boolean) => {
    if (!empresaId) return;
    setError('');
    try {
      const backup = await createBackup(empresaId, { produtos, clientes, vendas, caixas, orcamentos, ordensServico, fornecedores, contas, categorias, usuarios });
      saveLocalBackup(backup);
      if (download) downloadBackup(backup);
      setStatus(`Backup ${backup.manifest.id} validado com SHA-256.`);
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : 'Não foi possível criar o backup.');
    }
  };
  return <div className="flex h-full flex-col">
    <ScreenHeader eyebrow="Configurações" title="Backup e Exportação" description="Exporte uma cópia local dos dados carregados da sua ótica, sem senhas, tokens ou secrets." action={<button onClick={() => void exportar(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--vistta-plum)] px-5 py-3 font-semibold text-white hover:bg-[var(--vistta-violet)]"><Download size={18} /> Exportar JSON</button>} />
    {status && <FeedbackAlert type="success">{status}</FeedbackAlert>}
    {error && <div className="mt-4"><FeedbackAlert>{error}</FeedbackAlert></div>}
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Archive className="text-[var(--vistta-violet)]" /><h2 className="font-bold">Backup local</h2></div><p className="mt-3 text-sm leading-6 text-slate-500">O backup é gerado no navegador, identificado por empresa, data, versão, contagem e checksum. Ele não altera nem apaga dados do Firebase.</p><button onClick={() => void exportar(false)} className="mt-5 rounded-xl border border-[var(--vistta-border)] px-4 py-2 text-sm font-bold text-[var(--vistta-plum)] hover:bg-[var(--vistta-lavender)]">Criar backup local</button></section>
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><ShieldCheck className="text-emerald-600" /><h2 className="font-bold">Escopo e segurança</h2></div><p className="mt-3 text-sm leading-6 text-slate-500">Empresa: <strong>{dadosEmpresa?.nome || empresaId || 'não identificada'}</strong>. O exportador remove chaves com aparência de senha, token, secret, API key ou credencial.</p><p className="mt-3 text-xs text-amber-700">Restauração automática e backup em nuvem não estão habilitados: operações críticas devem ser revisadas antes de qualquer importação.</p></section>
    </div>
    <section className="mt-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="font-bold">Histórico local recente</h2>{history.length ? <div className="mt-4 space-y-3">{history.map(item => <div key={item.manifest.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm"><span><strong>{item.manifest.createdAt.replace('T', ' ').slice(0, 19)}</strong><small className="ml-2 text-slate-400">{item.manifest.id}</small></span><span className="flex items-center gap-2 text-emerald-700"><CheckCircle2 size={15} /> SHA-256 {item.checksum.slice(0, 12)}…</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Nenhum backup local criado ainda.</p>}</section>
  </div>;
}
