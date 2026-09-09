import React from 'react';
import { Boxes, TrendingUp, Users, AlertTriangle, Wallet, ShoppingCart, ArrowUpRight, FileText, Wrench, UserPlus, Search, Activity } from 'lucide-react';
import { useAppContext, formatMoney } from '../context/AppContext';
import { ActionCard, DashCard } from '../components/SharedUI';

export function DashboardScreen() {
  const { produtos, vendas, clientes, orcamentos, ordensServico, caixaAberto, setActiveTab } = useAppContext();
  const estoqueTotal = produtos.reduce((acc, p) => acc + Number(p.qtd || 0), 0);
  const vendasTotal = vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const estoqueCritico = produtos.filter(p => Number(p.qtd) < Number(p.min)).length;
  const orcamentosPendentes = orcamentos.filter(o => o.status === 'pendente').length;
  const osPendentes = ordensServico.filter(o => !['entregue', 'cancelada'].includes(o.status)).length;
  const salesByDay = vendas.reduce<Record<string, number>>((acc, venda) => {
    const date = new Date(venda.data);
    if (Number.isNaN(date.getTime())) return acc;
    const key = date.toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + Number(venda.total || 0);
    return acc;
  }, {});
  const chartEntries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return [date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), salesByDay[key] || 0] as [string, number];
  });
  const chartMax = Math.max(...chartEntries.map(([, value]) => value), 1);
  const chartPoints = chartEntries.length > 1
    ? chartEntries.map(([, value], index) => `${(index / (chartEntries.length - 1)) * 100},${100 - (value / chartMax) * 78}`).join(' ')
    : '';
  
  return (
    <div className="flex flex-col h-full max-w-[1500px] mx-auto vistta-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#6d4aff] text-xs font-bold uppercase tracking-[.16em] mb-3"><Activity size={14} /> Visão operacional</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-[#201735] dark:text-white">Bom dia, vamos cuidar da ótica.</h1>
          <p className="text-slate-500">O essencial da operação, organizado para uma decisão rápida.</p>
        </div>
        <div className={`inline-flex self-start sm:self-auto items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${caixaAberto ? 'bg-[#ecf8d9] text-[#476e17]' : 'bg-[#f3edf7] text-[#765d82]'}`}>
          <span className={`w-2 h-2 rounded-full ${caixaAberto ? 'bg-[#81b52c]' : 'bg-[#aa8fb8]'}`} /> Caixa {caixaAberto ? 'aberto' : 'fechado'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashCard title="Estoque Total" value={estoqueTotal} subtitle="unidades cadastradas" icon={Boxes} />
        <DashCard title="Vendas do período" value={formatMoney(vendasTotal)} subtitle={`${vendas.length} venda${vendas.length === 1 ? '' : 's'} registrada${vendas.length === 1 ? '' : 's'}`} icon={TrendingUp} color="text-emerald-500" />
        <DashCard title="Clientes Base" value={clientes.length} subtitle="cadastros ativos" icon={Users} />
        <DashCard title="Estoque Crítico" value={estoqueCritico} subtitle={estoqueCritico ? 'requer atenção' : 'operação saudável'} icon={AlertTriangle} bg={estoqueCritico ? 'bg-[#fff5ed]' : 'bg-white dark:bg-slate-800'} color={estoqueCritico ? 'text-orange-500' : 'text-emerald-500'} border={estoqueCritico ? 'border-orange-100' : 'border-slate-100 dark:border-slate-700'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_.8fr] gap-5 mb-5">
        <section className="rounded-[26px] bg-[#30204d] text-white p-6 sm:p-7 overflow-hidden relative shadow-[0_18px_45px_rgba(48,32,77,.15)]">
          <div className="absolute -right-20 -top-24 w-64 h-64 rounded-full border border-white/10" /><div className="absolute right-5 -top-8 w-36 h-36 rounded-full border border-[#c6ed76]/20" />
          <div className="relative flex items-start justify-between gap-4 mb-8"><div><p className="text-[#c6ed76] text-xs font-bold uppercase tracking-[.16em] mb-2">Resumo de vendas</p><h2 className="font-display text-xl font-bold">O ritmo da sua operação</h2></div><TrendingUp className="text-[#c6ed76]" size={22} /></div>
          {chartEntries.length > 0 ? <>
            <div className="relative h-[150px] mb-3"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible"><defs><linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c6ed76" stopOpacity=".35" /><stop offset="1" stopColor="#c6ed76" stopOpacity="0" /></linearGradient></defs><polyline points={`0,100 ${chartPoints} 100,100`} fill="url(#sales-fill)" stroke="none" /><polyline points={chartPoints} fill="none" stroke="#c6ed76" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg></div>
            <div className="flex justify-between text-[11px] text-white/45">{chartEntries.map(([day]) => <span key={day}>{day}</span>)}</div>
            <div className="mt-6 grid grid-cols-2 gap-4"><div><p className="text-white/45 text-xs mb-1">Ticket médio</p><strong className="text-lg">{formatMoney(vendas.length ? vendasTotal / vendas.length : 0)}</strong></div><div><p className="text-white/45 text-xs mb-1">Total registrado</p><strong className="text-lg">{formatMoney(vendasTotal)}</strong></div></div>
          </> : <div className="h-[220px] flex flex-col justify-center items-center text-center border border-dashed border-white/15 rounded-2xl"><Activity size={24} className="text-white/40 mb-3" /><p className="text-sm text-white/70">Ainda não há vendas para formar o resumo.</p><button onClick={() => setActiveTab('vendas')} className="mt-3 text-xs font-bold text-[#c6ed76] hover:underline">Abrir PDV <ArrowUpRight size={13} className="inline" /></button></div>}
        </section>

        <section className="rounded-[26px] bg-white dark:bg-[#211936] border border-[#e7e1ec] dark:border-[#3d3154] p-6 shadow-[0_10px_35px_rgba(48,32,77,.05)]"><div className="flex items-center justify-between mb-6"><div><p className="text-[#6d4aff] text-xs font-bold uppercase tracking-[.16em] mb-2">Atenção</p><h2 className="font-display text-xl font-bold text-[#201735] dark:text-white">Alertas inteligentes</h2></div><AlertTriangle size={21} className="text-[#f4a261]" /></div><div className="space-y-3">
          <button onClick={() => setActiveTab('estoque')} className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#fff5ed] dark:bg-[#3b2a35] hover:bg-[#4b3540] transition-colors text-left"><span className="flex items-center gap-3"><span className="w-8 h-8 rounded-xl bg-white dark:bg-[#211936] flex items-center justify-center text-orange-500"><Boxes size={16} /></span><span><strong className="block text-sm text-[#3b2a45] dark:text-white">Estoque crítico</strong><small className="text-xs text-slate-500 dark:text-[#b9afca]">{estoqueCritico ? `${estoqueCritico} item(ns) abaixo do mínimo` : 'Nenhum item abaixo do mínimo'}</small></span></span><ArrowUpRight size={16} className="text-slate-400" /></button>
          <button onClick={() => setActiveTab('orcamentos')} className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#f7f3ff] dark:bg-[#2d2544] hover:bg-[#3a3155] transition-colors text-left"><span className="flex items-center gap-3"><span className="w-8 h-8 rounded-xl bg-white dark:bg-[#211936] flex items-center justify-center text-[#6d4aff]"><FileText size={16} /></span><span><strong className="block text-sm text-[#3b2a45] dark:text-white">Orçamentos pendentes</strong><small className="text-xs text-slate-500 dark:text-[#b9afca]">{orcamentosPendentes} aguardando retorno</small></span></span><ArrowUpRight size={16} className="text-slate-400" /></button>
          <button onClick={() => setActiveTab('ordens')} className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#edf8f4] dark:bg-[#203a36] hover:bg-[#294b45] transition-colors text-left"><span className="flex items-center gap-3"><span className="w-8 h-8 rounded-xl bg-white dark:bg-[#211936] flex items-center justify-center text-emerald-600"><Wrench size={16} /></span><span><strong className="block text-sm text-[#3b2a45] dark:text-white">Ordens em andamento</strong><small className="text-xs text-slate-500 dark:text-[#b9afca]">{osPendentes} aguardando conclusão</small></span></span><ArrowUpRight size={16} className="text-slate-400" /></button>
        </div></section>
      </div>

      <section><div className="flex items-end justify-between mb-4"><div><p className="text-[#6d4aff] text-xs font-bold uppercase tracking-[.16em] mb-2">Atalhos da rotina</p><h2 className="font-display text-xl font-bold text-[#201735] dark:text-white">O que você quer fazer?</h2></div></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><ActionCard icon={ShoppingCart} title="Nova venda" desc="Abrir o ponto de venda" onClick={() => setActiveTab('vendas')} color="text-[#6d4aff]" bg="bg-[#eeeaff]" /><ActionCard icon={FileText} title="Novo orçamento" desc="Montar uma proposta" onClick={() => setActiveTab('orcamentos')} color="text-[#9c65d8]" bg="bg-[#f7effb]" /><ActionCard icon={UserPlus} title="Novo cliente" desc="Cadastrar uma pessoa" onClick={() => setActiveTab('clientes')} color="text-emerald-600" bg="bg-[#edf8f4]" /><ActionCard icon={Search} title="Consultar estoque" desc="Encontrar uma peça" onClick={() => setActiveTab('estoque')} color="text-orange-500" bg="bg-[#fff5ed]" /></div></section>
    </div>
  );
}
// Siga este mesmo padrão de importação de Hooks e Componentes isolados para as outras telas (PdvScreen, EstoqueScreen, etc).
