import React, { useState } from 'react';
import { ArrowRight, Building2, Check, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function SetupOticaScreen() {
  const { configurarOtica } = useAppContext();
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nomeNormalizado = nome.trim();
    if (!nomeNormalizado) {
      setErro('Informe o nome da sua ótica.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      await configurarOtica(nomeNormalizado);
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED' || error?.message === 'PERMISSION_DENIED') {
        setErro('O Firebase recusou o cadastro. Publique o arquivo database.rules.json no projeto vistta-2e1df e tente novamente.');
      } else {
        setErro(error?.message || 'Não foi possível salvar os dados da ótica.');
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="vistta-shell relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden p-4 sm:p-8">
      <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-[#dcd5ff]/50 blur-3xl dark:bg-[#6d4aff]/10" />
      <div className="absolute bottom-[-10rem] right-[-5rem] h-80 w-80 rounded-full bg-[#c6ed76]/25 blur-3xl dark:bg-[#c6ed76]/5" />
      <div className="relative grid w-full max-w-[980px] overflow-hidden rounded-[30px] border border-[var(--vistta-border)] bg-[var(--vistta-surface)] shadow-[0_24px_80px_rgba(48,32,77,.14)] lg:grid-cols-[.82fr_1.18fr]">
        <div className="hidden flex-col justify-between bg-[var(--vistta-plum)] p-8 text-white lg:flex xl:p-10">
          <div>
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#080a12] text-[#c6ed76]"><Sparkles size={20} /></span><span className="font-display text-lg font-bold tracking-[.18em]">VISTTA</span></div>
            <div className="mt-16 max-w-xs"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#c6ed76]">Primeiro passo</p><h2 className="mt-3 font-display text-3xl font-bold leading-tight">Seu espaço começa com uma boa base.</h2><p className="mt-4 text-sm leading-relaxed text-white/65">Organize vendas, clientes e estoque em um ambiente pensado para a rotina da sua ótica.</p></div>
          </div>
          <div className="space-y-3 text-sm text-white/70"><div className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c6ed76] text-[#30204d]"><Check size={14} /></span>Dados da ótica</div><div className="flex items-center gap-3 opacity-50"><span className="h-6 w-6 rounded-full border border-white/30" />Preferências</div><div className="flex items-center gap-3 opacity-50"><span className="h-6 w-6 rounded-full border border-white/30" />Pronto para começar</div></div>
        </div>
        <div className="vistta-grid p-7 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--vistta-plum)] text-[#c6ed76]"><Sparkles size={18} /></span><span className="font-display text-lg font-bold tracking-[.18em] text-[var(--vistta-ink)] dark:text-white">VISTTA</span></div>
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--vistta-lavender)] text-[var(--vistta-violet)]"><Building2 size={26} /></div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--vistta-violet)]">Configuração inicial</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--vistta-ink)] dark:text-white sm:text-3xl">Vamos configurar sua ótica</h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--vistta-secondary)]">Para começar, informe o nome que aparecerá no seu painel e nos seus documentos.</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="nome-otica" className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[var(--vistta-secondary)]">Nome da ótica</label>
            <input id="nome-otica" autoFocus required value={nome} onChange={event => { setNome(event.target.value); if (erro) setErro(''); }} placeholder="Digite o nome da sua ótica" className="w-full rounded-xl border border-[var(--vistta-border)] bg-[var(--vistta-muted-surface)] px-4 py-3.5 text-[14px] text-[var(--vistta-ink)] outline-none transition-all placeholder:text-[var(--vistta-secondary)] focus:border-[var(--vistta-violet)] focus:ring-2 focus:ring-[rgba(109,74,255,.16)] dark:text-white" />
          </div>
          {erro && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-600">{erro}</p>}
          <button type="submit" disabled={salvando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--vistta-plum)] py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_22px_rgba(48,32,77,.16)] transition-all hover:bg-[var(--vistta-violet)] disabled:cursor-not-allowed disabled:opacity-60">{salvando ? 'Salvando...' : 'Continuar'} {!salvando && <ArrowRight size={18} />}</button>
          </form>
          <p className="mt-6 text-center text-xs text-[var(--vistta-secondary)]">Você poderá atualizar essas informações depois.</p>
        </div>
      </div>
    </div>
  );
}
