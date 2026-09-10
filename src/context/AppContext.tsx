import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { ref, push, update, remove, onValue, query, limitToLast, orderByChild, startAt, equalTo, get, set } from 'firebase/database';
import { onAuthStateChanged, sendPasswordResetEmail, signOut, User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, auth, firebaseFunctions } from '../config/firebase';
import { Produto, Cliente, Venda, Caixa, CarrinhoItem, Orcamento, OrdemServico } from '../types';
import { addBreadcrumb, captureFirebaseError, setModuleContext, setUserContext, trackEvent } from '../services/telemetry';

const PLATFORM_OWNER_EMAIL = 'icaroprojetos7@gmail.com';

export const formatMoney = (v: number | string) => {
  const value = Number(v);
  return (Number.isFinite(value) ? value : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
export const toList = <T,>(value: T[] | Record<string, T> | null | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

const pathToTab: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/vendas': 'vendas',
  '/minhas-vendas': 'minhas-vendas',
  '/caixa': 'caixa',
  '/estoque': 'estoque',
  '/clientes': 'clientes',
  '/orcamentos': 'orcamentos',
  '/ordens': 'ordens',
  '/financeiro': 'financeiro',
  '/fornecedores': 'fornecedores',
  '/contas': 'contas',
  '/categorias': 'categorias',
  '/usuarios': 'usuarios',
  '/ajuda': 'ajuda',
  '/admin': 'platform',
  '/developer': 'platform'
};

const tabToPath = (tab: string) => tab === 'dashboard' ? '/' : tab === 'platform' ? '/admin' : `/${tab}`;
const initialTab = () => pathToTab[window.location.pathname] || 'dashboard';
const moduleForTab = (tab: string) => tab === 'vendas' ? 'pdv' : tab === 'platform' ? 'administracao' : tab;
const actionForCollection = (prefix: string, collection: string) => `${prefix}_${collection.replace('ordensServico', 'ordem_servico')}`;

interface AppContextType {
  user: User | null;
  loadingAuth: boolean;
  userRole: string | null;
  platformOwner: boolean;
  developerClaimsPending: boolean;
  empresaId: string | null;
  dadosEmpresa: { nome?: string } | null;
  databaseError: string | null;
  configurarOtica: (nome: string) => Promise<void>;
  logout: () => Promise<void>;
  produtos: Produto[];
  clientes: Cliente[];
  vendas: Venda[];
  caixas: Caixa[];
  orcamentos: Orcamento[];
  ordensServico: OrdemServico[];
  fornecedores: any[];
  contas: any[];
  categorias: any[];
  usuarios: any[];
  carrinho: CarrinhoItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pdvSearch: string;
  setPdvSearch: (value: string) => void;
  abrirCaixa: (valorInicial: number) => Promise<void>;
  fecharCaixa: () => Promise<void>;
  salvarProduto: (data: Partial<Produto>, id?: string) => Promise<void>;
  excluirProduto: (id: string) => Promise<void>;
  salvarCliente: (data: Partial<Cliente>, id?: string) => Promise<void>;
  excluirCliente: (id: string) => Promise<void>;
  salvarCadastro: (collection: string, data: Record<string, any>, id?: string) => Promise<void>;
  excluirCadastro: (collection: string, id: string) => Promise<void>;
  excluirOrcamento: (id: string) => Promise<void>;
  salvarOrdemServico: (data: Partial<OrdemServico>, id?: string) => Promise<void>;
  converterOrcamentoParaOs: (orcamento: Orcamento) => Promise<void>;
  registrarLancamentoCaixa: (data: { tipo: 'entrada' | 'saida' | 'sangria'; descricao: string; valor: number }) => Promise<void>;
  caixaAberto: Caixa | undefined;
  totalVendasCaixa: number;
  addToCart: (prod: Produto) => void;
  removeFromCart: (id: string) => void;
  finalizarVenda: (comoOrcamento?: boolean) => Promise<void>;
  pdvCliente: string;
  setPdvCliente: (id: string) => void;
  pdvDesconto: number;
  setPdvDesconto: (v: number) => void;
  pdvPagamento: string;
  setPdvPagamento: (p: string) => void;
  finalizandoVenda: boolean;
  getPlatformOverview: () => Promise<any>;
  listPlatformCompanies: () => Promise<any>;
  setPlatformCompanyStatus: (companyId: string, status: 'active' | 'blocked') => Promise<void>;
  setPlatformUserStatus: (uid: string, status: 'active' | 'blocked') => Promise<void>;
  criarVendedor: (data: { nome: string; email: string; senha?: string }) => Promise<void>;
  editarVendedor: (uid: string, data: { nome: string; email: string }) => Promise<void>;
  alterarStatusVendedor: (uid: string, status: 'active' | 'inactive') => Promise<void>;
  redefinirAcessoVendedor: (email: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext deve ser usado dentro de um AppProvider");
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [platformOwner, setPlatformOwner] = useState(false);
  const [developerClaimsPending, setDeveloperClaimsPending] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [dadosEmpresa, setDadosEmpresa] = useState<{ nome?: string } | null>(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  
  const [activeTab, setActiveTabState] = useState(initialTab);
  const [pdvSearch, setPdvSearch] = useState('');
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [sellerCashOpen, setSellerCashOpen] = useState(false);
  const [sellerCashId, setSellerCashId] = useState('');

  const [pdvCliente, setPdvCliente] = useState('');
  const [pdvPagamento, setPdvPagamento] = useState('Pix');
  const [pdvDesconto, setPdvDesconto] = useState(0);
  const [finalizandoVenda, setFinalizandoVenda] = useState(false);
  const vendaEmProcessamento = useRef(false);
  const perfilEmProvisionamento = useRef<string | null>(null);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    const nextPath = tabToPath(tab);
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
  };

  const caixaAberto = useMemo(() => userRole === 'seller'
    ? (sellerCashOpen && sellerCashId ? ({ id: sellerCashId, status: 'aberto' } as Caixa) : undefined)
    : caixas.find(c => c.status === 'aberto'), [caixas, sellerCashId, sellerCashOpen, userRole]);
  const vendasDoCaixa = useMemo(() => caixaAberto ? vendas.filter(v => v.caixaId === caixaAberto.id) : [], [vendas, caixaAberto]);
  const totalVendasCaixa = useMemo(() => vendasDoCaixa.reduce((acc, v) => acc + (v.total || 0), 0), [vendasDoCaixa]);

  useEffect(() => {
    const handlePopState = () => setActiveTabState(pathToTab[window.location.pathname] || 'dashboard');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const module = moduleForTab(activeTab);
    setModuleContext(module);
    addBreadcrumb('Página aberta', { module, route: window.location.pathname });
  }, [activeTab]);

  const pdvStorageKey = user && empresaId ? `vistta:pdv:${user.uid}:${empresaId}` : null;

  useEffect(() => {
    if (!pdvStorageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(pdvStorageKey) || 'null');
      if (!saved || !Array.isArray(saved.carrinho)) return;
      setCarrinho(saved.carrinho);
      setPdvSearch(typeof saved.pdvSearch === 'string' ? saved.pdvSearch : '');
      setPdvCliente(typeof saved.pdvCliente === 'string' ? saved.pdvCliente : '');
      setPdvDesconto(Number.isFinite(Number(saved.pdvDesconto)) ? Number(saved.pdvDesconto) : 0);
      setPdvPagamento(typeof saved.pdvPagamento === 'string' ? saved.pdvPagamento : 'Pix');
    } catch (error) {
      console.warn('[PDV] Não foi possível restaurar a venda em andamento.', error);
    }
  }, [pdvStorageKey]);

  useEffect(() => {
    if (!pdvStorageKey) return;
    try {
      if (!carrinho.length) {
        localStorage.removeItem(pdvStorageKey);
        return;
      }
      localStorage.setItem(pdvStorageKey, JSON.stringify({ carrinho, pdvSearch, pdvCliente, pdvDesconto, pdvPagamento }));
    } catch (error) {
      console.warn('[PDV] Não foi possível salvar a venda em andamento.', error);
    }
  }, [pdvStorageKey, carrinho, pdvSearch, pdvCliente, pdvDesconto, pdvPagamento]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!carrinho.length || finalizandoVenda) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [carrinho.length, finalizandoVenda]);

  const requireEmpresa = () => {
    if (!user) throw new Error('Usuário não autenticado. Entre novamente.');
    if (!empresaId) throw new Error('Empresa não identificada.');
    return empresaId;
  };

  const ensureUserProfile = async (authUser: User) => {
    const userPath = `users/${authUser.uid}`;
    console.info('[USER] Verificando /users/{uid}', { path: userPath, uid: authUser.uid, email: authUser.email || null });
    const userSnapshot = await get(ref(db, userPath));
    const userData = userSnapshot.val() || {};
    console.info(`[USER] Usuário ${userSnapshot.exists() ? 'encontrado' : 'não encontrado'}`, { path: userPath });
    const profile = {
      email: authUser.email || userData.email || '',
      nome: userData.nome || authUser.displayName || '',
      role: userData.role || 'admin',
      status: userData.status || 'active',
      ...(userData.empresaId ? { empresaId: userData.empresaId } : {}),
      updatedAt: new Date().toISOString()
    };

    if (!userSnapshot.exists()) {
      await set(ref(db, userPath), profile);
      console.info('[USER] Perfil criado', { uid: authUser.uid, role: profile.role, status: profile.status, empresaId: profile.empresaId || null });
      return;
    }

    const needsUpdate = 
      !userData.role ||
      userData.role === 'developer' ||
      userData.role === 'admin' && userData.empresaId !== undefined && userData.empresaId !== null ||
      !userData.status ||
      userData.email !== (authUser.email || '') ||
      userData.nome !== (authUser.displayName || userData.nome || '');

    if (needsUpdate) {
      await update(ref(db, userPath), profile);
      console.info('[USER] Perfil atualizado', { uid: authUser.uid, role: profile.role, status: profile.status, empresaId: profile.empresaId || null });
    }
  };

  const configurarOtica = async (nome: string) => {
    const nomeNormalizado = nome.trim();
    if (!user) throw new Error('Usuário não autenticado.');
    if (!nomeNormalizado) throw new Error('Informe o nome da ótica.');
    if (empresaId) return;
    setDatabaseError(null);

    await ensureUserProfile(user);

    const userSnapshot = await get(ref(db, `users/${user.uid}`));
    const profile = userSnapshot.val() || {};
    console.info('[USER] Role', { uid: user.uid, role: profile.role || null, status: profile.status || null });
    console.info('[USER] Empresa', { uid: user.uid, empresaId: profile.empresaId || null });
    if (!profile.role || profile.role !== 'admin') {
      throw new Error('Perfil do usuário não está em estado de administrador para criar uma empresa.');
    }
    if (profile.empresaId) {
      setEmpresaId(profile.empresaId);
      return;
    }

    const empresaRef = push(ref(db, 'empresas'));
    if (!empresaRef.key) throw new Error('Não foi possível criar a empresa.');
    const empresaInfo = { nome: nomeNormalizado, criadoEm: new Date().toISOString(), criadoPor: user.uid, status: 'active' };
    const reportDatabaseFailure = (operation: string, path: string, error: any): never => {
      const code = error?.code || 'unknown';
      const message = error?.message || String(error);
      const diagnostic = new Error(`Firebase ${operation} falhou em ${path}. Código: ${code}. Mensagem: ${message}`) as Error & { code?: string; path?: string; operation?: string };
      diagnostic.code = code;
      diagnostic.path = path;
      diagnostic.operation = operation;
      setDatabaseError(diagnostic.message);
      throw diagnostic;
    };
    const companyPath = `empresas/${empresaRef.key}/info`;
    const companyRuleChecks = {
      authenticated: Boolean(auth.currentUser?.uid),
      newCompany: true,
      criadoPorMatchesAuth: empresaInfo.criadoPor === user.uid,
      profileRoleIsAdmin: profile.role === 'admin',
      profileHasNoEmpresa: !profile.empresaId
    };
    console.info('[EMPRESA] Verificando empresa', { path: companyPath, uid: user.uid, role: profile.role, empresaId: profile.empresaId || null, ruleChecks: companyRuleChecks });
    const userPath = `users/${user.uid}`;
    const profileUpdate = { empresaId: empresaRef.key, role: 'admin', status: 'active', email: user.email || '', updatedAt: new Date().toISOString() };
    try {
      console.info('[EMPRESA] Criando empresa', { companyPath, criadoPor: user.uid });
      // As regras precisam validar a empresa já existente antes de autorizar o vínculo do perfil.
      await set(ref(db, companyPath), empresaInfo);
      console.info('[EMPRESA] Vinculando perfil', { userPath, empresaId: empresaRef.key });
      await update(ref(db, userPath), profileUpdate);
      console.info('[EMPRESA] Ambiente criado', { path: companyPath, empresaId: empresaRef.key });
      setEmpresaId(empresaRef.key);
      setUserRole('admin');
      setDadosEmpresa({ nome: nomeNormalizado });
      setDatabaseError(null);
      setActiveTab('dashboard');
      void trackEvent('empresa_criada');
    } catch (error: any) {
      console.error('[EMPRESA] Erro ao criar ambiente', { companyPath, userPath, code: error?.code, message: error?.message, uid: user.uid });
      captureFirebaseError(error, { module: 'autenticacao', action: 'configurar_empresa', operation: 'database_write' });
      reportDatabaseFailure('criar ambiente', `${companyPath} e ${userPath}`, error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    void trackEvent('logout');
    setCarrinho([]);
    setProdutos([]);
    setClientes([]);
    setVendas([]);
    setCaixas([]);
    setOrcamentos([]);
    setOrdensServico([]);
    setFornecedores([]);
    setContas([]);
    setCategorias([]);
    setUsuarios([]);
    setPdvCliente('');
    setPdvSearch('');
    setPdvDesconto(0);
    setPdvPagamento('Pix');
    setActiveTab('dashboard');
  };

  const saveRecord = async (collection: string, data: Record<string, any>, id?: string) => {
    const empresa = requireEmpresa();
    const collectionPath = `empresas/${empresa}/${collection}`;
    try {
      if (id) {
        await update(ref(db, `${collectionPath}/${id}`), data);
        return;
      }
      const recordRef = push(ref(db, collectionPath));
      await update(ref(db, `${collectionPath}/${recordRef.key}`), data);
    } catch (error) {
      captureFirebaseError(error, { module: moduleForTab(activeTab), action: actionForCollection(id ? 'editar' : 'criar', collection), operation: 'database_write' });
      throw error;
    }
  };

  const deleteRecord = async (collection: string, id: string) => {
    const empresa = requireEmpresa();
    try {
      await remove(ref(db, `empresas/${empresa}/${collection}/${id}`));
    } catch (error) {
      captureFirebaseError(error, { module: moduleForTab(activeTab), action: actionForCollection('excluir', collection), operation: 'database_delete' });
      throw error;
    }
  };

  // Autenticação e Perfis
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let profileTimeout: ReturnType<typeof setTimeout> | undefined;
    let authSequence = 0;

    const clearProfileTimeout = () => {
      if (profileTimeout) clearTimeout(profileTimeout);
      profileTimeout = undefined;
    };

    const clearProfileListener = () => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      clearProfileTimeout();
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      const sequence = ++authSequence;
      clearProfileListener();
      if (u) {
        setUserContext({ id: u.uid });
        addBreadcrumb('Sessão autenticada', { module: 'autenticacao', action: 'sessao_iniciada' });
        console.info('[AUTH] Firebase Auth retornou usuário', { uid: u.uid, email: u.email || null });
        setDatabaseError(null);
        profileTimeout = setTimeout(() => {
          if (sequence !== authSequence) return;
          authSequence += 1;
          console.error('Tempo excedido ao carregar o perfil do usuário.');
          setDatabaseError('Não foi possível carregar seu perfil no Firebase. Verifique a conexão e tente novamente.');
          setUser(null);
          setEmpresaId(null);
          setUserRole(null);
          setLoadingAuth(false);
          clearProfileListener();
        }, 10000);
        let claims: Record<string, unknown> = {};
        try {
          claims = (await u.getIdTokenResult(true)).claims;
        } catch (error) {
          console.error('[Auth] Falha ao renovar claims do usuário:', { uid: u.uid, email: u.email, error });
          captureFirebaseError(error, { module: 'autenticacao', action: 'renovar_claims', operation: 'auth_token' });
        }
        const isDeveloper = claims.role === 'developer' && claims.platformOwner === true;
        const isOwnerAccount = u.email?.trim().toLowerCase() === PLATFORM_OWNER_EMAIL;
        setDeveloperClaimsPending(isOwnerAccount && !isDeveloper);
        if (isOwnerAccount && !isDeveloper) {
          console.error('[Auth] Conta developer sem custom claims válidas:', { uid: u.uid, email: u.email, claims: Object.keys(claims) });
        }
        setPlatformOwner(isDeveloper);
        if (isDeveloper) {
          clearProfileTimeout();
          setUser(u);
          setUserRole('developer');
          setEmpresaId(null);
          setDadosEmpresa(null);
          setLoadingAuth(false);
          return;
        }
        if (sequence !== authSequence) return;
        const profileRef = ref(db, `users/${u.uid}`);
        try {
          const profileSnapshot = await get(profileRef);
          console.info(`[USER] Usuário ${profileSnapshot.exists() ? 'encontrado' : 'não encontrado'}`, { path: `users/${u.uid}`, uid: u.uid });
          if (!profileSnapshot.exists() && perfilEmProvisionamento.current !== u.uid) {
            perfilEmProvisionamento.current = u.uid;
            await update(profileRef, {
              role: 'admin',
              status: 'active',
              email: u.email || '',
              nome: u.displayName || '',
              createdAt: new Date().toISOString()
            });
            console.info('[USER] Perfil inicial criado', { uid: u.uid, role: 'admin', status: 'active', empresaId: null });
          }
        } catch (error: any) {
          console.error('[Auth] Falha ao criar/recuperar perfil:', {
            operation: 'get/update',
            path: `users/${u.uid}`,
            uid: u.uid,
            email: u.email,
            code: error?.code,
            message: error?.message
          });
          console.error('[USER] Erro ao ler/criar perfil', { path: `users/${u.uid}`, code: error?.code, message: error?.message, uid: u.uid, email: u.email || null });
          captureFirebaseError(error, { module: 'autenticacao', action: 'carregar_perfil', operation: 'database_read' });
          setDatabaseError(`Não foi possível criar o perfil do usuário. Código: ${error?.code || 'unknown'}. ${error?.message || ''}`);
          clearProfileTimeout();
          setUser(u);
          setEmpresaId(null);
          setUserRole(null);
          setLoadingAuth(false);
          return;
        }
        unsubscribeProfile = onValue(
          profileRef,
            async (snap) => {
              if (sequence !== authSequence || !snap.exists()) return;
              const data = snap.val();
              console.info('[USER] Role', { uid: u.uid, role: data?.role || null, status: data?.status || null });
              console.info('[USER] Empresa', { uid: u.uid, empresaId: data?.empresaId || null });
            setEmpresaId(data?.empresaId || null);
            setUserRole(['admin', 'manager', 'seller', 'user'].includes(data?.role) ? (data.role === 'user' ? 'seller' : data.role) : null);
            if (data?.empresaId) {
                try {
                  const companySnapshot = await get(ref(db, `empresas/${data.empresaId}/info`));
                  console.info('[EMPRESA] Ambiente da empresa carregado', { path: `empresas/${data.empresaId}/info`, exists: companySnapshot.exists(), empresaId: data.empresaId });
                  setDadosEmpresa(companySnapshot.exists() ? companySnapshot.val() : null);
                } catch (error: any) {
                  console.error('[EMPRESA] Erro ao carregar empresa', { path: `empresas/${data.empresaId}/info`, code: error?.code, message: error?.message, empresaId: data.empresaId, uid: u.uid });
                  captureFirebaseError(error, { module: 'autenticacao', action: 'carregar_empresa', operation: 'database_read' });
                  setEmpresaId(null);
                  setUserRole(null);
                  setDadosEmpresa(null);
                  setDatabaseError('Não foi possível validar o ambiente da sua ótica. Tente criar ou carregar o ambiente novamente.');
                }
            } else {
              setDadosEmpresa(null);
            }
            setUser(u);
              clearProfileTimeout();
            setLoadingAuth(false);
              console.info('[ENV] Preparando ambiente', { uid: u.uid, empresaId: data?.empresaId || null });
              console.info('[ENV] Ambiente carregado', { uid: u.uid, empresaId: data?.empresaId || null });
              console.info('[ROTA] Redirecionando', { destination: data?.empresaId ? 'dashboard' : 'setup' });
          },
          (error: any) => {
            console.error('[USER] Erro no listener do perfil', { path: `users/${u.uid}`, code: error?.code, message: error?.message, uid: u.uid });
            captureFirebaseError(error, { module: 'autenticacao', action: 'escutar_perfil', operation: 'database_listener' });
            setEmpresaId(null);
            setUserRole(null);
            setDadosEmpresa(null);
            setDatabaseError('Não foi possível carregar seu perfil no Firebase. Verifique as regras do Realtime Database.');
            setUser(u);
            setLoadingAuth(false);
            clearProfileListener();
          }
        );
      } else {
        setUserContext(null);
        perfilEmProvisionamento.current = null;
        setDeveloperClaimsPending(false);
        setUser(null);
        setEmpresaId(null);
        setUserRole(null);
        setPlatformOwner(false);
        setDadosEmpresa(null);
        setDatabaseError(null);
        setLoadingAuth(false);
      }
    });

    return () => {
      clearProfileListener();
      unsubscribeAuth();
    };
  }, []);

  // Listeners das Coleções no Banco de Dados
  useEffect(() => {
    if (!empresaId || !dadosEmpresa) return;
    const basePath = `empresas/${empresaId}`;
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const collections: Array<{ name: string; setter: React.Dispatch<React.SetStateAction<any[]>>; queryRef: any }> = [
      { name: 'clientes', setter: setClientes, queryRef: ref(db, `${basePath}/clientes`) },
      { name: 'categorias', setter: setCategorias, queryRef: ref(db, `${basePath}/categorias`) },
      { name: 'orcamentos', setter: setOrcamentos, queryRef: ref(db, `${basePath}/orcamentos`) },
      { name: 'ordensServico', setter: setOrdensServico, queryRef: ref(db, `${basePath}/ordensServico`) },
      { name: 'vendas', setter: setVendas, queryRef: userRole === 'seller' ? query(ref(db, `${basePath}/vendas`), orderByChild('criadoPor'), equalTo(user?.uid || '')) : query(ref(db, `${basePath}/vendas`), orderByChild('data'), startAt(inicioMes.toISOString())) }
    ];
    if (userRole !== 'seller') collections.unshift({ name: 'produtos', setter: setProdutos, queryRef: ref(db, `${basePath}/produtos`) });
    else collections.unshift({ name: 'produtosPublicos', setter: setProdutos, queryRef: ref(db, `${basePath}/produtosPublicos`) });
    if (userRole === 'admin' || userRole === 'manager') {
      collections.push(
        { name: 'fornecedores', setter: setFornecedores, queryRef: ref(db, `${basePath}/fornecedores`) },
        { name: 'caixas', setter: setCaixas, queryRef: query(ref(db, `${basePath}/caixas`), limitToLast(100)) },
        { name: 'contas', setter: setContas, queryRef: ref(db, `${basePath}/contas`) },
        { name: 'usuarios', setter: setUsuarios, queryRef: ref(db, `${basePath}/usuarios`) }
      );
    } else {
      setFornecedores([]);
      setCaixas([]);
      setContas([]);
      setUsuarios([]);
    }

    setDatabaseError(null);
    const unsubs = collections.map(col => {
      return onValue(col.queryRef, (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((child) => {
          const value = child.val();
          const record = value && typeof value === 'object' ? { id: child.key, ...value } : { id: child.key, value };
          if (col.name === 'caixas') record.lancamentos = toList(record.lancamentos);
          data.push(record);
        });
        col.setter(data);
        if (col.name === 'produtos' && (userRole === 'admin' || userRole === 'manager')) {
          const publicProducts = data.reduce<Record<string, any>>((records, product) => {
            const { custo: _custo, ...safeProduct } = product;
            records[`empresas/${empresaId}/produtosPublicos/${product.id}`] = safeProduct;
            return records;
          }, {});
          if (Object.keys(publicProducts).length) void update(ref(db), publicProducts);
        }
      }, (error) => {
        console.error(`Erro ao carregar ${col.name}:`, error);
        captureFirebaseError(error, { module: moduleForTab(activeTab), action: `carregar_${col.name}`, operation: 'database_listener' });
        setDatabaseError(`Não foi possível carregar ${col.name}. Verifique as regras do Firebase.`);
      });
    });

    return () => unsubs.forEach(u => u());
  }, [empresaId, userRole, dadosEmpresa, user?.uid]);

  useEffect(() => {
    if (!empresaId || userRole !== 'seller') {
      setSellerCashOpen(false);
      setSellerCashId('');
      return;
    }
    let active = true;
    const unsubscribe = onValue(ref(db, `empresas/${empresaId}/caixaStatus/aberto`), snapshot => {
      if (active) setSellerCashOpen(snapshot.val() === true);
    }, () => { if (active) setSellerCashOpen(false); });
    const unsubscribeId = onValue(ref(db, `empresas/${empresaId}/caixaStatus/caixaId`), snapshot => {
      if (active) setSellerCashId(String(snapshot.val() || ''));
    }, () => { if (active) setSellerCashId(''); });
    return () => { active = false; unsubscribe(); unsubscribeId(); };
  }, [empresaId, userRole]);

  // Funções do PDV
  const addToCart = (prod: Produto) => {
    const estoqueDisponivel = Number(prod.qtd);
    if (!prod.id || !Number.isFinite(estoqueDisponivel) || estoqueDisponivel <= 0) return;
    setCarrinho(prev => {
      const idx = prev.findIndex(c => c.id === prod.id);
      if (idx > -1) {
        const newCart = [...prev];
        newCart[idx].qtd = Math.min(newCart[idx].qtd + 1, Number(prod.qtd));
        return newCart;
      }
      return [...prev, { ...prod, qtd: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCarrinho(prev => prev.filter(c => c.id !== id));

  const abrirCaixa = async (valorInicial: number) => {
    if (!Number.isFinite(valorInicial) || valorInicial < 0) throw new Error('Informe um valor inicial válido.');
    if (userRole !== 'admin' && userRole !== 'manager') throw new Error('Somente gestores podem abrir o caixa.');
    if (caixaAberto) throw new Error('Já existe um caixa aberto nesta empresa.');
    await httpsCallable(firebaseFunctions, 'openCash')({ requestId: crypto.randomUUID(), valorInicial });
  };

  const fecharCaixa = async () => {
    const caixa = caixaAberto;
    if (!caixa) throw new Error('Nenhum caixa aberto.');
    if (userRole !== 'admin' && userRole !== 'manager') throw new Error('Somente gestores podem fechar o caixa.');
    await httpsCallable(firebaseFunctions, 'closeCash')({ requestId: crypto.randomUUID(), caixaId: caixa.id });
  };

  const salvarProduto = async (data: Partial<Produto>, id?: string) => {
    const produto = {
      ...data,
      custo: Number(data.custo),
      venda: Number(data.venda),
      qtd: Number(data.qtd),
      min: Number(data.min)
    };
    if (![produto.custo, produto.venda, produto.qtd, produto.min].every(value => Number.isFinite(value) && value >= 0)) {
      throw new Error('Informe valores numéricos válidos para custo, venda e estoque.');
    }
    const empresa = requireEmpresa();
    const produtoRef = id ? ref(db, `empresas/${empresa}/produtos/${id}`) : push(ref(db, `empresas/${empresa}/produtos`));
    const produtoId = id || produtoRef.key;
    if (!produtoId) throw new Error('Não foi possível gerar o produto.');
    await saveRecord('produtos', produto, id || produtoId);
    const { custo: _custo, ...produtoPublico } = produto;
    await update(ref(db, `empresas/${empresa}/produtosPublicos/${produtoId}`), produtoPublico);
  };
  const excluirProduto = async (id: string) => {
    const empresa = requireEmpresa();
    await deleteRecord('produtos', id);
    await remove(ref(db, `empresas/${empresa}/produtosPublicos/${id}`));
  };
  const salvarCliente = (data: Partial<Cliente>, id?: string) => saveRecord('clientes', data, id);
  const excluirCliente = (id: string) => deleteRecord('clientes', id);
  const salvarCadastro = async (collection: string, data: Record<string, any>, id?: string) => {
    if (collection === 'usuarios') {
      if (userRole !== 'admin' && userRole !== 'manager') throw new Error('Somente gestores podem administrar vendedores.');
      const nome = String(data.nome || '').trim();
      const email = String(data.email || '').trim().toLowerCase();
      if (!nome || !email) throw new Error('Informe nome e e-mail do vendedor.');
      if (id) {
        await httpsCallable(firebaseFunctions, 'updateSeller')({ uid: id, nome, email });
      } else {
        const senha = String(data.senha || '');
        const confirmarSenha = String(data.confirmarSenha || '');
        if (senha !== confirmarSenha) throw new Error('As senhas informadas não coincidem.');
        if (!user) throw new Error('Usuário não autenticado.');
        const result = await httpsCallable(firebaseFunctions, 'createSeller')({ nome, email, senha });
        if ((result.data as { passwordResetRequired?: boolean }).passwordResetRequired) await sendPasswordResetEmail(auth, email);
      }
      return;
    }
    {
      const normalizedData = collection === 'contas'
        ? { ...data, valor: Number(data.valor) }
        : collection === 'fornecedores'
          ? { ...data, prazoEntrega: data.prazoEntrega === '' ? 0 : Number(data.prazoEntrega) }
          : data;
      if (collection === 'contas' && (!Number.isFinite(normalizedData.valor) || normalizedData.valor < 0)) {
        throw new Error('Informe um valor válido para a conta.');
      }
      await saveRecord(collection, normalizedData, id);
      return;
    }
  };
  const criarVendedor = async (data: { nome: string; email: string; senha?: string }) => { await salvarCadastro('usuarios', data); };
  const editarVendedor = async (uid: string, data: { nome: string; email: string }) => { await salvarCadastro('usuarios', data, uid); };
  const alterarStatusVendedor = async (uid: string, status: 'active' | 'inactive') => {
    if (userRole !== 'admin' && userRole !== 'manager') throw new Error('Somente gestores podem alterar vendedores.');
    await httpsCallable(firebaseFunctions, 'setSellerStatus')({ uid, status });
  };
  const redefinirAcessoVendedor = async (email: string) => { await sendPasswordResetEmail(auth, email); };
  const excluirCadastro = (collection: string, id: string) => deleteRecord(collection, id);
  const excluirOrcamento = (id: string) => deleteRecord('orcamentos', id);
  const salvarOrdemServico = (data: Partial<OrdemServico>, id?: string) => saveRecord('ordensServico', data, id);
  const converterOrcamentoParaOs = async (orcamento: Orcamento) => {
    if (orcamento.status !== 'pendente') throw new Error('Este orçamento já foi processado.');
    if (ordensServico.some(ordem => ordem.orcamentoId === orcamento.id)) throw new Error('Este orçamento já possui uma ordem de serviço.');
    await salvarOrdemServico({
      clienteId: orcamento.cliId,
      orcamentoId: orcamento.id,
      itens: toList(orcamento.itens).map(item => ({ produtoId: item.id, descricao: `${item.marca || ''} ${item.modelo || ''}`.trim(), qtd: Number(item.qtd) || 1, valor: Number(item.venda) || 0, tratamento: '' })),
      status: 'aguardando_montagem',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    });
    await update(ref(db, `empresas/${requireEmpresa()}/orcamentos/${orcamento.id}`), { status: 'aprovado' });
  };

  const registrarLancamentoCaixa = async (data: { tipo: 'entrada' | 'saida' | 'sangria'; descricao: string; valor: number }) => {
    const caixa = caixaAberto;
    if (!caixa) throw new Error('Abra o caixa antes de registrar um lançamento.');
    if (userRole !== 'admin' && userRole !== 'manager') throw new Error('Somente gestores podem registrar movimentos.');
    if (!Number.isFinite(data.valor) || data.valor <= 0) throw new Error('Informe um valor válido.');
    await httpsCallable(firebaseFunctions, 'addCashEntry')({ requestId: crypto.randomUUID(), caixaId: caixa.id, ...data });
  };

  const requirePlatformOwner = () => {
    if (!platformOwner || user?.email?.trim().toLowerCase() !== PLATFORM_OWNER_EMAIL || !user.emailVerified) {
      throw new Error('Acesso restrito ao proprietário autorizado da plataforma.');
    }
  };

  const getPlatformOverview = async () => {
    requirePlatformOwner();
    let usersSnapshot;
    let companiesSnapshot;
    try {
      [usersSnapshot, companiesSnapshot] = await Promise.all([get(ref(db, 'users')), get(ref(db, 'empresas'))]);
    } catch (error: any) {
      console.error('[Platform Dashboard] Leitura global recusada:', { operation: 'get', paths: ['/users', '/empresas'], uid: user?.uid, role: 'developer', empresaId: null, code: error?.code, message: error?.message });
      captureFirebaseError(error, { module: 'administracao', action: 'carregar_visao_geral', operation: 'database_read' });
      throw new Error(`Permission denied ao carregar /users e /empresas. Código: ${error?.code || 'unknown'}. ${error?.message || ''}`);
    }
    const users = usersSnapshot.val() && typeof usersSnapshot.val() === 'object' ? Object.entries(usersSnapshot.val() as Record<string, any>) : [];
    const companies = companiesSnapshot.val() && typeof companiesSnapshot.val() === 'object' ? Object.entries(companiesSnapshot.val() as Record<string, any>) : [];
    const isActive = (value: any) => !['blocked', 'suspended', 'inactive'].includes(String(value?.status || '').toLowerCase());
    const createdAt = (value: any) => Date.parse(value?.createdAt || value?.criadoEm || '') || 0;
    const newSince = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return { data: {
      generatedAt: new Date().toISOString(),
      users: { total: users.length, active: users.filter(([, value]) => isActive(value)).length, blocked: users.filter(([, value]) => !isActive(value)).length, newLast30Days: users.filter(([, value]) => createdAt(value) >= newSince).length },
      companies: { total: companies.length, active: companies.filter(([, value]) => isActive(value?.info)).length, blocked: companies.filter(([, value]) => !isActive(value?.info)).length, newLast30Days: companies.filter(([, value]) => createdAt(value?.info) >= newSince).length },
      recentLogins: [], recentActivity: [], security: { mfa: 'not_configured', suspiciousAttempts: 'not_collected' },
      billing: { configured: false, message: 'Nenhuma integração de planos ou pagamentos foi configurada.' }
    } };
  };

  const listPlatformCompanies = async () => {
    requirePlatformOwner();
    let companiesSnapshot;
    let usersSnapshot;
    try {
      [companiesSnapshot, usersSnapshot] = await Promise.all([get(ref(db, 'empresas')), get(ref(db, 'users'))]);
    } catch (error: any) {
      console.error('[Platform Dashboard] Leitura global de empresas recusada:', { operation: 'get', paths: ['/empresas', '/users'], uid: user?.uid, role: 'developer', empresaId: null, code: error?.code, message: error?.message });
      captureFirebaseError(error, { module: 'administracao', action: 'listar_empresas', operation: 'database_read' });
      throw new Error(`Permission denied ao carregar /empresas e /users. Código: ${error?.code || 'unknown'}. ${error?.message || ''}`);
    }
    const companies = companiesSnapshot.val() && typeof companiesSnapshot.val() === 'object' ? companiesSnapshot.val() as Record<string, any> : {};
    const users = usersSnapshot.val() && typeof usersSnapshot.val() === 'object' ? Object.values(usersSnapshot.val() as Record<string, any>) : [];
    return { data: { companies: Object.entries(companies).map(([companyId, value]) => ({ companyId, info: value?.info || {}, userCount: users.filter((item: any) => item.empresaId === companyId).length })) } };
  };

  const setPlatformCompanyStatus = async (companyId: string, status: 'active' | 'blocked') => {
    requirePlatformOwner();
    if (!companyId || !['active', 'blocked'].includes(status)) throw new Error('Empresa ou status inválido.');
    await update(ref(db, `empresas/${companyId}/info`), { status, updatedAt: new Date().toISOString(), updatedBy: user?.uid });
  };

  const setPlatformUserStatus = async (uid: string, status: 'active' | 'blocked') => {
    requirePlatformOwner();
    const ownerUid = user?.uid;
    if (!uid || !['active', 'blocked'].includes(status)) throw new Error('Usuário ou status inválido.');
    if (!ownerUid) throw new Error('Sessão do proprietário não encontrada.');
    if (uid === ownerUid) throw new Error('O proprietário não pode bloquear a própria conta.');
    await update(ref(db, `users/${uid}`), { status, updatedAt: new Date().toISOString(), updatedBy: ownerUid });
  };

  const finalizarVenda = async (comoOrcamento = false) => {
    if (vendaEmProcessamento.current) return;
    if (carrinho.length === 0 || !empresaId) return alert("Carrinho vazio!");
    if (!comoOrcamento && !caixaAberto) return alert("Abra o caixa primeiro!");

    const subtotal = carrinho.reduce((a, b) => a + (Number(b.venda) * b.qtd), 0);
    let desc = Math.max(0, Number(pdvDesconto) || 0);
    desc = Math.min(desc, subtotal);
    
    vendaEmProcessamento.current = true;
    setFinalizandoVenda(true);
    try {
      if (comoOrcamento) {
         if(!pdvCliente) return alert("Selecione um cliente para salvar o orçamento!");
         await push(ref(db, `empresas/${empresaId}/orcamentos`), {
            cliId: pdvCliente, subtotal, desconto: desc, total: subtotal - desc,
            itens: carrinho.map(c => ({ id: c.id, marca: c.marca, modelo: c.modelo, qtd: c.qtd, venda: c.venda })),
            data: new Date().toISOString(), status: 'pendente'
         });
      } else {
          await httpsCallable(firebaseFunctions, 'finalizeSale')({
            requestId: crypto.randomUUID(),
            cliId: pdvCliente,
            pag: pdvPagamento,
            desconto: Math.max(0, Number(pdvDesconto) || 0),
            items: carrinho.map(item => ({ id: item.id, qtd: item.qtd }))
          });
          if (userRole === 'seller') {
            const result = await httpsCallable(firebaseFunctions, 'listSellerProducts')({});
            setProdutos((result.data as { products?: Produto[] }).products || []);
          }
      }
      setCarrinho([]); setPdvDesconto(0); setPdvCliente('');
      alert(comoOrcamento ? "Orçamento salvo!" : "Venda concluída com sucesso!");
    } catch (e: any) {
      captureFirebaseError(e, { module: 'pdv', action: comoOrcamento ? 'salvar_orcamento' : 'finalizar_venda', operation: 'database_write' });
      alert("Erro ao finalizar: " + e.message);
    } finally {
      vendaEmProcessamento.current = false;
      setFinalizandoVenda(false);
    }
  };

  const value = {
    user, loadingAuth, userRole, platformOwner, developerClaimsPending, empresaId, dadosEmpresa, databaseError, configurarOtica, logout,
    produtos, clientes, vendas, caixas, orcamentos, ordensServico, carrinho,
    fornecedores, contas, categorias, usuarios,
    activeTab, setActiveTab, pdvSearch, setPdvSearch, abrirCaixa, fecharCaixa,
    salvarProduto, excluirProduto, salvarCliente, excluirCliente, salvarCadastro, excluirCadastro, excluirOrcamento, salvarOrdemServico, converterOrcamentoParaOs, registrarLancamentoCaixa,
    addToCart, removeFromCart, finalizarVenda, finalizandoVenda, getPlatformOverview, listPlatformCompanies, setPlatformCompanyStatus, setPlatformUserStatus,
    criarVendedor, editarVendedor, alterarStatusVendedor, redefinirAcessoVendedor,
    caixaAberto, totalVendasCaixa, pdvCliente, setPdvCliente, pdvDesconto, setPdvDesconto, pdvPagamento, setPdvPagamento
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};