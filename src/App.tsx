import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Sidebar } from './components/Navigation/Sidebar';
import { GrauAssistant } from './components/GrauAssistant';

import { Home, ShoppingCart, Boxes, Users, Menu, Moon, Sun, LogOut, Search, X, Plus, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { LogoVistta } from './components/SharedUI';

const AuthScreen = lazy(() => import('./screens/AuthScreen').then(module => ({ default: module.AuthScreen })));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then(module => ({ default: module.DashboardScreen })));
const PdvScreen = lazy(() => import('./screens/PdvScreen').then(module => ({ default: module.PdvScreen })));
const MinhasVendasScreen = lazy(() => import('./screens/MinhasVendasScreen').then(module => ({ default: module.MinhasVendasScreen })));
const CaixaScreen = lazy(() => import('./screens/CaixaScreen').then(module => ({ default: module.CaixaScreen })));
const EstoqueScreen = lazy(() => import('./screens/EstoqueScreen').then(module => ({ default: module.EstoqueScreen })));
const ClientesScreen = lazy(() => import('./screens/ClientesScreen').then(module => ({ default: module.ClientesScreen })));
const OrcamentosScreen = lazy(() => import('./screens/OrcamentosScreen').then(module => ({ default: module.OrcamentosScreen })));
const FinanceiroScreen = lazy(() => import('./screens/FinanceiroScreen').then(module => ({ default: module.FinanceiroScreen })));
const CadastrosGenericosScreen = lazy(() => import('./screens/CadastrosGenericosScreen').then(module => ({ default: module.CadastrosGenericosScreen })));
const OrdensServicoScreen = lazy(() => import('./screens/OrdensServicoScreen').then(module => ({ default: module.OrdensServicoScreen })));
const HelpScreen = lazy(() => import('./screens/HelpScreen').then(module => ({ default: module.HelpScreen })));
const SetupOticaScreen = lazy(() => import('./screens/SetupOticaScreen').then(module => ({ default: module.SetupOticaScreen })));
const PlatformAdminScreen = lazy(() => import('./screens/PlatformAdminScreen').then(module => ({ default: module.PlatformAdminScreen })));
const BackupScreen = lazy(() => import('./screens/BackupScreen').then(module => ({ default: module.BackupScreen })));

