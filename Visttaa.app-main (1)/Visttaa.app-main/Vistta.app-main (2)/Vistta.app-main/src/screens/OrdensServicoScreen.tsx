import React, { useState } from 'react';
import { ClipboardList, Plus, Edit2 } from 'lucide-react';
import { ModalBase } from '../components/SharedUI';
import { formatMoney, toList, useAppContext } from '../context/AppContext';
import { OrdemServico, StatusOs } from '../types';

const statusLabels: Record<StatusOs, string> = {
  aguardando_montagem: 'Aguardando Montagem',
  em_laboratorio: 'Em Laboratório',
  pronto_retirada: 'Pronto para Retirada',
  entregue: 'Entregue',
  cancelada: 'Cancelada'
};
const itensDaOs = (os: OrdemServico) => toList(os.itens);

export function OrdensServicoScreen() {
  const { ordensServico, clientes, produtos, salvarOrdemServico } = useAppContext();
  const [editando, setEditando] = useState<OrdemServico | null>(null);
  const [aberta, setAberta] = useState(false);
  const [form, setForm] = useState<any>(null);

  const abrir = (os?: OrdemServico) => {
    setEditando(os || null);
    setForm(os ? { ...os, itens: toList(os.itens) } : { clienteId: '', status: 'aguardando_montagem', previsaoEntrega: '', observacoes: '', receitaId: '', itens: [{ produtoId: '', descricao: '', qtd: 1, valor: 0, tratamento: '' }] });
    setAberta(true);
  };
  const alterarItem = (index: number, field: string, value: any) => setForm((prev: any) => ({ ...prev, itens: prev.itens.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, [field]: value } : item) }));
  const selecionarProduto = (index: number, produtoId: string) => {
    const produto = produtos.find(item => item.id === produtoId);
    alterarItem(index, 'produtoId', produtoId);
    if (produto) setForm((prev: any) => ({ ...prev, itens: prev.itens.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, produtoId, descricao: `${produto.marca} ${produto.modelo}`.trim(), valor: Number(produto.venda) || 0 } : item) }));
  };
  const alterarStatus = (os: OrdemServico, status: StatusOs) => {
    salvarOrdemServico({ ...os, status, atualizadoEm: new Date().toISOString() }, os.id).catch((error: any) => {
      setSubmitError(error?.message || 'Não foi possível atualizar o status da OS.');
    });
  };
  const [submitError, setSubmitError] = useState('');
  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    try {
      if (!form.clienteId) throw new Error('Selecione um cliente.');
      await salvarOrdemServico({ ...form, criadoEm: editando?.criadoEm || new Date().toISOString(), atualizadoEm: new Date().toISOString() }, editando?.id);
      setAberta(false);
    } catch (error: any) { setSubmitError(error?.message || 'Não foi possível salvar a ordem de serviço.'); }
  };

  return <div className="flex flex-col h-full">
    <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
      <div><h1 className="text-2xl sm:text-3xl font-bold mb-2">Ordens de Serviço</h1><p className="text-slate-500">Acompanhe montagem, laboratório e retirada.</p></div>
      <button onClick={() => abrir()} className="flex w-full items-center justify-center rounded-xl bg-[#4A3AFF] px-6 py-3 font-semibold text-white sm:w-auto"><Plus size={20} className="mr-2" /> Nova OS</button>
    </div>
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex-1 overflow-auto p-2">
      <table className="w-full min-w-[800px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase font-semibold"><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Itens</th><th className="px-6 py-4">Previsão</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4">Ações</th></tr></thead>
        <tbody className="divide-y divide-slate-50">{ordensServico.map(os => <tr key={os.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30"><td className="py-4 px-6 font-bold">{clientes.find(cliente => cliente.id === os.clienteId)?.nome || 'Cliente não encontrado'}</td><td className="py-4 px-6">{itensDaOs(os).length} item(ns)</td><td className="py-4 px-6">{os.previsaoEntrega ? new Date(os.previsaoEntrega).toLocaleDateString('pt-BR') : '-'}</td><td className="py-4 px-6"><select value={os.status || 'aguardando_montagem'} onChange={e => alterarStatus(os, e.target.value as StatusOs)} className="bg-slate-100 rounded-lg px-2 py-1 text-xs font-bold"><option value="aguardando_montagem">Aguardando Montagem</option><option value="em_laboratorio">Em Laboratório</option><option value="pronto_retirada">Pronto para Retirada</option><option value="entregue">Entregue</option><option value="cancelada">Cancelada</option></select></td><td className="py-4 px-6 text-right font-bold">{formatMoney(itensDaOs(os).reduce((total, item) => total + Number(item.valor || 0) * Number(item.qtd || 0), 0))}</td><td className="py-4 px-6"><button onClick={() => abrir(os)} className="p-2 text-slate-400 hover:text-[#4A3AFF]"><Edit2 size={16} /></button></td></tr>)}
        {ordensServico.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400"><ClipboardList className="mx-auto mb-3" />Nenhuma ordem de serviço cadastrada.</td></tr>}</tbody></table>
    </div>
    <ModalBase open={aberta} onClose={() => setAberta(false)} title={editando ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'} width="max-w-4xl">
      {form && <form onSubmit={salvar} className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><label className="text-xs font-bold text-slate-500 uppercase">Cliente<select required value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"><option value="">Selecione</option>{clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</select></label><label className="text-xs font-bold text-slate-500 uppercase">Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-bold text-slate-500 uppercase">Previsão de entrega<input type="date" value={form.previsaoEntrega} onChange={e => setForm({ ...form, previsaoEntrega: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3" /></label></div>
        <div className="border-t pt-4"><div className="flex justify-between items-center mb-3"><h3 className="font-bold">Armação, lentes e tratamentos</h3><button type="button" onClick={() => setForm({ ...form, itens: [...form.itens, { produtoId: '', descricao: '', qtd: 1, valor: 0, tratamento: '' }] })} className="text-sm font-bold text-[#4A3AFF]">+ Adicionar item</button></div>{form.itens.map((item: any, index: number) => <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3"><select value={item.produtoId} onChange={e => selecionarProduto(index, e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"><option value="">Produto do estoque</option>{produtos.map(produto => <option key={produto.id} value={produto.id}>{produto.marca} {produto.modelo} ({produto.categoria})</option>)}</select><input placeholder="Descrição" value={item.descricao} onChange={e => alterarItem(index, 'descricao', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3" /><input placeholder="Tratamento" value={item.tratamento} onChange={e => alterarItem(index, 'tratamento', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3" /><input type="number" min="1" value={item.qtd} onChange={e => alterarItem(index, 'qtd', Number(e.target.value))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3" /><input type="number" step="0.01" value={item.valor} onChange={e => alterarItem(index, 'valor', Number(e.target.value))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3" /></div>)}</div>
        <textarea placeholder="Observações da montagem ou laboratório" value={form.observacoes || ''} onChange={e => setForm({ ...form, observacoes: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 min-h-24" />{submitError && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{submitError}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={() => setAberta(false)} className="px-5 py-3 rounded-xl bg-slate-100 font-bold">Cancelar</button><button type="submit" className="px-5 py-3 rounded-xl bg-[#4A3AFF] text-white font-bold">Salvar OS</button></div></form>}
    </ModalBase>
  </div>;
}
