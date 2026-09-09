import React, { useState } from 'react';
import { formatDocument, sanitizeEmailInput } from '../../utils/documentMask';

export function GenericForm({ config, initialData, onSave, onClose, onDirtyChange }: any) {
  const [form, setForm] = useState(initialData || config.defaultData);
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (field: any, value: any) => {
    const rawValue = String(value ?? '');
    const nextValue = field.type === 'email' ? sanitizeEmailInput(rawValue) : field.mask ? formatDocument(rawValue, field.mask) : rawValue;
    setForm((prev: any) => ({ ...prev, [field.name]: nextValue }));
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-[var(--vistta-violet)] transition-all text-slate-900 dark:text-white";
  const labelClass = "text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 block";
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSubmitError('');
    setSaving(true);
    try { await onSave(form); } catch (error: any) { setSubmitError(error?.message || 'Não foi possível salvar o registro.'); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} onInput={() => onDirtyChange?.(true)}>
      <div className="space-y-4 mb-6">
        {config.fields.map((f: any) => (
          <div key={f.name}>
            <label className={labelClass}>{f.label} {f.required && '*'}</label>
            {f.type === 'select' ? (
              <select required={f.required} value={form[f.name] || ''} onChange={e=>handleChange(f, e.target.value)} className={inputClass}>
                <option value="">Selecione...</option>
                {f.options.map((o: any) => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            ) : (
              <input type={f.type} step={f.step} required={f.required} placeholder={f.placeholder} autoComplete={f.type === 'password' ? 'new-password' : undefined} value={form[f.name] || ''} onChange={e=>handleChange(f, e.target.value)} className={inputClass} />
            )}
          </div>
        ))}
      </div>
      {submitError && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{submitError}</p>}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
        <button type="button" onClick={onClose} disabled={saving} className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-60">Cancelar</button>
        <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-[var(--vistta-plum)] text-white font-bold hover:bg-[var(--vistta-violet)] shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60">{saving ? (config.busyLabel || 'Salvando...') : (config.submitLabel || 'Salvar')}</button>
      </div>
    </form>
  );
}
