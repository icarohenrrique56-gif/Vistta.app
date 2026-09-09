import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon, X } from 'lucide-react';

interface DashCardProps { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: LucideIcon; 
  bg?: string; 
  color?: string; 
  border?: string; 
}

export function DashCard({ title, value, subtitle, icon: Icon, bg = "bg-white dark:bg-slate-800", color = "text-slate-900 dark:text-white", border = "border-slate-100 dark:border-slate-700" }: DashCardProps) {
  return (
    <div className={`group p-5 rounded-[24px] border shadow-[0_10px_35px_rgba(48,32,77,.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(48,32,77,.1)] ${bg} ${border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bg === 'bg-white dark:bg-slate-800' ? 'bg-[#eeeaff] text-[#6d4aff]' : color.replace('text-', 'bg-').replace('500', '100') + ' ' + color}`}>
          <Icon size={24} />
        </div>
        <span className="h-2 w-2 rounded-full bg-[#c6ed76] opacity-80 group-hover:scale-125 transition-transform" />
      </div>
      <div>
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
        {subtitle && <p className="text-[12px] font-medium text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ActionCard({ icon: Icon, title, desc, onClick, color, bg }: any) {
  return (
    <button onClick={onClick} className={`text-left p-5 rounded-[22px] border border-transparent hover:border-[#dcd5ee] shadow-[0_8px_24px_rgba(48,32,77,.04)] hover:shadow-[0_12px_28px_rgba(48,32,77,.1)] transition-all group ${bg}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white shadow-sm ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <h3 className={`text-[16px] font-bold mb-2 ${color}`}>{title}</h3>
      <p className="text-[13px] text-slate-500">{desc}</p>
    </button>
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