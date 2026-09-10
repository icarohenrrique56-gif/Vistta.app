import React, { useEffect, useState } from 'react';
import { Activity, Building2, CheckCircle2, Lock, ShieldAlert, Users, Unlock, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { FeedbackAlert, ScreenHeader } from '../components/SharedUI';

interface Overview {
  generatedAt: string;
  users: { total: number; active: number; blocked: number; newLast30Days: number };
  companies: { total: number; active: number; blocked: number; newLast30Days: number };
  recentLogins: Array<{ uid: string; email?: string; lastLoginAt?: string }>;
  recentActivity: Array<{ id: string; action?: string; actorUid?: string; timestamp?: string }>;
  security: { mfa: string; suspiciousAttempts: string };
  billing: { configured: boolean; message: string };
}

interface CompanyRow { companyId: string; info: { nome?: string; status?: string; criadoEm?: string }; userCount: number }

export function PlatformAdminScreen() {
  const { platformOwner, getPlatformOverview, listPlatformCompanies, setPlatformCompanyStatus } = useAppContext();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingCompany, setUpdatingCompany] = useState('');

  const load = async () => {
    if (!platformOwner) return;
    setLoading(true);
    setError('');
    try {
      const [overviewResult, companiesResult] = await Promise.all([getPlatformOverview(), listPlatformCompanies()]);
      setOverview((overviewResult as any).data);
      setCompanies((companiesResult as any).data.companies || []);
    } catch (loadError: any) {
      setError(loadError?.message || 'Não foi possível carregar o painel global.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [platformOwner]);

  if (!platformOwner) {
    return <div className="mx-auto max-w-xl"><FeedbackAlert>Você não possui autorização para acessar o painel global.</FeedbackAlert></div>;
  }

  const toggleCompany = async (company: CompanyRow) => {
    const status = company.info.status === 'blocked' ? 'active' : 'blocked';
    setUpdatingCompany(company.companyId);
    try {
      await setPlatformCompanyStatus(company.companyId, status);
      setCompanies(current => current.map(item => item.companyId === company.companyId ? { ...item, info: { ...item.info, status } } : item));
    } catch (updateError: any) {
      setError(updateError?.message || 'Não foi possível atualizar a empresa.');
    } finally {
      setUpdatingCompany('');
    }
  };

  return <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
    <ScreenHeader eyebrow="Platform / Owner" title="Administração global" description="Visão operacional baseada exclusivamente nos dados reais do Firebase." action={<button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl bg-[var(--vistta-plum)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--vistta-violet)] disabled:opacity-60">{loading ? 'Atualizando...' : 'Atualizar dados'}</button>} />
    {error && <FeedbackAlert>{error}</FeedbackAlert>}
    {loading && !overview ? <div className="rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-10 text-center text-sm font-semibold text-[var(--vistta-secondary)]">Carregando indicadores globais...</div> : overview && <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Empresas" value={overview.companies.total} detail={`${overview.companies.active} ativas · ${overview.companies.blocked} bloqueadas`} icon={Building2} />
        <Metric label="Usuários" value={overview.users.total} detail={`${overview.users.active} ativos · ${overview.users.blocked} bloqueados`} icon={Users} />
        <Metric label="Novos cadastros" value={overview.companies.newLast30Days + overview.users.newLast30Days} detail="Últimos 30 dias" icon={Activity} />
        <Metric label="Receita / planos" value={overview.billing.configured ? 'Configurado' : 'Não configurado'} detail={overview.billing.message} icon={Wallet} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <section className="overflow-hidden rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] shadow-[0_10px_35px_rgba(48,32,77,.05)]"><div className="border-b border-[var(--vistta-border)] p-5"><h2 className="font-display text-lg font-bold">Empresas cadastradas</h2><p className="mt-1 text-xs text-[var(--vistta-secondary)]">Ações aplicadas pelo backend com auditoria.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-[var(--vistta-border)] text-[11px] uppercase tracking-wider text-[var(--vistta-secondary)]"><th className="px-5 py-4">Empresa</th><th className="px-5 py-4">Usuários</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Ação</th></tr></thead><tbody>{companies.map(company => <tr key={company.companyId} className="border-b border-[var(--vistta-border)] last:border-0"><td className="px-5 py-4"><strong className="block text-sm">{company.info.nome || 'Sem nome'}</strong><small className="text-xs text-[var(--vistta-secondary)]">{company.companyId}</small></td><td className="px-5 py-4 text-sm">{company.userCount}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${company.info.status === 'blocked' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{company.info.status === 'blocked' ? 'Bloqueada' : 'Ativa'}</span></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => void toggleCompany(company)} disabled={updatingCompany === company.companyId} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[var(--vistta-violet)] hover:bg-[var(--vistta-lavender)] disabled:opacity-50">{company.info.status === 'blocked' ? <Unlock size={15} /> : <Lock size={15} />}{updatingCompany === company.companyId ? 'Atualizando...' : company.info.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}</button></td></tr>)}</tbody></table></div></section>
        <section className="space-y-6"><Panel title="Segurança"><InfoRow icon={ShieldAlert} label="MFA do OWNER" value={overview.security.mfa === 'not_configured' ? 'Não configurado' : overview.security.mfa} warning={overview.security.mfa === 'not_configured'} /><InfoRow icon={ShieldAlert} label="Tentativas suspeitas" value={overview.security.suspiciousAttempts === 'not_collected' ? 'Não coletadas' : overview.security.suspiciousAttempts} warning /></Panel><Panel title="Atividade recente">{overview.recentActivity.length ? overview.recentActivity.slice(0, 6).map(item => <div key={item.id} className="flex items-start gap-3 border-b border-[var(--vistta-border)] py-3 last:border-0"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" /><div><p className="text-sm font-semibold">{item.action || 'Atividade registrada'}</p><small className="text-xs text-[var(--vistta-secondary)]">{item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : 'Data não informada'}</small></div></div>) : <p className="text-sm text-[var(--vistta-secondary)]">Nenhuma atividade global registrada.</p>}</Panel></section>
      </div>
    </>}
  </div>;
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: React.ElementType }) { return <div className="rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-5 shadow-[0_10px_35px_rgba(48,32,77,.05)]"><div className="mb-4 flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--vistta-lavender)] text-[var(--vistta-violet)]"><Icon size={19} /></span><span className="h-2 w-2 rounded-full bg-[var(--vistta-lime)]" /></div><p className="text-[11px] font-bold uppercase tracking-wider text-[var(--vistta-secondary)]">{label}</p><strong className="mt-1 block font-display text-2xl">{value}</strong><p className="mt-1 text-xs text-[var(--vistta-secondary)]">{detail}</p></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-5 shadow-[0_10px_35px_rgba(48,32,77,.05)]"><h2 className="mb-3 font-display text-lg font-bold">{title}</h2>{children}</section>; }
function InfoRow({ icon: Icon, label, value, warning }: { icon: React.ElementType; label: string; value: string; warning?: boolean }) { return <div className="flex items-center justify-between gap-3 border-b border-[var(--vistta-border)] py-3 last:border-0"><span className="flex items-center gap-2 text-sm font-semibold"><Icon size={16} className={warning ? 'text-amber-500' : 'text-emerald-500'} />{label}</span><span className="text-right text-xs text-[var(--vistta-secondary)]">{value}</span></div>; }
