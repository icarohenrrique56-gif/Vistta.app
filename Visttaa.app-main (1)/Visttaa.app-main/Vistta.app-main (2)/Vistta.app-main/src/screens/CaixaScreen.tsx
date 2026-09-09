import React, { useState } from 'react';
import { Lock, Wallet, PlusCircle } from 'lucide-react';
import { useAppContext, formatMoney, toList } from '../context/AppContext';
import { Caixa } from '../types';

export function CaixaScreen() {
  const { caixaAberto, totalVendasCaixa, caixas, abrirCaixa, fecharCaixa, registrarLancamentoCaixa } = useAppContext();
  const [valorInicial, setValorInicial] = useState('0');
  const [processando, setProcessando] = useState(false);
  const [lancamento, setLancamento] = useState({ tipo: 'saida' as 'entrada' | 'saida' | 'sangria', descricao: '', valor: '' });

  const executar = async (acao: () => Promise<void>) => {
    setProcessando(true);
    try {
      await acao();
    } catch (error: any) {
      alert(error.message || 'Não foi possível atualizar o caixa.');
    } finally {
      setProcessando(false);
    }
  };
  const totalLancamentos = toList(caixaAberto?.lancamentos).reduce((total, item) => total + (item.tipo === 'entrada' ? Number(item.valor) : -Number(item.valor)), 0);
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Caixa Diário</h1>
          <p className="text-slate-500">Abertura e fechamento de caixa para o PDV.</p>
        </div>
        {caixaAberto ? (
          <button disabled={processando} onClick={() => executar(fecharCaixa)} className="bg-rose-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md disabled:opacity-60">Fechar Caixa</button>
        ) : (
          <button disabled={processando} onClick={() => {
            const valor = Number(valorInicial.replace(',', '.'));
            executar(() => abrirCaixa(valor));
          }} className="bg-[var(--vistta-plum)] text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-[var(--vistta-violet)] disabled:opacity-60">Abrir Caixa</button>
        )}
      </div>

      {caixaAberto ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 mb-10 flex flex-col gap-8 shadow-sm border border-slate-100">
           <div>
             <p className="text-emerald-500 font-bold uppercase text-xs mb-2">Caixa Aberto</p>
             <p className="text-slate-500">Operador: <span className="font-bold text-slate-900">{caixaAberto.operador}</span></p>
           </div>
           <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Fundo Inicial</p>
                <p className="text-2xl font-bold">{formatMoney(caixaAberto.valorInicial)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Vendas no Caixa</p>
                <p className="text-2xl font-bold text-emerald-500">+ {formatMoney(totalVendasCaixa)}</p>
              </div>
              <div className="text-right sm:pl-10 sm:border-l border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Saldo Atual</p>
                <p className="text-4xl font-extrabold text-[var(--vistta-violet)]">{formatMoney((caixaAberto.valorInicial || 0) + totalVendasCaixa + totalLancamentos)}</p>
              </div>
           </div>
              <div className="mt-8 pt-6 border-t border-slate-100"><h3 className="font-bold mb-3">Lançamento de caixa</h3><div className="grid grid-cols-1 sm:grid-cols-4 gap-3"><select value={lancamento.tipo} onChange={e => setLancamento({ ...lancamento, tipo: e.target.value as any })} className="rounded-xl border border-slate-200 px-3 py-3"><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="sangria">Sangria</option></select><input placeholder="Descrição" value={lancamento.descricao} onChange={e => setLancamento({ ...lancamento, descricao: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-3 sm:col-span-2" /><input type="number" min="0.01" step="0.01" placeholder="Valor" value={lancamento.valor} onChange={e => setLancamento({ ...lancamento, valor: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-3" /></div><button onClick={() => executar(async () => { await registrarLancamentoCaixa({ tipo: lancamento.tipo, descricao: lancamento.descricao, valor: Number(lancamento.valor) }); setLancamento({ tipo: 'saida', descricao: '', valor: '' }); })} className="mt-3 text-sm font-bold text-[var(--vistta-violet)] flex items-center gap-2"><PlusCircle size={17} /> Registrar lançamento</button></div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-16 mb-10 text-center flex flex-col items-center">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-400 mb-5 shadow-sm border"><Lock size={24} /></div>
           <h3 className="text-2xl font-bold text-slate-800 mb-3">Caixa Fechado</h3>
           <p className="text-slate-500 mb-8 max-w-md">Nenhum caixa está aberto no momento. Abra o caixa para permitir novas vendas.</p>
           <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
             <label htmlFor="valor-inicial" className="text-sm font-bold text-slate-600">Fundo inicial</label>
             <input id="valor-inicial" type="number" min="0" step="0.01" value={valorInicial} onChange={e => setValorInicial(e.target.value)} className="w-36 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[var(--vistta-violet)]" />
             <button disabled={processando} onClick={() => executar(() => abrirCaixa(Number(valorInicial.replace(',', '.'))))} className="bg-[var(--vistta-plum)] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[var(--vistta-violet)] disabled:opacity-60">{processando ? 'Abrindo...' : 'Abrir Caixa'}</button>
           </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-auto p-5 flex-1"><h3 className="font-bold mb-4">Histórico de caixas</h3><table className="w-full text-left min-w-[650px]"><thead><tr className="text-xs text-slate-400 uppercase border-b"><th className="py-3">Abertura</th><th>Operador</th><th>Fundo</th><th>Vendas</th><th>Saldo final</th></tr></thead><tbody>{caixas.filter((caixa: Caixa) => caixa.status === 'fechado').sort((a: Caixa, b: Caixa) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime()).map((caixa: Caixa) => <tr key={caixa.id} className="border-b border-slate-50"><td className="py-3">{new Date(caixa.dataAbertura).toLocaleDateString('pt-BR')}</td><td>{caixa.operador}</td><td>{formatMoney(caixa.valorInicial)}</td><td className="text-emerald-500">{formatMoney(caixa.totalVendas || 0)}</td><td className="font-bold">{formatMoney(caixa.valorFinal || 0)}</td></tr>)}</tbody></table></div>
    </div>
  );
}
