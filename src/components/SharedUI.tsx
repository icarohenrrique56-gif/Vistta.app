import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, LucideIcon, X } from 'lucide-react';

interface DashCardProps { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: LucideIcon; 
  bg?: string; 
  color?: string; 
  onClick?: () => void;
  border?: string; 
}

export function DashCard({ title, value, subtitle, icon: Icon, onClick, bg = "bg-white dark:bg-slate-800", color = "text-slate-900 dark:text-white", border = "border-slate-100 dark:border-slate-700" }: DashCardProps) {
  const content = (
    <>
      <div className="mb-3 flex items-start justify-between sm:mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl sm:h-11 sm:w-11 ${bg === 'bg-white dark:bg-slate-800' ? 'bg-[#eeeaff] text-[#6d4aff]' : color.replace('text-', 'bg-').replace('500', '100') + ' ' + color}`}>
          <Icon size={20} className="sm:h-6 sm:w-6" />
        </div>
        <span className="h-2 w-2 rounded-full bg-[#c6ed76] opacity-80 transition-transform group-hover:scale-125" />
      </div>
      <div>
        <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:text-[13px]">{title}</h3>
        <div className={`text-xl font-black sm:text-2xl ${color}`}>{value}</div>
        {subtitle && <p className="mt-1 text-[11px] font-medium text-slate-400 sm:text-[12px]">{subtitle}</p>}
      </div>
    </>
  );
  const className = `group w-full text-left p-4 rounded-[20px] border shadow-[0_10px_35px_rgba(48,32,77,.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(48,32,77,.1)] sm:p-5 sm:rounded-[24px] ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6d4aff]/40' : ''} ${bg} ${border}`;
  return onClick ? <button type="button" onClick={onClick} className={className}>{content}</button> : <div className={className}>{content}</div>;
}

export function ActionCard({ icon: Icon, title, desc, onClick, color, bg }: any) {
  return (
    <button onClick={onClick} className={`text-left rounded-[18px] border border-transparent p-4 shadow-[0_8px_24px_rgba(48,32,77,.04)] transition-all hover:border-[#dcd5ee] hover:shadow-[0_12px_28px_rgba(48,32,77,.1)] group sm:rounded-[22px] sm:p-5 ${bg}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm sm:mb-4 sm:h-12 sm:w-12 ${color} transition-transform group-hover:scale-110`}>
        <Icon size={20} className="sm:h-6 sm:w-6" />
      </div>
      <h3 className={`mb-1 text-[15px] font-bold sm:mb-2 sm:text-[16px] ${color}`}>{title}</h3>
      <p className="text-[12px] text-slate-500 sm:text-[13px]">{desc}</p>
    </button>
  );
}

export function FeedbackAlert({ type = 'error', children }: { type?: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const styles = {
    error: { icon: AlertCircle, className: 'border-rose-100 bg-rose-50 text-rose-700' },
    success: { icon: CheckCircle2, className: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
    info: { icon: Info, className: 'border-[var(--vistta-border)] bg-[var(--vistta-lavender)] text-[var(--vistta-plum)]' }
  }[type];
  const Icon = styles.icon;
  return <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold leading-5 ${styles.className}`}><Icon size={18} className="mt-0.5 shrink-0" /> <span>{children}</span></div>;
}

export function ScreenHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-[var(--vistta-border)] pb-4 sm:mb-8 sm:gap-5 sm:pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--vistta-violet)] sm:text-[11px]">{eyebrow || 'VISTTA'}</p>
        <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-[var(--vistta-ink)] dark:text-white sm:text-2xl md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--vistta-secondary)] sm:text-sm sm:leading-6">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ModalBase({ open, onClose, title, width = "max-w-md", children }: any) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full ${width} shadow-[0_28px_80px_rgba(15,11,36,.28)] flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] animate-fade-in`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="flex justify-between items-center gap-4 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
          <button aria-label="Fechar janela" onClick={onClose} className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-700"><X size={20} /></button>
        </div>
        <div className="min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function LogoVistta({ className = "", solidWhite = false }: { className?: string, solidWhite?: boolean }) {
  return <img src="/assets/logos/vistta-logo.png" className={`object-contain ${className}`} aria-label="Logo VISTTA" alt="Logo VISTTA" loading="eager" decoding="async" draggable="false" />;
}

export function CreatorLogo({ className = "", solidWhite = false }: { className?: string, solidWhite?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Logo AXXIS7">
      <defs>
        <linearGradient id="vistta-blue" x1="20" y1="12" x2="62" y2="83" gradientUnits="userSpaceOnUse">
          <stop stopColor={solidWhite ? '#ffffff' : '#d8e8ff'} />
          <stop offset=".45" stopColor={solidWhite ? '#dbe5ff' : '#5f9dff'} />
          <stop offset="1" stopColor={solidWhite ? '#ffffff' : '#073b85'} />
        </linearGradient>
        <linearGradient id="vistta-purple" x1="47" y1="40" x2="72" y2="91" gradientUnits="userSpaceOnUse">
          <stop stopColor={solidWhite ? '#ffffff' : '#d9b8ff'} />
          <stop offset=".45" stopColor={solidWhite ? '#ffffff' : '#8c43ff'} />
          <stop offset="1" stopColor={solidWhite ? '#ffffff' : '#3b087f'} />
        </linearGradient>
        <linearGradient id="vistta-ring" x1="20" y1="14" x2="82" y2="87" gradientUnits="userSpaceOnUse">
          <stop stopColor={solidWhite ? '#ffffff' : '#4c78b9'} />
          <stop offset=".5" stopColor={solidWhite ? '#ffffff' : '#081326'} />
          <stop offset="1" stopColor={solidWhite ? '#ffffff' : '#8d3fff'} />
        </linearGradient>
      </defs>
      <path d="M8 39C12 20 28 8 47 7" stroke="url(#vistta-ring)" strokeWidth="2" strokeLinecap="round" />
      <path d="M53 8C75 11 90 27 93 47M92 57C88 77 72 91 53 94" stroke="url(#vistta-ring)" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 53C9 73 22 88 42 94" stroke="url(#vistta-ring)" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 8L21 72H38L56 49L48 48L67 19H50L45 8Z" fill="url(#vistta-blue)" stroke="#8dbbff" strokeWidth=".45" strokeLinejoin="round" />
      <path d="M53 39H80L64 62H78L47 94L57 68H44L53 39Z" fill="url(#vistta-purple)" stroke="#d9b8ff" strokeWidth=".45" strokeLinejoin="round" />
    </svg>
  );
}