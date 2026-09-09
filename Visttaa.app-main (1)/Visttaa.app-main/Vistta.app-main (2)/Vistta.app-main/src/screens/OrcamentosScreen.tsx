import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAppContext, formatMoney } from '../context/AppContext';
import { Cliente } from '../types';

export function OrcamentosScreen() {
  const { orcamentos, clientes, setActiveTab, converterOrcamentoParaOs, excluirOrcamento } = useAppContext();
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Orçamentos</h1>
          <p className="text-slate-500">Negociações salvas via PDV.</p>
        </div>
        <button onClick={()=>setActiveTab('vendas')} className="flex w-full items-center justify-center rounded-xl bg-[var(--vistta-plum)] px-6 py-3 font-semibold text-white hover:bg-[var(--vistta-violet)] sm:w-auto">
          <Plus size={20} className="mr-2" /> Novo via PDV
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
        <div className="flex-1 overflow-auto custom-scrollbar p-2">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase font-semibold sticky top-0 bg-white">
                <th className="py-4 px-6">Data / Cliente</th>
                <th className="py-4 px-6">Itens</th>
                <th className="py-4 px-6 text-right">Total</th>
                <th className="py-4 px-6 text-center w-24">Status</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orcamentos.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-bold text-[14px]">{clientes.find((c:Cliente)=>c.id===o.cliId)?.nome || 'Desconhecido'}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">{new Date(o.data).toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td className="py-4 px-6 text-[14px] font-medium text-slate-600">{o.itens?.length || 0} produto(s)</td>
                  <td className="py-4 px-6 text-right font-extrabold text-[15px] text-[var(--vistta-violet)]">{formatMoney(o.total)}</td>
                  <td className="py-4 px-6 text-center"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${o.status === 'pendente' ? 'bg-amber-50 text-amber-700' : o.status === 'aprovado' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{o.status}</span></td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2"><button disabled={o.status !== 'pendente'} onClick={() => converterOrcamentoParaOs(o).then(() => setActiveTab('ordens')).catch((error: any) => alert(error.message))} className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--vistta-violet)] hover:bg-[var(--vistta-lavender)] disabled:cursor-not-allowed disabled:opacity-40">Converter em OS</button><button onClick={() => { if (window.confirm('Excluir este orçamento?')) excluirOrcamento(o.id).catch((error: any) => alert(error.message)); }} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
