import React, { useState } from 'react';
import { Search, Lock, X, FileText, Check } from 'lucide-react';
import { useAppContext, formatMoney } from '../context/AppContext';

export function PdvScreen() {
  const {
    caixaAberto, pdvSearch, setPdvSearch, carrinho, addToCart, removeFromCart,
    pdvCliente, setPdvCliente, clientes, pdvDesconto, setPdvDesconto, pdvPagamento, setPdvPagamento,
    finalizarVenda, finalizandoVenda, setActiveTab, produtos
  } = useAppContext();
  
  const [mobileTab, setMobileTab] = useState('produtos');

  // Filtragem local
  const pdvFiltered = produtos.filter(p => 
    Number(p.qtd) > 0 && 
    ((p.marca || '').toLowerCase().includes(pdvSearch.toLowerCase()) || 
     (p.modelo || '').toLowerCase().includes(pdvSearch.toLowerCase()) || 
     (p.codigo || '').toLowerCase().includes(pdvSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Ponto de Venda</h1>
          {caixaAberto ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Caixa Aberto</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold"><Lock size={12}/> Caixa Fechado</span>
          )}
        </div>
      </div>

      {!caixaAberto ? (
         <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
           <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6"><Lock className="w-10 h-10"/></div>
           <h2 className="text-2xl font-bold mb-3">O Caixa está Fechado</h2>
           <p className="text-slate-500 mb-8 max-w-md">Para garantir a segurança financeira, é obrigatório abrir o caixa do dia antes de registrar qualquer venda.</p>
           <button onClick={() => setActiveTab('caixa')} className="bg-[var(--vistta-plum)] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[var(--vistta-violet)]">Ir para o Controle de Caixa</button>
         </div>
      ) : (
         <div className="flex-1 flex flex-col lg:flex-row gap-6">
           {/* Lado Esquerdo - Lista de Produtos */}
           <div className="lg:w-[60%] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col">
             <div className="relative mb-6">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Buscar por marca, modelo ou código..."
                 value={pdvSearch}
                 onChange={(e) => setPdvSearch(e.target.value)}
                 className="w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-[var(--vistta-violet)]"
               />
             </div>
             <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
               {pdvFiltered.map((p) => (
                 <button type="button" key={p.id} onClick={() => addToCart(p)} className="bg-slate-50 border rounded-2xl p-5 cursor-pointer hover:border-[var(--vistta-violet)] transition-all flex flex-col text-left group">
                   <div className="text-[11px] text-slate-400 font-mono mb-2">{p.codigo}</div>
                   <div className="font-bold text-[15px] group-hover:text-[var(--vistta-violet)]">{p.marca} {p.modelo}</div>
                   <div className="text-[12px] text-slate-500 mb-4">{p.categoria}</div>
                   <div className="mt-auto flex justify-between items-end">
                     <span className="font-extrabold text-emerald-600 text-lg">{formatMoney(p.venda)}</span>
                     <span className="text-[11px] bg-white px-2 py-1 rounded-lg font-bold">Est: {p.qtd}</span>
                   </div>
                 </button>
               ))}
             </div>
           </div>
    
           {/* Lado Direito - Carrinho */}
           <div className="lg:w-[40%] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col">
             <h3 className="font-bold text-xl mb-5">Carrinho</h3>
             <div className="mb-5">
               <label className="block text-[12px] font-bold text-slate-500 uppercase mb-2">Cliente Vinculado</label>
               <select value={pdvCliente} onChange={(e)=>setPdvCliente(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-[var(--vistta-violet)]">
                 <option value="">Consumidor Final (Balcão)</option>
                 {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
             </div>
    
             <div className="flex-1 overflow-y-auto space-y-3 mb-6 p-3 bg-slate-50 rounded-2xl border">
               {carrinho.map(c => (
                 <div key={c.id} className="flex justify-between items-center p-4 bg-white border rounded-xl">
                   <div className="flex-1">
                     <div className="font-bold text-[14px]">{c.marca} {c.modelo}</div>
                     <div className="text-[12px] text-slate-500 mt-1"><span className="font-bold px-1.5 py-0.5 bg-slate-100 rounded mr-1">{c.qtd}x</span> {formatMoney(c.venda)}</div>
                   </div>
                   <div className="font-extrabold text-[15px] mr-3">{formatMoney(Number(c.venda) * c.qtd)}</div>
                   <button aria-label={`Remover ${c.marca} ${c.modelo} do carrinho`} onClick={() => removeFromCart(c.id)} className="text-slate-300 hover:text-rose-500"><X size={18} /></button>
                 </div>
               ))}
             </div>
    
             <div className="pt-5 border-t">
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div>
                   <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Desc (R$)</label>
                   <input type="number" min="0" value={pdvDesconto} onChange={(e)=>setPdvDesconto(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-[var(--vistta-violet)]" />
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Pagamento</label>
                   <select value={pdvPagamento} onChange={(e)=>setPdvPagamento(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-[var(--vistta-violet)]">
                     <option>Pix</option><option>Crédito</option><option>Débito</option><option>Dinheiro</option>
                   </select>
                 </div>
               </div>
               
               <div className="flex justify-between items-end mb-6">
                 <span className="font-bold text-slate-500 text-[15px]">Total Geral</span>
                 <span className="text-4xl font-black text-[var(--vistta-violet)]">
                   {formatMoney(Math.max(0, carrinho.reduce((a,b)=>a+(Number(b.venda)*b.qtd),0) - (Number(pdvDesconto)||0)))}
                 </span>
               </div>
    
               <div className="grid grid-cols-2 gap-3">
                  <button disabled={finalizandoVenda} onClick={() => finalizarVenda(true)} className="w-full border-2 border-slate-200 py-3.5 rounded-xl font-bold flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50">
                    <FileText size={18} className="mr-2" /> Orçamento
                  </button>
                  <button disabled={finalizandoVenda} onClick={() => finalizarVenda(false)} className="w-full bg-[var(--vistta-plum)] text-white py-3.5 rounded-xl font-bold flex items-center justify-center hover:bg-[var(--vistta-violet)] disabled:cursor-not-allowed disabled:opacity-50">
                    <Check size={18} className="mr-2" /> Vender
                  </button>
               </div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