function MainLayout() {
  const { activeTab, user, loadingAuth, setActiveTab, carrinho, userRole, platformOwner, developerClaimsPending, dadosEmpresa, empresaId, databaseError, logout, clientes, produtos, vendas, ordensServico } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    const dark = localStorage.getItem('otica_theme') === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('otica_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setCommandOpen(true);
        setCommandQuery('nova');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const openModule = (tab: string) => {
    setCommandOpen(false);
    setCommandQuery('');
    setActiveTab(tab);
  };

  const normalizedQuery = commandQuery.trim().toLocaleLowerCase('pt-BR');
  const quickActions = [
    { label: 'Nova venda', detail: 'Abrir o ponto de venda', tab: 'vendas', keywords: 'venda pdv nova' },
    { label: 'Cadastrar cliente', detail: 'Criar um novo cadastro', tab: 'clientes', keywords: 'cliente cadastrar novo' },
    { label: 'Abrir caixa', detail: 'Consultar o caixa diário', tab: 'caixa', keywords: 'caixa abrir' },
    { label: 'Fechar caixa', detail: 'Ir para o fechamento do caixa', tab: 'caixa', keywords: 'caixa fechar fechamento' },
    { label: 'Ver estoque baixo', detail: 'Encontrar produtos críticos', tab: 'estoque', keywords: 'estoque baixo crítico' },
    { label: 'Ver clientes para retorno', detail: 'Encontrar clientes sem compra recente', tab: 'clientes', keywords: 'clientes retorno inativos sem comprar' },
    { label: 'Nova ordem de serviço', detail: 'Acompanhar produção e retirada', tab: 'ordens', keywords: 'ordem serviço os' },
    { label: 'Abrir Centro de Dados', detail: 'Exportar e validar dados', tab: 'backup', keywords: 'backup exportar importar dados' },
    { label: 'Ver orçamentos', detail: 'Retomar propostas pendentes', tab: 'orcamentos', keywords: 'orçamento proposta' }
  ];
  const actionResults = normalizedQuery.length < 2 ? [] : quickActions
    .filter(action => `${action.label} ${action.detail} ${action.keywords}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
    .map(action => ({ type: 'Ação', label: action.label, detail: action.detail, tab: action.tab }));
  const searchResults = normalizedQuery.length < 2 ? [] : [
    ...actionResults,
    ...clientes.filter(item => `${item.nome} ${item.cpf} ${item.tel}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)).slice(0, 4).map(item => ({ type: 'Cliente', label: item.nome, detail: item.tel || item.cpf, tab: 'clientes' })),
    ...produtos.filter(item => `${item.marca} ${item.modelo} ${item.codigo}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)).slice(0, 4).map(item => ({ type: 'Produto', label: `${item.marca} ${item.modelo}`, detail: item.codigo, tab: 'estoque' })),
    ...vendas.filter(item => `${item.id} ${item.pag}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)).slice(0, 4).map(item => ({ type: 'Venda', label: `Venda ${item.id.slice(-6)}`, detail: item.pag, tab: 'vendas' })),
    ...ordensServico.filter(item => `${item.id} ${item.clienteId} ${item.status}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)).slice(0, 4).map(item => ({ type: 'Ordem de serviço', label: `OS ${item.id.slice(-6)}`, detail: item.status.replace(/_/g, ' '), tab: 'ordens' }))
  ].slice(0, 8);

  // Tela de carregamento enquanto o Firebase verifica o login
  if (loadingAuth) {
    return (
      <div className="vistta-loading flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#f5f6f4] dark:bg-[#171124]">
        <div className="vistta-loading-content flex flex-col items-center text-center">
          <div className="vistta-loading-mark relative flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40">
            <span className="vistta-loading-ring vistta-loading-ring-one" />
            <span className="vistta-loading-ring vistta-loading-ring-two" />
            <span className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#080a12] p-2 shadow-[0_0_28px_rgba(93,78,255,.22)] sm:h-24 sm:w-24"><LogoVistta className="h-full w-full" solidWhite={false} /></span>
          </div>
          <div className="mt-5 flex items-center gap-1.5" aria-label="Carregando">
            <span className="vistta-loading-dot" />
            <span className="vistta-loading-dot vistta-loading-dot-delay-one" />
            <span className="vistta-loading-dot vistta-loading-dot-delay-two" />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.28em] text-[#51607a] dark:text-[#b9afca]">Preparando seu ambiente</p>
        </div>
      </div>
    );
  }

  // Redireciona para o Login se não estiver autenticado
  if (!user) {
    return <Suspense fallback={<ScreenLoading />}><AuthScreen /></Suspense>;
  }

  if (developerClaimsPending) {
    return <DeveloperClaimsPending email={user.email || ''} onLogout={() => void logout()} />;
  }

  const isAdminPath = window.location.pathname === '/admin' || window.location.pathname === '/developer' || activeTab === 'platform';
  if (isAdminPath) {
    return platformOwner ? <Suspense fallback={<ScreenLoading />}><PlatformAdminScreen /></Suspense> : <ForbiddenScreen />;
  }

  if (platformOwner) {
    return <Suspense fallback={<ScreenLoading />}><PlatformAdminScreen /></Suspense>;
  }

  if (userRole === 'seller' && !['dashboard', 'vendas', 'minhas-vendas', 'clientes', 'estoque'].includes(activeTab)) {
    return <ForbiddenScreen />;
  }

  if (!empresaId) {
    return <Suspense fallback={<ScreenLoading />}><SetupOticaScreen /></Suspense>;
  }

  // Renderiza o Sistema com o Menu Lateral
  return (
    <div className="flex min-h-[100vh] min-h-[100dvh] min-h-[100svh] w-full vistta-shell text-slate-900 dark:text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative mobile-safe-bottom md:pb-0">
        <GrauAssistant />
        {databaseError && <div className="absolute top-0 left-0 right-0 z-50 bg-rose-600 text-white px-4 py-2 text-center text-sm font-semibold">{databaseError}</div>}
        <div role="status" title={online ? 'Conectado ao Firebase' : 'Sem conexão: operações críticas estão bloqueadas'} className={`absolute right-28 top-4 z-40 hidden items-center gap-1 rounded-full border px-3 py-2 text-[11px] font-bold shadow-sm backdrop-blur sm:flex ${online ? 'border-emerald-200 bg-emerald-50/90 text-emerald-700' : 'border-amber-200 bg-amber-50/90 text-amber-700'}`}>
          {online ? <Wifi size={14} /> : <WifiOff size={14} />} {online ? 'Online' : 'Offline'}
        </div>
        <button onClick={toggleTheme} aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'} aria-pressed={isDark} className="absolute top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800 border border-[#e7e1ec] dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-[#6d4aff] shadow-sm backdrop-blur" title="Alternar tema">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" onClick={() => setCommandOpen(true)} className="absolute top-4 right-16 z-40 hidden h-10 items-center gap-2 rounded-full border border-[#e7e1ec] bg-white/80 px-3 text-xs font-bold text-slate-500 shadow-sm backdrop-blur transition-colors hover:text-[#6d4aff] dark:border-slate-700 dark:bg-slate-800 sm:flex" title="Pesquisar no VISTTA (Ctrl+K)">
          <Search size={16} /> <span>Buscar</span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-700">Ctrl K</kbd>
        </button>
      <main className="flex-1 overflow-y-auto p-4 pb-5 pt-16 sm:p-10 sm:pt-10 lg:p-12 relative z-10 custom-scrollbar h-full vistta-grid">
        <Suspense fallback={<ScreenLoading />}>
        {activeTab === 'dashboard' && <DashboardScreen />}
        {activeTab === 'vendas' && <PdvScreen />}
        {activeTab === 'minhas-vendas' && <MinhasVendasScreen />}
        {activeTab === 'caixa' && <CaixaScreen />}
        {activeTab === 'estoque' && <EstoqueScreen />}
        {activeTab === 'clientes' && <ClientesScreen />}
        {activeTab === 'orcamentos' && <OrcamentosScreen />}
        {activeTab === 'ordens' && <OrdensServicoScreen />}
        {activeTab === 'ajuda' && <HelpScreen />}
        {activeTab === 'backup' && <BackupScreen />}
        
        {activeTab === 'financeiro' && <FinanceiroScreen />}
        {['fornecedores', 'contas', 'categorias', 'usuarios'].includes(activeTab) && (
          <CadastrosGenericosScreen activeTab={activeTab} />
        )}
        </Suspense>
      </main>
      <div className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center z-[55]">
        <MobileNav icon={Home} label="Início" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNav icon={ShoppingCart} label="PDV" active={activeTab === 'vendas'} onClick={() => setActiveTab('vendas')} badge={carrinho.length} />
        <MobileNav icon={Boxes} label="Estoque" active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')} />
        <MobileNav icon={Users} label="Clientes" active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} />
        <MobileNav icon={Menu} label="Menu" active={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
      </div>
      {mobileMenuOpen && <div className="md:hidden fixed inset-0 z-[70] bg-slate-900/60" onClick={() => setMobileMenuOpen(false)}>
        <div className="absolute right-0 top-0 h-full w-[80%] max-w-[300px] bg-white dark:bg-slate-800 shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between mb-8">
            <span className="font-bold truncate text-slate-900 dark:text-white">{dadosEmpresa?.nome || 'Minha Ótica'}</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">Fechar</button>
          </div>
          <div className="space-y-2">
            {[
              ...(platformOwner ? [['platform', 'Administração global']] : []),
              ...(userRole === 'seller' ? [['minhas-vendas', 'Minhas Vendas']] : [['caixa', 'Caixa Diário'], ['orcamentos', 'Orçamentos'], ['ordens', 'Ordens de Serviço'], ['categorias', 'Categorias'], ['ajuda', 'Ajuda e Treinamento']]),
              ...(userRole === 'admin' || userRole === 'manager' ? [['financeiro', 'Financeiro'], ['contas', 'Contas'], ['fornecedores', 'Fornecedores'], ['usuarios', 'Vendedores'], ['backup', 'Backup e Exportação']] : [])
            ].map(([tab, label]) => <button key={tab} onClick={() => { if (tab === 'platform') window.history.pushState({}, '', '/admin'); setActiveTab(tab); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700">{label}</button>)}
          </div>
          <button onClick={() => logout().catch((error) => console.error('Não foi possível sair:', error))} className="mt-6 flex w-full items-center gap-3 border-t border-slate-100 px-4 pt-5 text-left font-bold text-rose-500 dark:border-slate-700"><LogOut size={18} /> Sair da conta</button>
        </div>
      </div>}
      {commandOpen && <div className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/45 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) { setCommandOpen(false); setCommandQuery(''); } }}>
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] shadow-[0_28px_80px_rgba(15,11,36,.28)]" role="dialog" aria-modal="true" aria-label="Busca e ações rápidas">
          <div className="flex items-center gap-3 border-b border-[var(--vistta-border)] px-5 py-4">
            <Search size={20} className="shrink-0 text-[var(--vistta-violet)]" />
            <input autoFocus value={commandQuery} onChange={event => setCommandQuery(event.target.value)} placeholder="Buscar cliente, produto, venda ou OS..." className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--vistta-ink)] outline-none placeholder:text-[var(--vistta-secondary)] dark:text-white" />
            <button type="button" onClick={() => { setCommandOpen(false); setCommandQuery(''); }} aria-label="Fechar busca" className="rounded-full p-2 text-[var(--vistta-secondary)] hover:bg-[var(--vistta-muted-surface)]"><X size={18} /></button>
          </div>
          <div className="max-h-[55vh] overflow-y-auto p-3">
            {normalizedQuery.length < 2 ? <>
              <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[.16em] text-[var(--vistta-secondary)]">Ações rápidas · Ctrl K</p>
              {quickActions.slice(0, 5).map(action => <button key={action.label} type="button" onClick={() => openModule(action.tab)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[var(--vistta-muted-surface)]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--vistta-lavender)] text-[var(--vistta-violet)]"><Plus size={17} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[var(--vistta-ink)] dark:text-white">{action.label}</strong><small className="text-xs text-[var(--vistta-secondary)]">{action.detail}</small></span><ArrowRight size={16} className="text-[var(--vistta-secondary)]" /></button>)}
            </> : searchResults.length ? <>
              <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[.16em] text-[var(--vistta-secondary)]">Resultados</p>
              {searchResults.map((result, index) => <button key={`${result.type}-${result.label}-${index}`} type="button" onClick={() => openModule(result.tab)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[var(--vistta-muted-surface)]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--vistta-lavender)] text-[var(--vistta-violet)]"><Search size={16} /></span><span className="min-w-0 flex-1"><small className="block text-[10px] font-bold uppercase tracking-wider text-[var(--vistta-violet)]">{result.type}</small><strong className="block truncate text-sm text-[var(--vistta-ink)] dark:text-white">{result.label}</strong><small className="block truncate text-xs text-[var(--vistta-secondary)]">{result.detail}</small></span><ArrowRight size={16} className="text-[var(--vistta-secondary)]" /></button>)}
            </> : <div className="px-4 py-10 text-center text-sm text-[var(--vistta-secondary)]">Nenhum registro encontrado para “{commandQuery}”.</div>}
          </div>
          <div className="border-t border-[var(--vistta-border)] px-5 py-3 text-[11px] text-[var(--vistta-secondary)]">Use `Ctrl + K` para buscar ou `Ctrl + N` para iniciar uma ação.</div>
        </div>
      </div>}
      </div>
    </div>
  );
}

function ForbiddenScreen() {
  return <div className="vistta-shell flex min-h-[100dvh] items-center justify-center p-6"><div className="max-w-md rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-8 text-center shadow-[0_20px_60px_rgba(48,32,77,.1)]"><h1 className="font-display text-2xl font-bold">Acesso não autorizado</h1><p className="mt-3 text-sm leading-6 text-[var(--vistta-secondary)]">Esta área é exclusiva do proprietário da plataforma.</p><a href="/" className="mt-6 inline-flex rounded-xl bg-[var(--vistta-plum)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--vistta-violet)]">Voltar ao sistema</a></div></div>;
}

function DeveloperClaimsPending({ email, onLogout }: { email: string; onLogout: () => void }) {
  return <div className="vistta-shell flex min-h-[100dvh] items-center justify-center p-6"><div className="max-w-lg rounded-3xl border border-[var(--vistta-border)] bg-[var(--vistta-surface)] p-8 text-center shadow-[0_20px_60px_rgba(48,32,77,.1)]"><h1 className="font-display text-2xl font-bold">Acesso do developer pendente</h1><p className="mt-3 text-sm leading-6 text-[var(--vistta-secondary)]">A conta {email} está autenticada, mas ainda não recebeu as Custom Claims do Firebase Admin SDK.</p><p className="mt-3 text-sm leading-6 text-[var(--vistta-secondary)]">Aplique <code>role=developer</code> e <code>platformOwner=true</code> no Firebase e faça logout/login novamente.</p><button type="button" onClick={onLogout} className="mt-6 rounded-xl bg-[var(--vistta-plum)] px-5 py-3 text-sm font-bold text-white">Sair</button></div></div>;
}

function ScreenLoading() {
  return <div className="flex min-h-[240px] items-center justify-center text-sm font-semibold text-[var(--vistta-secondary)]">Carregando módulo...</div>;
}

function MobileNav({ icon: Icon, label, active, onClick, badge = 0 }: any) {
  return <button onClick={onClick} className={`flex-1 h-full flex flex-col items-center justify-center gap-1 text-[10px] relative ${active ? 'text-[var(--vistta-violet)] font-bold' : 'text-slate-400'}`}>
    <Icon size={22} />
    {badge > 0 && <span className="absolute top-1 right-3 bg-rose-500 text-white text-[10px] rounded-full px-1.5">{badge}</span>}
    <span>{label}</span>
  </button>;
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}