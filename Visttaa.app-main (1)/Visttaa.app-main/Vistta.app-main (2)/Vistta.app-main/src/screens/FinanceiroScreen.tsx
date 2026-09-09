import React from 'react';
import { TrendingUp, PackageOpen, ArrowRightLeft } from 'lucide-react';
import { useAppContext, formatMoney, toList } from '../context/AppContext';
import { DashCard } from '../components/SharedUI';
import { Venda, Cliente } from '../types';

export function FinanceiroScreen() {
  const { vendas, clientes, contas, caixas } = useAppContext();
  const contasPagar = contas.filter((conta: any) => conta.tipo === 'pagar' && conta.status !== 'pago');
  const contasReceber = contas.filter((conta: any) => conta.tipo === 'receber' && !['pago', 'recebido'].includes(conta.status));
  const totalPagar = contasPagar.reduce((total: number, conta: any) => total + Number(conta.valor || 0), 0);
  const totalReceber = contasReceber.reduce((total: number, conta: any) => total + Number(conta.valor || 0), 0);
  const totalSaidasCaixa = caixas.reduce((total: number, caixa: any) => total + toList(caixa.lancamentos).filter((item: any) => item.tipo !== 'entrada').reduce((subtotal: number, item: any) => subtotal + Number(item.valor || 0), 0), 0);
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Financeiro (DRE)</h1>
        <p className="text-slate-500">Análise de lucratividade real e CMV.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <DashCard title="Faturamento Bruto" value={formatMoney(vendas.reduce((a,b)=>a+(b.total||0),0))} icon={TrendingUp} />
        <DashCard title="CMV (Custo dos Produtos)" value={formatMoney(vendas.reduce((a,b)=>a+(b.custoBase||0),0))} icon={PackageOpen} color="text-rose-500" />
        <DashCard title="Lucro Bruto"
          value={formatMoney(vendas.reduce((a,b)=>a+(b.total||0),0) - vendas.reduce((a,b)=>a+(b.custoBase||0),0))}
          icon={ArrowRightLeft} bg="bg-[#4A3AFF]/10" color="text-[#4A3AFF]" border="border-[#4A3AFF]/20" />
        <DashCard title="A Pagar" value={formatMoney(totalPagar)} subtitle={`${contasPagar.length} lançamentos`} icon={ArrowRightLeft} color="text-rose-500" />
        <DashCard title="A Receber" value={formatMoney(totalReceber)} subtitle={`${contasReceber.length} lançamentos`} icon={TrendingUp} color="text-emerald-500" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mt-8"><h3 className="font-bold mb-5">Fluxo de caixa consolidado</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-6"><div><span className="text-xs text-slate-400 uppercase font-bold">Vendas realizadas</span><p className="mt-2 text-xl font-black text-emerald-500">{formatMoney(vendas.reduce((total, venda) => total + Number(venda.total || 0), 0))}</p></div><div><span className="text-xs text-slate-400 uppercase font-bold">Saídas e sangrias</span><p className="mt-2 text-xl font-black text-rose-500">{formatMoney(totalSaidasCaixa)}</p></div><div><span className="text-xs text-slate-400 uppercase font-bold">Saldo operacional</span><p className="mt-2 text-xl font-black text-[#4A3AFF]">{formatMoney(vendas.reduce((total, venda) => total + Number(venda.total || 0), 0) - totalSaidasCaixa)}</p></div></div></div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-2 mt-8 flex-1 flex flex-col min-h-[300px]">
        <div className="p-5 flex-shrink-0"><h3 className="font-bold text-[16px]">Últimas Vendas</h3></div>
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
            <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase font-semibold sticky top-0 bg-white">
                <th className="py-4 px-6">Data</th>
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6">Pagamento</th>
                <th className="py-4 px-6 text-right">Total</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {vendas.slice().sort((a,b)=>new Date(b.data).getTime()-new Date(a.data).getTime()).slice(0, 10).map((v: Venda) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-[14px] text-slate-700">{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-4 px-6 text-[14px] font-bold">{clientes.find((c:Cliente)=>c.id===v.cliId)?.nome || 'Balcão'}</td>
                    <td className="py-4 px-6 text-[14px]"><span className="bg-slate-100 px-3 py-1.5 rounded-lg font-medium">{v.pag}</span></td>
                    <td className="py-4 px-6 text-right font-extrabold text-[15px] text-[#4A3AFF]">{formatMoney(v.total)}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
