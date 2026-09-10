import React from 'react';
import { Boxes, TrendingUp, Users, AlertTriangle, ShoppingCart, ArrowUpRight, FileText, Wrench, UserPlus, Search, Activity, Clock3 } from 'lucide-react';
import { useAppContext, formatMoney } from '../context/AppContext';
import { ActionCard, DashCard, ScreenHeader } from '../components/SharedUI';

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DashboardScreen() {
  const { produtos, vendas, clientes, orcamentos, ordensServico, caixaAberto, setActiveTab, user, userRole } = useAppContext();
  const isSeller = userRole === 'seller';
  const now = new Date();
  const todayKey = localDateKey(now);
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const estoqueTotal = produtos.reduce((acc, p) => acc + Number(p.qtd || 0), 0);
  const vendasTotal = vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const vendasHoje = vendas.filter(v => localDateKey(new Date(v.data)) === todayKey);
  const vendasMes = vendas.filter(v => String(v.data || '').startsWith(monthPrefix));
  const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const faturamentoMes = vendasMes.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const estoqueCritico = produtos.filter(p => Number(p.qtd) < Number(p.min)).length;
  const orcamentosPendentes = orcamentos.filter(o => o.status === 'pendente').length;
  const osPendentes = ordensServico.filter(o => !['entregue', 'cancelada'].includes(o.status)).length;
  const osProntas = ordensServico.filter(o => o.status === 'pronto_retirada').length;
  const osAtrasadas = ordensServico.filter(o => {
    if (!o.previsaoEntrega || ['entregue', 'cancelada'].includes(o.status)) return false;
    const prazo = new Date(`${o.previsaoEntrega}T23:59:59`);
    return !Number.isNaN(prazo.getTime()) && prazo < now;
  }).length;
  const clientesParaRetorno = clientes.filter(cliente => {
    const lastPurchase = cliente.ultimaCompraOculos || cliente.ultimaCompraLente;
    if (!lastPurchase) return true;
    const date = new Date(lastPurchase);
    return !Number.isNaN(date.getTime()) && (now.getTime() - date.getTime()) > 365 * 24 * 60 * 60 * 1000;
  }).length;
  const salesByDay = vendas.reduce<Record<string, number>>((acc, venda) => {
    const date = new Date(venda.data);
    if (Number.isNaN(date.getTime())) return acc;
    const key = localDateKey(date);
    acc[key] = (acc[key] || 0) + Number(venda.total || 0);
    return acc;
  }, {});
  const chartEntries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return [date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), salesByDay[key] || 0] as [string, number];
  });
  const chartMax = Math.max(...chartEntries.map(([, value]) => value), 1);
  const chartPoints = chartEntries.length > 1
    ? chartEntries.map(([, value], index) => `${(index / (chartEntries.length - 1)) * 100},${100 - (value / chartMax) * 78}`).join(' ')
    : '';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';
  const displayName = user?.displayName || user?.email?.split('@')[0] || '';
  const lastContext = (() => {
    try { return JSON.parse(localStorage.getItem('vistta:last-context') || 'null') as { tab?: string; at?: string } | null; } catch { return null; }
  })();
  const lastContextLabel: Record<string, string> = { vendas: 'PDV', clientes: 'Clientes', estoque: 'Estoque', caixa: 'Caixa Diário', orcamentos: 'Orçamentos', ordens: 'Ordens de Serviço' };
  const attentionItems = [
    { label: `${osAtrasadas} pedido${osAtrasadas === 1 ? '' : 's'} atrasado${osAtrasadas === 1 ? '' : 's'}`, detail: 'Revisar prazos das OS', count: osAtrasadas, tab: 'ordens', tone: 'bg-rose-50 text-rose-700' },
    { label: `${orcamentosPendentes} orçamento${orcamentosPendentes === 1 ? '' : 's'} pendente${orcamentosPendentes === 1 ? '' : 's'}`, detail: 'Retomar contato com clientes', count: orcamentosPendentes, tab: 'orcamentos', tone: 'bg-amber-50 text-amber-700' },
    { label: `${estoqueCritico} produto${estoqueCritico === 1 ? '' : 's'} com estoque baixo`, detail: 'Ver itens críticos', count: estoqueCritico, tab: 'estoque', tone: 'bg-orange-50 text-orange-700' },
    { label: `${clientesParaRetorno} cliente${clientesParaRetorno === 1 ? '' : 's'} para retorno`, detail: 'Revisar relacionamento', count: clientesParaRetorno, tab: 'clientes', tone: 'bg-indigo-50 text-indigo-700' }
  ].filter(item => item.count > 0);
  
  return (
    <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col gap-4 pb-2 vistta-enter sm:gap-5">
      <ScreenHeader eyebrow="Visão operacional" title={`${greeting}${displayName ? `, ${displayName}` : ''}.`} description="O essencial da operação, organizado para uma decisão rápida." action={<div className={`inline-flex self-start items-center gap-2 rounded-full px-3 py-2 text-[10px] font-bold sm:text-xs ${caixaAberto ? 'bg-[#ecf8d9] text-[#476e17]' : 'bg-[#f3edf7] text-[#765d82]'}`}>
          <span className={`h-2 w-2 rounded-full ${caixaAberto ? 'bg-[#81b52c]' : 'bg-[#aa8fb8]'}`} /> Caixa {caixaAberto ? 'aberto' : 'fechado'}
        </div>} />

      <div className="mb-1 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <DashCard title={isSeller ? "Minhas vendas hoje" : "Faturamento hoje"} value={formatMoney(faturamentoHoje)} subtitle={`${vendasHoje.length} venda${vendasHoje.length === 1 ? '' : 's'} hoje`} icon={TrendingUp} onClick={() => setActiveTab(isSeller ? 'minhas-vendas' : 'vendas')} color="text-emerald-500" />
        <DashCard title={isSeller ? "Minhas vendas no mês" : "Faturamento do mês"} value={formatMoney(faturamentoMes)} subtitle={`${vendasMes.length} venda${vendasMes.length === 1 ? '' : 's'} no período`} icon={TrendingUp} onClick={() => setActiveTab(isSeller ? 'minhas-vendas' : 'vendas')} color="text-emerald-500" />
        <DashCard title="Clientes Base" value={clientes.length} subtitle="cadastros ativos" icon={Users} onClick={() => setActiveTab('clientes')} />
        <DashCard title="Estoque Crítico" value={estoqueCritico} subtitle={estoqueCritico ? 'requer atenção' : 'operação saudável'} icon={AlertTriangle} onClick={() => setActiveTab('estoque')} bg={estoqueCritico ? 'bg-[#fff5ed]' : 'bg-white dark:bg-slate-800'} color={estoqueCritico ? 'text-orange-500' : 'text-emerald-500'} border={estoqueCritico ? 'border-orange-100' : 'border-slate-100 dark:border-slate-700'} />
      </div>

      <section className="rounded-[22px] border border-[#e7e1ec] bg-white p-4 shadow-[0_10px_35px_rgba(48,32,77,.05)] dark:border-[#3d3154] dark:bg-[#211936] sm:rounded-[26px] sm:p-6">
        <div className="mb-4 flex items-center justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#6d4aff] sm:text-xs">Meu dia</p><h2 className="font-display text-lg font-bold text-[#201735] dark:text-white sm:text-xl">O que exige atenção agora</h2></div><Clock3 size={20} className="text-[#6d4aff]" /></div>
        <div className="grid gap-3 md:grid-cols-3">
          {attentionItems.length ? attentionItems.map(item => <button key={item.label} onClick={() => setActiveTab(item.tab)} className={`flex items-center justify-between rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5 ${item.tone}`}><span><strong className="block text-sm">{item.label}</strong><small className="mt-1 block opacity-75">{item.detail}</small></span><ArrowUpRight size={17} /></button>) : <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 md:col-span-3">Tudo em ordem por enquanto. Continue acompanhando suas vendas e o caixa.</div>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-[#f7f3ff] p-3"><small className="block text-xs text-slate-500">Vendas hoje</small><strong className="text-lg text-[#30204d]">{vendasHoje.length}</strong></div><div className="rounded-2xl bg-[#edf8f4] p-3"><small className="block text-xs text-slate-500">Caixa</small><strong className="text-lg text-[#30204d]">{formatMoney(caixaAberto ? faturamentoHoje : 0)}</strong></div><div className="rounded-2xl bg-[#fff5ed] p-3"><small className="block text-xs text-slate-500">Orçamentos</small><strong className="text-lg text-[#30204d]">{orcamentosPendentes}</strong></div><div className="rounded-2xl bg-[#eeeaff] p-3"><small className="block text-xs text-slate-500">OS abertas</small><strong className="text-lg text-[#30204d]">{osPendentes}</strong></div></div>
      </section>
      {lastContext?.tab && lastContext.tab !== 'dashboard' && <section className="flex items-center justify-between gap-4 rounded-[22px] border border-[#e7e1ec] bg-[#f7f3ff] p-4 dark:border-[#3d3154] dark:bg-[#2d2544] sm:p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6d4aff]">Continue de onde parou</p><p className="mt-1 text-sm font-semibold text-[#30204d] dark:text-white">Você estava trabalhando em {lastContextLabel[lastContext.tab] || lastContext.tab}.</p><small className="text-xs text-slate-500">O contexto é salvo apenas neste navegador.</small></div><button onClick={() => setActiveTab(lastContext.tab || 'dashboard')} className="shrink-0 rounded-xl bg-[#30204d] px-4 py-2 text-xs font-bold text-white">Continuar</button></section>}

      <div className="mb-1 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_.8fr]">
        <section className="relative overflow-hidden rounded-[22px] bg-[#30204d] p-4 text-white shadow-[0_18px_45px_rgba(48,32,77,.15)] sm:rounded-[26px] sm:p-6 sm:p-7">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" /><div className="absolute -top-8 right-5 h-36 w-36 rounded-full border border-[#c6ed76]/20" />
          <div className="relative mb-5 flex items-start justify-between gap-4 sm:mb-8"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#c6ed76] sm:text-xs">Resumo de vendas</p><h2 className="font-display text-lg font-bold sm:text-xl">O ritmo da sua operação</h2></div><TrendingUp className="text-[#c6ed76]" size={20} /></div>
          {chartEntries.length > 0 ? <>
            <div className="relative mb-3 h-[120px] sm:h-[150px]"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible"><defs><linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c6ed76" stopOpacity=".35" /><stop offset="1" stopColor="#c6ed76" stopOpacity="0" /></linearGradient></defs><polyline points={`0,100 ${chartPoints} 100,100`} fill="url(#sales-fill)" stroke="none" /><polyline points={chartPoints} fill="none" stroke="#c6ed76" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg></div>
            <div className="flex justify-between text-[10px] text-white/45 sm:text-[11px]">{chartEntries.map(([day]) => <span key={day}>{day}</span>)}</div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4"><div><p className="mb-1 text-[10px] text-white/45 sm:text-xs">Ticket médio</p><strong className="text-base sm:text-lg">{formatMoney(vendas.length ? vendasTotal / vendas.length : 0)}</strong></div><div><p className="mb-1 text-[10px] text-white/45 sm:text-xs">Total registrado</p><strong className="text-base sm:text-lg">{formatMoney(vendasTotal)}</strong></div></div>
          </> : <div className="flex h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 text-center sm:h-[220px]"><Activity size={22} className="mb-3 text-white/40" /><p className="text-sm text-white/70">Ainda não há vendas para formar o resumo.</p><button onClick={() => setActiveTab('vendas')} className="mt-3 text-xs font-bold text-[#c6ed76] hover:underline">Abrir PDV <ArrowUpRight size={13} className="inline" /></button></div>}
        </section>

        <section className="rounded-[22px] border border-[#e7e1ec] bg-white p-4 shadow-[0_10px_35px_rgba(48,32,77,.05)] dark:border-[#3d3154] dark:bg-[#211936] sm:rounded-[26px] sm:p-6"><div className="mb-4 flex items-center justify-between sm:mb-6"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#6d4aff] sm:text-xs">Atenção</p><h2 className="font-display text-lg font-bold text-[#201735] dark:text-white sm:text-xl">Alertas inteligentes</h2></div><AlertTriangle size={20} className="text-[#f4a261]" /></div><div className="space-y-2.5 sm:space-y-3">
          <button onClick={() => setActiveTab('estoque')} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#fff5ed] p-3 text-left transition-colors hover:bg-[#4b3540] dark:bg-[#3b2a35] sm:p-3"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-orange-500 dark:bg-[#211936] sm:h-8 sm:w-8"><Boxes size={16} /></span><span><strong className="block text-sm text-[#3b2a45] dark:text-white">Estoque crítico</strong><small className="text-xs text-slate-500 dark:text-[#b9afca]">{estoqueCritico ? `${estoqueCritico} item(ns) abaixo do mínimo` : 'Nenhum item abaixo do mínimo'}</small></span></span><ArrowUpRight size={16} className="text-slate-400" /></button>
          <button onClick={() => setActiveTab('orcamentos')} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#f7f3ff] p-3 text-left transition-colors hover:bg-[#3a3155] dark:bg-[#2d2544] sm:p-3"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#6d4aff] dark:bg-[#211936] sm:h-8 sm:w-8"><FileText size={16} /></span><span><strong className="block text-sm text-[#3b2a45] dark:text-white">Orçamentos pendentes</strong><small className="text-xs text-slate-500 dark:text-[#b9afca]">{orcamentosPendentes} aguardando retorno</small></span></span><ArrowUpRight size={16} className="text-slate-400" /></button>
          <button onClick={() => setActiveTab('ordens')} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#edf8f4] p-3 text-left transition-colors hover:bg-[#294b45] dark:bg-[#203a36] sm:p-3"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-emerald-600 dark:bg-[#211936] sm:h-8 sm:w-8"><Wrench size={16} /></span><span><strong className="block text-sm text-[#3b2a45] dark:text-white">Ordens em andamento</strong><small className="text-xs text-slate-500 dark:text-[#b9afca]">{osPendentes} aguardando conclusão</small></span></span><ArrowUpRight size={16} className="text-slate-400" /></button>
          <button onClick={() => setActiveTab('ordens')} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#fff1f0] p-3 text-left transition-colors hover:bg-[#533441] dark:bg-[#422b37] sm:p-3"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-rose-500 dark:bg-[#211936] sm:h-8 sm:w-8"><AlertTriangle size={16} /></span><span><strong className="block text-sm text-[#3b2a45] dark:text-white">Prazo das OS</strong><small className="text-xs text-slate-500 dark:text-[#b9afca]">{osAtrasadas} atrasada{osAtrasadas === 1 ? '' : 's'} · {osProntas} pronta{osProntas === 1 ? '' : 's'}</small></span></span><ArrowUpRight size={16} className="text-slate-400" /></button>
        </div></section>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between sm:mb-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#6d4aff] sm:text-xs">Atalhos da rotina</p><h2 className="font-display text-lg font-bold text-[#201735] dark:text-white sm:text-xl">O que você quer fazer?</h2></div></div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"><ActionCard icon={ShoppingCart} title="Nova venda" desc="Abrir o ponto de venda" onClick={() => setActiveTab('vendas')} color="text-[#6d4aff]" bg="bg-[#eeeaff]" /><ActionCard icon={FileText} title="Novo orçamento" desc="Montar uma proposta" onClick={() => setActiveTab('orcamentos')} color="text-[#9c65d8]" bg="bg-[#f7effb]" /><ActionCard icon={UserPlus} title="Novo cliente" desc="Cadastrar uma pessoa" onClick={() => setActiveTab('clientes')} color="text-emerald-600" bg="bg-[#edf8f4]" /><ActionCard icon={Search} title="Consultar estoque" desc="Encontrar uma peça" onClick={() => setActiveTab('estoque')} color="text-orange-500" bg="bg-[#fff5ed]" /></div>
      </section>
    </div>
  );
}
// Siga este mesmo padrão de importação de Hooks e Componentes isolados para as outras telas (PdvScreen, EstoqueScreen, etc).
