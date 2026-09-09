import React, { useState, useEffect } from 'react';
import { Users, Glasses, MapPin } from 'lucide-react';
import { Cliente, MedidaOtica, Prescricao } from '../../types';

interface FormClienteProps {
  data: Cliente | null;
  onSave: (data: any) => void;
  onClose: () => void;
}

export function FormCliente({ data, onSave, onClose }: FormClienteProps) {
  const medidaVazia = (): MedidaOtica => ({ esf: '', cil: '', eixo: '', dnp: '', add: '', altura: '' });
  const receitaVazia = (): Prescricao => ({ medico: '', crm: '', dataReceita: '', obs: '', od: medidaVazia(), oe: medidaVazia(), longe: { od: medidaVazia(), oe: medidaVazia() }, perto: { od: medidaVazia(), oe: medidaVazia() } });
  const clienteVazio = () => ({ nome: '', cpf: '', tel: '', nasc: '', email: '', endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }, prescricao: receitaVazia() });
  const [form, setForm] = useState<any>(clienteVazio());
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (data) {
      const receita = data.prescricao || receitaVazia();
      setForm({ ...clienteVazio(), ...data, endereco: { ...clienteVazio().endereco, ...(data.endereco || {}) }, prescricao: { ...receitaVazia(), ...receita, od: { ...medidaVazia(), ...(receita.od || {}) }, oe: { ...medidaVazia(), ...(receita.oe || {}) }, longe: { od: { ...medidaVazia(), ...(receita.longe?.od || {}) }, oe: { ...medidaVazia(), ...(receita.longe?.oe || {}) } }, perto: { od: { ...medidaVazia(), ...(receita.perto?.od || {}) }, oe: { ...medidaVazia(), ...(receita.perto?.oe || {}) } } } });
    }
    else setForm(clienteVazio());
  }, [data]);

  const handleChange = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));
  const handleNested = (section: string, field: string, value: any) => setForm((prev: any) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  const handlePresc = (group: 'longe' | 'perto', eye: 'od'|'oe', field: string, value: any) => setForm((prev: any) => ({ ...prev, prescricao: { ...prev.prescricao, [group]: { ...prev.prescricao[group], [eye]: { ...prev.prescricao[group][eye], [field]: value } } } }));

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-[14px] outline-none focus:border-[var(--vistta-violet)]";
  const labelClass = "text-[12px] font-bold text-slate-500 uppercase mb-2 block";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try { await onSave(form); } catch (error: any) { setSubmitError(error?.message || 'Não foi possível salvar o cliente.'); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <div className="space-y-6">
        <div>
          <h3 className="text-[13px] font-bold text-indigo-500 uppercase mb-4 flex items-center gap-2"><Users size={16}/> Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Nome Completo</label><input required value={form.nome} onChange={e=>handleChange('nome', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>WhatsApp</label><input required value={form.tel} onChange={e=>handleChange('tel', e.target.value)} className={inputClass} placeholder="(00) 00000-0000" /></div>
            <div><label className={labelClass}>CPF / CNPJ</label><input value={form.cpf} onChange={e=>handleChange('cpf', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Nascimento</label><input type="date" value={form.nasc} onChange={e=>handleChange('nasc', e.target.value)} className={inputClass} /></div>
            <div className="md:col-span-2"><label className={labelClass}>E-mail</label><input type="email" value={form.email} onChange={e=>handleChange('email', e.target.value)} className={inputClass} /></div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-[13px] font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><MapPin size={16}/> Endereço</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([['cep','CEP'], ['logradouro','Logradouro'], ['numero','Número'], ['complemento','Complemento'], ['bairro','Bairro'], ['cidade','Cidade'], ['estado','UF']] as const).map(([field, label]) => <div key={field} className={field === 'logradouro' ? 'col-span-2' : ''}><label className={labelClass}>{label}</label><input value={form.endereco[field] || ''} onChange={e=>handleNested('endereco', field, e.target.value)} className={inputClass} /></div>)}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-[13px] font-bold text-emerald-500 uppercase mb-4 flex items-center gap-2"><Glasses size={16}/> Receituário Ótico</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
             <div><label className={labelClass}>Médico Oftalmologista</label><input value={form.prescricao.medico} onChange={e=>setForm((prev:any)=>({...prev, prescricao:{...prev.prescricao, medico: e.target.value}}))} className={inputClass} /></div>
             <div><label className={labelClass}>CRM</label><input value={form.prescricao.crm} onChange={e=>setForm((prev:any)=>({...prev, prescricao:{...prev.prescricao, crm: e.target.value}}))} className={inputClass} /></div>
             <div><label className={labelClass}>Data da Receita</label><input type="date" value={form.prescricao.dataReceita} onChange={e=>setForm((prev:any)=>({...prev, prescricao:{...prev.prescricao, dataReceita: e.target.value}}))} className={inputClass} /></div>
             <div><label className={labelClass}>Observações</label><input value={form.prescricao.obs} onChange={e=>setForm((prev:any)=>({...prev, prescricao:{...prev.prescricao, obs: e.target.value}}))} className={inputClass} /></div>
          </div>
           {(['longe', 'perto'] as const).map(group => <div key={group} className="mb-5 overflow-x-auto"><h4 className="font-bold text-slate-600 mb-2">{group === 'longe' ? 'Visão de Longe' : 'Visão de Perto'}</h4><div className="min-w-[650px] grid grid-cols-7 gap-2 text-center"><div className="text-left text-xs font-bold text-slate-400">Olho</div>{['Esférico','Cilíndrico','Eixo','DNP','Adição','Altura'].map(label => <div key={label} className="text-[10px] font-bold text-slate-400 uppercase">{label}</div>)}{(['od','oe'] as const).flatMap(eye => [<div key={`${group}-${eye}-label`} className="text-left font-bold text-[#4A3AFF] uppercase">{eye}</div>, ...(['esf','cil','eixo','dnp','add','altura'] as const).map(field => <input key={`${group}-${eye}-${field}`} value={form.prescricao[group][eye][field]} onChange={e=>handlePresc(group, eye, field, e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl px-2 py-2 text-center text-sm" placeholder="-" />)])}</div></div>)}
        </div>
      </div>
      {submitError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{submitError}</p>}
      <div className="mt-8 border-t flex justify-end gap-3 pt-4">
        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600">Cancelar</button>
        <button type="submit" className="px-8 py-3 rounded-xl font-bold bg-[var(--vistta-plum)] text-white hover:bg-[var(--vistta-violet)]">Salvar Ficha</button>
      </div>
    </form>
  );
}
