import React, { useMemo, useState } from 'react';
import { ArrowRight, Bot, CircleHelp, Minus, Send, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

type GrauAction = { label: string; tab: string };
type GrauMessage = { from: 'grau' | 'user'; text: string; action?: GrauAction };
type GrauContext = { products: number; lowStock: number; salesToday: number; openCash: boolean; backupCount: number };

const guideByTab: Record<string, { title: string; text: string; action?: GrauAction }> = {
  dashboard: { title: 'Dashboard', text: 'Aqui você acompanha o resumo da operação, alertas de estoque, vendas e atalhos principais.' },
  vendas: { title: 'PDV', text: 'Para vender: selecione um cliente, adicione produtos, revise o desconto, escolha o pagamento e finalize a venda.', action: { label: 'Abrir PDV', tab: 'vendas' } },
  clientes: { title: 'Clientes', text: 'Cadastre e consulte clientes e suas receitas óticas. Use Novo Cliente para iniciar um cadastro.', action: { label: 'Ir para Clientes', tab: 'clientes' } },
  estoque: { title: 'Estoque', text: 'Consulte produtos, preços e quantidade disponível. Produtos abaixo do mínimo aparecem como estoque crítico.', action: { label: 'Ir para Estoque', tab: 'estoque' } },
  orcamentos: { title: 'Orçamentos', text: 'Orçamentos podem ser criados pelo PDV e acompanhados aqui até a aprovação do cliente.', action: { label: 'Ver Orçamentos', tab: 'orcamentos' } },
  ordens: { title: 'Ordens de Serviço', text: 'Acompanhe a montagem, o laboratório, a retirada e os demais status da ordem de serviço.', action: { label: 'Ver Ordens', tab: 'ordens' } },
  caixa: { title: 'Caixa Diário', text: 'A abertura, os movimentos e o fechamento do caixa são controlados nesta área.' },
  financeiro: { title: 'Financeiro', text: 'Esta área apresenta DRE, contas a pagar e a receber e fluxo de caixa para perfis de gestão.' },
  contas: { title: 'Contas', text: 'Aqui você acompanha contas financeiras cadastradas. O acesso é restrito aos perfis de gestão.' },
  fornecedores: { title: 'Fornecedores', text: 'Cadastre e consulte fornecedores para organizar compras e abastecimento da ótica.' },
  categorias: { title: 'Categorias', text: 'Organize produtos por categorias para facilitar o cadastro e a consulta do estoque.' },
  backup: { title: 'Centro de Dados', text: 'Exporte dados em JSON ou CSV, crie backups locais, valide manifestos e consulte a integridade sem alterar o banco.' },
  usuarios: { title: 'Vendedores', text: 'Gestores e administradores podem criar, editar, ativar e desativar vendedores.' },
  ajuda: { title: 'Ajuda', text: 'A Central de Ajuda reúne os fluxos principais do Vistta para consulta rápida.' }
};

function answerQuestion(question: string, tab: string, role: string | null, context: GrauContext): GrauMessage {
  const normalized = question.toLocaleLowerCase('pt-BR');
  if (/(como funciona|explica.*sistema|explicar.*sistema|módulos|modulos|o que posso fazer|visão geral)/.test(normalized)) {
    return {
      from: 'grau',
      text: 'O Vistta organiza a rotina da ótica em cinco frentes: Dashboard para prioridades, PDV para vendas, Caixa para abertura e fechamento, Cadastros para clientes/estoque/fornecedores e Gestão para financeiro e usuários. Orçamentos e Ordens de Serviço acompanham o atendimento até a entrega. Você pode perguntar “como faço uma venda?”, “como fecho o caixa?” ou “onde cadastro um cliente?”.'
    };
  }
  if (/(permiss(ão|oes)|acesso|quem pode|seguran)/.test(normalized)) {
    return {
      from: 'grau',
      text: role === 'seller'
        ? 'Seu perfil é vendedor. Você pode operar o PDV, consultar produtos e clientes e acompanhar suas vendas. Caixa administrativo, financeiro, contas e usuários ficam protegidos para gestão.'
        : 'Seu perfil de gestão pode acessar as áreas administrativas liberadas pela empresa. O Grau apenas consulta dados já autorizados e não altera caixa, estoque ou financeiro.'
    };
  }
  const restricted = ['faturamento', 'lucro', 'margem', 'custo', 'financeiro', 'saldo do caixa', 'contas a pagar', 'contas a receber'];
  if (role === 'seller' && restricted.some(term => normalized.includes(term))) {
    return { from: 'grau', text: 'Você não possui permissão para acessar essa informação. Posso ajudar com PDV, produtos, clientes ou suas próprias vendas.' };
  }
  if (/(reconcilia|diverg|conferir.*vendas|vendas.*caixa.*estoque)/.test(normalized)) {
    return {
      from: 'grau',
      text: role === 'seller'
        ? 'A reconciliação completa é restrita aos perfis de gestão. Ela é somente leitura e não corrige nenhum registro.'
        : 'A reconciliação completa consulta vendas, pagamentos, caixa, estoque e financeiro diretamente no banco, dentro das permissões da empresa. Ela mostra registros conferidos, inconsistências e fontes que não puderam ser verificadas, sem alterar dados. Abra o Centro de Dados para executar a consulta.',
      action: role === 'seller' ? undefined : { label: 'Abrir Centro de Dados', tab: 'backup' }
    };
  }
  if (normalized.includes('backup') || normalized.includes('cópia')) {
    return { from: 'grau', text: context.backupCount ? `Há ${context.backupCount} backup(s) local(is) registrados neste navegador. Para validar um arquivo específico, abra Backup e Exportação.` : 'Não há backups locais registrados neste navegador. Abra Backup e Exportação para criar e validar uma cópia.', action: { label: 'Abrir Backup', tab: 'backup' } };
  }
  if (normalized.includes('parado') || normalized.includes('estoque')) {
    return { from: 'grau', text: `Tenho ${context.products} produto(s) carregado(s) e ${context.lowStock} abaixo do estoque mínimo. A análise é limitada aos dados permitidos e carregados nesta sessão.`, action: { label: 'Abrir Estoque', tab: 'estoque' } };
  }
  if (normalized.includes('hoje') && normalized.includes('venda')) {
    return { from: 'grau', text: `Encontrei ${context.salesToday} venda(s) registrada(s) hoje nos dados carregados.`, action: { label: 'Abrir Vendas', tab: 'vendas' } };
  }
  if (normalized.includes('venda') || normalized.includes('pdv')) {
    return { from: 'grau', text: 'Para realizar uma venda: abra o PDV, selecione o cliente, adicione os produtos, revise o desconto, escolha o pagamento e finalize.', action: { label: 'Ir para o PDV', tab: 'vendas' } };
  }
  if (normalized.includes('cliente')) {
    return { from: 'grau', text: 'Abra Clientes e selecione Novo Cliente para cadastrar uma pessoa.', action: { label: 'Ir para Clientes', tab: 'clientes' } };
  }
  if (normalized.includes('estoque') || normalized.includes('produto')) {
    return { from: 'grau', text: 'Abra Estoque para consultar produtos, preços e quantidade disponível.', action: { label: 'Ir para Estoque', tab: 'estoque' } };
  }
  if (normalized.includes('pedido') || normalized.includes('ordem') || normalized.includes('laboratório')) {
    return { from: 'grau', text: 'Você pode acompanhar o andamento em Ordens de Serviço, incluindo montagem, laboratório e retirada.', action: { label: 'Ver Ordens', tab: 'ordens' } };
  }
  if (normalized.includes('orçamento')) {
    return { from: 'grau', text: 'Os orçamentos ficam disponíveis na área de Orçamentos e podem ser convertidos em ordem de serviço.', action: { label: 'Ver Orçamentos', tab: 'orcamentos' } };
  }
  if (normalized.includes('caixa')) {
    return role === 'seller'
      ? { from: 'grau', text: 'O controle administrativo do caixa está disponível apenas para usuários de gestão.' }
      : { from: 'grau', text: 'Acesse Caixa Diário para abrir, movimentar e fechar o caixa.', action: { label: 'Ir para Caixa', tab: 'caixa' } };
  }
  const guide = guideByTab[tab] || guideByTab.dashboard;
  return { from: 'grau', text: `Estou no contexto de ${guide.title}. ${guide.text}`, action: guide.action };
}

export function GrauAssistant() {
  const { activeTab, userRole, setActiveTab, produtos, vendas, caixaAberto } = useAppContext();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<GrauMessage[]>([]);
  const [position, setPosition] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vistta:grau-position') || '{"right":20,"bottom":20}') as { right: number; bottom: number }; } catch { return { right: 20, bottom: 20 }; }
  });
  const dragging = React.useRef<{ x: number; y: number; right: number; bottom: number } | null>(null);
  const guide = useMemo(() => guideByTab[activeTab] || guideByTab.dashboard, [activeTab]);
  const context = useMemo<GrauContext>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      products: produtos.length,
      lowStock: produtos.filter(product => Number(product.qtd) <= Number(product.min)).length,
      salesToday: vendas.filter(sale => String(sale.data || '').slice(0, 10) === today).length,
      openCash: Boolean(caixaAberto),
      backupCount: Number(localStorage.getItem('vistta:local-backups-count') || 0)
    };
  }, [produtos, vendas, caixaAberto]);

  const openAssistant = () => {
    setOpen(true);
    if (!messages.length) setMessages([{ from: 'grau', text: `Olá! Eu sou o GRAU. Posso explicar qualquer parte do Vistta. Estamos em ${guide.title}: ${guide.text}` }]);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setMessages(previous => [...previous, { from: 'user', text: trimmed }, answerQuestion(trimmed, activeTab, userRole, context)]);
    setQuestion('');
  };

  const ask = (text: string) => {
    setMessages(previous => [...previous, { from: 'user', text }, answerQuestion(text, activeTab, userRole, context)]);
  };
  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = { x: event.clientX, y: event.clientY, right: position.right, bottom: position.bottom };
  };
  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    const next = {
      right: Math.max(8, Math.min(window.innerWidth - 64, dragging.current.right - (event.clientX - dragging.current.x))),
      bottom: Math.max(8, Math.min(window.innerHeight - 64, dragging.current.bottom - (event.clientY - dragging.current.y)))
    };
    setPosition(next);
    localStorage.setItem('vistta:grau-position', JSON.stringify(next));
  };
  const stopDrag = () => { dragging.current = null; };

  return <>
    <button type="button" onClick={openAssistant} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} title="Grau IA (arraste para mover)" aria-label="Abrir Grau IA" style={{ right: position.right, bottom: position.bottom }} className="fixed z-[60] flex h-14 w-14 touch-none items-center justify-center rounded-full bg-[var(--vistta-plum)] text-white shadow-[0_12px_30px_rgba(48,32,77,.25)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--vistta-violet)] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3 sm:text-sm sm:font-bold">
      <Bot size={20} /><span className="hidden sm:inline">Grau IA</span>
    </button>
    {open && !minimized && <section className="fixed bottom-4 right-4 z-[80] flex max-h-[min(680px,calc(100dvh-2rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[26px] border border-[var(--vistta-border)] bg-[var(--vistta-surface)] shadow-[0_24px_70px_rgba(15,11,36,.3)]" role="dialog" aria-label="Grau IA">
        <header className="flex items-center justify-between border-b border-[var(--vistta-border)] bg-[var(--vistta-plum)] px-5 py-4 text-white">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><Bot size={20} /></span><div><strong className="block text-sm">GRAU 🤖</strong><small className="text-white/70">Ajuda contextual do Vistta</small></div></div>
          <div className="flex"><button type="button" onClick={() => setMinimized(true)} aria-label="Minimizar Grau IA" className="rounded-full p-2 text-white/75 hover:bg-white/10 hover:text-white"><Minus size={18} /></button><button type="button" onClick={() => setOpen(false)} aria-label="Fechar Grau IA" className="rounded-full p-2 text-white/75 hover:bg-white/10 hover:text-white"><X size={18} /></button></div>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!messages.length && <div className="rounded-2xl border border-[var(--vistta-border)] bg-[var(--vistta-muted-surface)] p-4"><p className="text-sm font-semibold text-[var(--vistta-ink)] dark:text-white">{guide.text}</p></div>}
          {messages.map((message, index) => <div key={`${message.from}-${index}`} className={message.from === 'user' ? 'ml-8' : 'mr-4'}><div className={`rounded-2xl px-4 py-3 text-sm leading-5 ${message.from === 'user' ? 'bg-[var(--vistta-lavender)] text-[var(--vistta-plum)]' : 'bg-[var(--vistta-muted-surface)] text-[var(--vistta-ink)] dark:text-white'}`}>{message.text}</div>{message.action && <button type="button" onClick={() => { setActiveTab(message.action?.tab || 'dashboard'); setOpen(false); }} className="mt-2 inline-flex items-center gap-2 px-1 text-xs font-bold text-[var(--vistta-violet)] hover:underline">{message.action.label}<ArrowRight size={14} /></button>}</div>)}
          {messages.length <= 1 && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => ask('Como funciona o sistema?')} className="rounded-full border border-[var(--vistta-border)] px-3 py-2 text-xs font-semibold text-[var(--vistta-secondary)] hover:border-[var(--vistta-violet)] hover:text-[var(--vistta-violet)]">Explicar o Vistta</button><button type="button" onClick={() => ask('Como faço uma venda?')} className="rounded-full border border-[var(--vistta-border)] px-3 py-2 text-xs font-semibold text-[var(--vistta-secondary)] hover:border-[var(--vistta-violet)] hover:text-[var(--vistta-violet)]">Como faço uma venda?</button><button type="button" onClick={() => ask('Quais são minhas permissões?')} className="rounded-full border border-[var(--vistta-border)] px-3 py-2 text-xs font-semibold text-[var(--vistta-secondary)] hover:border-[var(--vistta-violet)] hover:text-[var(--vistta-violet)]">Minhas permissões</button></div>}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 border-t border-[var(--vistta-border)] p-3"><CircleHelp size={18} className="ml-2 shrink-0 text-[var(--vistta-secondary)]" /><input value={question} onChange={event => setQuestion(event.target.value)} placeholder="Digite sua pergunta..." aria-label="Pergunte ao GRAU" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-[var(--vistta-ink)] outline-none placeholder:text-[var(--vistta-secondary)] dark:text-white" /><button type="submit" aria-label="Enviar pergunta" className="rounded-xl bg-[var(--vistta-plum)] p-2.5 text-white hover:bg-[var(--vistta-violet)]"><Send size={16} /></button></form>
      </section>}
    {open && minimized && <button type="button" onClick={() => setMinimized(false)} className="fixed bottom-5 right-5 z-[80] rounded-full bg-[var(--vistta-plum)] px-4 py-3 text-sm font-bold text-white shadow-xl">Grau IA · abrir</button>}
  </>;
}
