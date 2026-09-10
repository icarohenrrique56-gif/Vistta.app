import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useAppContext, formatMoney } from '../context/AppContext';
import { Produto } from '../types';
import { ModalBase, ScreenHeader } from '../components/SharedUI';
import { FormProduto } from '../components/Forms/FormProduto';

export function EstoqueScreen() {
  const { produtos, fornecedores, salvarProduto, excluirProduto } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  const fecharModal = () => {
    if (formDirty && !window.confirm('Você possui alterações não salvas. Deseja descartar?')) return;
    setFormDirty(false);
    setModalAberto(false);
    setProdutoEditando(null);
  };
  const produtosFiltrados = produtos.filter(p => {
    const query = searchTerm.trim().toLowerCase();
    return !query || [p.codigo, p.marca, p.modelo, p.categoria, p.fornecedorId].some(value => String(value || '').toLowerCase().includes(query));
  });

  const salvar = async (data: Partial<Produto>) => {
    await salvarProduto(data, produtoEditando?.id);
    setFormDirty(false);
    setModalAberto(false);
    setProdutoEditando(null);
  };
  
  return (
    <div className="flex flex-col h-full">
      <ScreenHeader eyebrow="Cadastros" title="Estoque" description="Gerencie produtos e níveis de inventário." action={<button onClick={() => { setProdutoEditando(null); setModalAberto(true); }} className="flex w-full items-center justify-center rounded-xl bg-[var(--vistta-plum)] px-6 py-3 font-semibold text-white hover:bg-[var(--vistta-violet)] sm:w-auto">
          <Plus size={20} className="mr-2" /> Adicionar Produto
        </button>} />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
        <div className="p-4 bg-white border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Buscar código, marca..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-[var(--vistta-violet)]"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase font-semibold sticky top-0 bg-white">
                <th className="py-4 px-6 w-24">Cód.</th>
                <th className="py-4 px-6">Produto</th>
                <th className="py-4 px-6">Categoria</th>
                <th className="py-4 px-6 text-right">Venda</th>
                <th className="py-4 px-6 text-center w-28">Qtd</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {produtosFiltrados.map((p: Produto) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-mono text-[12px] font-bold text-slate-400">{p.codigo}</td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-[14px]">{p.marca} <span className="font-normal text-slate-500">{p.modelo}</span></div>
                  </td>
                  <td className="py-4 px-6 text-[13px]"><span className="bg-slate-100 px-3 py-1.5 rounded-lg font-medium">{p.categoria}</span></td>
                  <td className="py-4 px-6 text-right font-extrabold text-[15px] text-emerald-600">{formatMoney(p.venda)}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-[14px] font-bold ${Number(p.qtd) < Number(p.min) ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-700'}`}>{p.qtd}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button aria-label={`Editar produto ${p.marca} ${p.modelo}`} onClick={() => { setProdutoEditando(p); setModalAberto(true); }} className="p-2 rounded-xl text-slate-400 hover:text-[var(--vistta-violet)] hover:bg-[var(--vistta-lavender)]"><Edit2 size={16} /></button>
                    <button aria-label={`Excluir produto ${p.marca} ${p.modelo}`} onClick={() => { if (window.confirm(`Excluir o produto ${p.marca} ${p.modelo}?`)) excluirProduto(p.id).catch((error: any) => alert(error.message)); }} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {!produtosFiltrados.length && <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">{produtos.length ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ModalBase open={modalAberto} onClose={fecharModal} title={produtoEditando ? 'Editar Produto' : 'Novo Produto'} width="max-w-3xl">
        <FormProduto data={produtoEditando} fornecedores={fornecedores} onSave={salvar} onDirtyChange={setFormDirty} onClose={fecharModal} />
      </ModalBase>
    </div>
  );
}
