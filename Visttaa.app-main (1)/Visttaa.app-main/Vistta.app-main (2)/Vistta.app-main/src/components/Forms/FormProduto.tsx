import React, { useState } from 'react';

export function FormProduto({ data, onSave, onClose, fornecedores = [] }: any) {
  const [form, setForm] = useState(data || {
    codigo: '', categoria: 'Armações', marca: '', modelo: '', cor: '', tamanho: '', material: '', fornecedorId: '', tratamento: '',
    custo: '', venda: '', qtd: '', min: ''
  });
  const [submitError, setSubmitError] = useState('');

  const h = (f: string, v: any) => setForm((p: any) => ({ ...p, [f]: v }));
  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-[var(--vistta-violet)] transition-all text-slate-900 dark:text-white";
  const labelClass = "text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 block";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try { await onSave(form); } catch (error: any) { setSubmitError(error?.message || 'Não foi possível salvar o produto.'); }
  };

  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div><label className={labelClass}>SKU (Cód)</label><input required value={form.codigo} onChange={e=>h('codigo', e.target.value)} className={inputClass} /></div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Categoria</label>
          <select value={form.categoria} onChange={e=>h('categoria', e.target.value)} className={inputClass}>
            <option>Armações</option><option>Lentes de Contato</option><option>Lentes Oftálmicas</option><option>Acessórios/Insumos</option>
          </select>
        </div>
        <div><label className={labelClass}>Marca</label><input required value={form.marca} onChange={e=>h('marca', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Modelo</label><input value={form.modelo} onChange={e=>h('modelo', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Cor</label><input value={form.cor} onChange={e=>h('cor', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Tamanho</label><input value={form.tamanho} onChange={e=>h('tamanho', e.target.value)} className={inputClass} placeholder="Ex: 54-18" /></div>
        <div><label className={labelClass}>Material</label><input value={form.material} onChange={e=>h('material', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Fornecedor</label><select value={form.fornecedorId} onChange={e=>h('fornecedorId', e.target.value)} className={inputClass}><option value="">Sem fornecedor</option>{fornecedores.map((fornecedor: any) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nomeFantasia || fornecedor.razaoSocial || fornecedor.nome}</option>)}</select></div>
        <div className="sm:col-span-3"><label className={labelClass}>Tratamento / Especificação</label><input value={form.tratamento} onChange={e=>h('tratamento', e.target.value)} className={inputClass} placeholder="Antirreflexo, Transitions, multifocal..." /></div>

        <div className="sm:col-span-3 border-t border-slate-100 dark:border-slate-700 my-2"></div>

        <div><label className={labelClass}>Custo (R$)</label><input type="number" step="0.01" required value={form.custo} onChange={e=>h('custo', e.target.value)} className={inputClass} /></div>
        <div><label className="text-[12px] font-bold text-emerald-500 uppercase tracking-wider mb-2 block">Venda (R$)</label><input type="number" step="0.01" required value={form.venda} onChange={e=>h('venda', e.target.value)} className={`${inputClass} border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 font-extrabold`} /></div>
        <div><label className={labelClass}>Estoque Atual</label><input type="number" required value={form.qtd} onChange={e=>h('qtd', e.target.value)} className={inputClass} /></div>
        <div><label className="text-[12px] font-bold text-rose-500 uppercase tracking-wider mb-2 block">Estoque Mín.</label><input type="number" required value={form.min} onChange={e=>h('min', e.target.value)} className={`${inputClass} border-rose-200 dark:border-rose-800 focus:border-rose-500`} /></div>
      </div>
      {submitError && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{submitError}</p>}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 sm:gap-4">
        <button type="button" onClick={onClose} className="px-6 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-600">Cancelar</button>
        <button type="submit" className="px-8 py-3.5 rounded-xl font-bold bg-[var(--vistta-plum)] text-white hover:bg-[var(--vistta-violet)]">Salvar Produto</button>
      </div>
    </form>
  );
}
