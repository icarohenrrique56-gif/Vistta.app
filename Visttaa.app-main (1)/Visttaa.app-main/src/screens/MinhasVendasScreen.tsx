import React from 'react';
import { Receipt } from 'lucide-react';
import { useAppContext, formatMoney } from '../context/AppContext';
import { ScreenHeader } from '../components/SharedUI';
import { Venda } from '../types';

export function MinhasVendasScreen() {
  const { vendas } = useAppContext();
  const vendasOrdenadas = [...vendas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader eyebrow="Operação" title="Minhas Vendas" description="Histórico das vendas realizadas pela sua conta." />
      <div className="flex-1 overflow-auto rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        {vendasOrdenadas.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center text-slate-500">
            <Receipt size={28} className="mb-3 text-slate-300" />
            <p>Nenhuma venda realizada ainda.</p>
          </div>
        ) : (
          <table className="w-full min-w-[520px] text-left">
            <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400"><th className="px-3 py-4">Venda</th><th className="px-3 py-4">Data</th><th className="px-3 py-4">Pagamento</th><th className="px-3 py-4 text-right">Total</th></tr></thead>
            <tbody>{vendasOrdenadas.map((venda: Venda) => <tr key={venda.id} className="border-b border-slate-50"><td className="px-3 py-4 font-bold">#{venda.id.slice(-6)}</td><td className="px-3 py-4 text-sm text-slate-500">{new Date(venda.data).toLocaleString('pt-BR')}</td><td className="px-3 py-4 text-sm text-slate-500">{venda.pag}</td><td className="px-3 py-4 text-right font-black text-emerald-600">{formatMoney(venda.total)}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
