import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { ref, push, update, remove, onValue, query, limitToLast, orderByChild, startAt, runTransaction, get, getDatabase } from 'firebase/database';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendPasswordResetEmail, signOut, User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, auth, firebaseConfig, functions } from '../config/firebase';
import { Produto, Cliente, Venda, Caixa, CarrinhoItem, Orcamento, OrdemServico } from '../types';

const provisioningApp = getApps().find(currentApp => currentApp.name === 'vistta-user-provisioning') || initializeApp(firebaseConfig, 'vistta-user-provisioning');
const provisioningAuth = getAuth(provisioningApp);
const provisioningDb = getDatabase(provisioningApp);

export const formatMoney = (v: number | string) => {
  const value = Number(v);
  return (Number.isFinite(value) ? value : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
export const toList = <T,>(value: T[] | Record<string, T> | null | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

interface AppContextType {
  user: User | null;
  loadingAuth: boolean;
  userRole: string | null;
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
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [dadosEmpresa, setDadosEmpresa] = useState<{ nome?: string } | null>(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const [pdvCliente, setPdvCliente] = useState('');
  const [pdvPagamento, setPdvPagamento] = useState('Pix');
  const [pdvDesconto, setPdvDesconto] = useState(0);
  const [finalizandoVenda, setFinalizandoVenda] = useState(false);
  const vendaEmProcessamento = useRef(false);

  const caixaAberto = useMemo(() => caixas.find(c => c.status === 'aberto'), [caixas]);
  const vendasDoCaixa = useMemo(() => caixaAberto ? vendas.filter(v => v.caixaId === caixaAberto.id) : [], [vendas, caixaAberto]);
  const totalVendasCaixa = useMemo(() => vendasDoCaixa.reduce((acc, v) => acc + (v.total || 0), 0), [vendasDoCaixa]);

  const requireEmpresa = () => {
    if (!user) throw new Error('Usuário não autenticado. Entre novamente.');
    if (!empresaId) throw new Error('Empresa não identificada.');
    return empresaId;
  };

  const configurarOtica = async (nome: string) => {
    const nomeNormalizado = nome.trim();
    if (!user) throw new Error('Usuário não autenticado.');
    if (!nomeNormalizado) throw new Error('Informe o nome da ótica.');
    if (empresaId) return;
    const empresaRef = push(ref(db, 'empresas'));
    if (!empresaRef.key) throw new Error('Não foi possível criar a empresa.');
    const empresaInfo = { nome: nomeNormalizado, criadoEm: new Date().toISOString(), criadoPor: user.uid };
    await update(ref(db, `empresas/${empresaRef.key}/info`), empresaInfo);
    try {
      await update(ref(db, `users/${user.uid}`), { empresaId: empresaRef.key, role: 'admin', email: user.email || '' });
    } catch (error) {
      setDatabaseError('A ótica foi criada, mas não foi possível vincular seu usuário. Tente novamente.');
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
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
    if (id) {
      await update(ref(db, `${collectionPath}/${id}`), data);
      return;
    }
    const recordRef = push(ref(db, collectionPath));
    await update(ref(db, `${collectionPath}/${recordRef.key}`), data);
  };

  const deleteRecord = async (collection: string, id: string) => {
    const empresa = requireEmpresa();
    await remove(ref(db, `empresas/${empresa}/${collection}/${id}`));
  };

  // Autenticação e Perfis
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let profileTimeout: ReturnType<typeof setTimeout> | undefined;

    const clearProfileListener = () => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      if (profileTimeout) clearTimeout(profileTimeout);
      profileTimeout = undefined;
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      clearProfileListener();
      if (u) {
        setDatabaseError(null);
        profileTimeout = setTimeout(() => {
          console.error('Tempo excedido ao carregar o perfil do usuário.');
          setUser(u);
          setLoadingAuth(false);
        }, 10000);

        unsubscribeProfile = onValue(
          ref(db, `users/${u.uid}`),
          (snap) => {
            const data = snap.val();
            setEmpresaId(data?.empresaId || null);
            setUserRole(data?.role || null);
            if (data?.empresaId) {
              get(ref(db, `empresas/${data.empresaId}/info`)).then((snap) => {
                setDadosEmpresa(snap.exists() ? snap.val() : null);
              }).catch((error) => {
                console.error('Não foi possível carregar os dados da empresa:', error);
                setDatabaseError('Não foi possível carregar os dados da empresa.');
              });
            } else {
              setDadosEmpresa(null);
            }
            setUser(u);
            setLoadingAuth(false);
            clearProfileListener();
          },
          (error) => {
            console.error('Não foi possível carregar o perfil do usuário:', error);
            setEmpresaId(null);
            setUserRole(null);
            setUser(u);
            setLoadingAuth(false);
            clearProfileListener();
          }
        );
      } else {
        setUser(null);
        setEmpresaId(null);
        setUserRole(null);
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
    if (!empresaId) return;
    const basePath = `empresas/${empresaId}`;
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const collections = [
      { name: 'produtos', setter: setProdutos, queryRef: ref(db, `${basePath}/produtos`) },
      { name: 'clientes', setter: setClientes, queryRef: ref(db, `${basePath}/clientes`) },
      { name: 'fornecedores', setter: setFornecedores, queryRef: ref(db, `${basePath}/fornecedores`) },
      { name: 'categorias', setter: setCategorias, queryRef: ref(db, `${basePath}/categorias`) },
      { name: 'orcamentos', setter: setOrcamentos, queryRef: ref(db, `${basePath}/orcamentos`) },
      { name: 'ordensServico', setter: setOrdensServico, queryRef: ref(db, `${basePath}/ordensServico`) },
      { name: 'vendas', setter: setVendas, queryRef: query(ref(db, `${basePath}/vendas`), orderByChild('data'), startAt(inicioMes.toISOString())) },
      { name: 'caixas', setter: setCaixas, queryRef: query(ref(db, `${basePath}/caixas`), limitToLast(100)) }
    ];
    if (userRole === 'admin') {
      collections.push(
        { name: 'contas', setter: setContas, queryRef: ref(db, `${basePath}/contas`) },
        { name: 'usuarios', setter: setUsuarios, queryRef: ref(db, `${basePath}/usuarios`) }
      );
    } else {
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
      }, (error) => {
        console.error(`Erro ao carregar ${col.name}:`, error);
        setDatabaseError(`Não foi possível carregar ${col.name}. Verifique as regras do Firebase.`);
      });
    });

    return () => unsubs.forEach(u => u());
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
    await httpsCallable(functions, 'openCash')({ valorInicial });
  };

  const fecharCaixa = async () => {
    const caixa = caixaAberto;
    if (!caixa) throw new Error('Nenhum caixa aberto.');
    await httpsCallable(functions, 'closeCash')({ caixaId: caixa.id });
  };

  const salvarProduto = (data: Partial<Produto>, id?: string) => {
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
    return saveRecord('produtos', produto, id);
  };
  const excluirProduto = (id: string) => deleteRecord('produtos', id);
  const salvarCliente = (data: Partial<Cliente>, id?: string) => saveRecord('clientes', data, id);
  const excluirCliente = (id: string) => deleteRecord('clientes', id);
  const salvarCadastro = async (collection: string, data: Record<string, any>, id?: string) => {
    if (collection !== 'usuarios' || id) {
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
    const empresa = requireEmpresa();
    if (!user) throw new Error('Usuário não autenticado. Entre novamente.');
    if (userRole !== 'admin') throw new Error('Somente administradores podem criar usuários.');
    const email = String(data.email || '').trim().toLowerCase();
    if (!email) throw new Error('Informe o e-mail do usuário.');
    let criado: User | null = null;
    try {
      const credencial = await createUserWithEmailAndPassword(provisioningAuth, email, `${crypto.randomUUID()}Aa1!`);
      criado = credencial.user;
      await update(ref(provisioningDb, `users/${criado.uid}`), {
        empresaId: empresa,
        role: data.perfil || 'vendedor',
        email,
        nome: data.nome || '',
        convidadoPor: user.uid
      });
      await sendPasswordResetEmail(provisioningAuth, email);
      await saveRecord('usuarios', { ...data, email, authUid: criado.uid, status: 'convite_enviado', criadoEm: new Date().toISOString() });
      await signOut(provisioningAuth);
    } catch (error: any) {
      if (criado) await remove(ref(provisioningDb, `users/${criado.uid}`)).catch(() => undefined);
      if (criado) await criado.delete().catch(() => undefined);
      await signOut(provisioningAuth).catch(() => undefined);
      throw new Error(error?.code === 'auth/email-already-in-use' ? 'Este e-mail já possui uma conta.' : error?.message || 'Não foi possível criar o usuário.');
    }
  };
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
    if (!Number.isFinite(data.valor) || data.valor <= 0) throw new Error('Informe um valor válido.');
    await httpsCallable(functions, 'addCashEntry')({ caixaId: caixa.id, ...data });
  };

  const finalizarVenda = async (comoOrcamento = false) => {
    if (vendaEmProcessamento.current) return;
    if (carrinho.length === 0 || !empresaId) return alert("Carrinho vazio!");
    if (!comoOrcamento && !caixaAberto) return alert("Abra o caixa primeiro!");

    let subtotal = carrinho.reduce((a, b) => a + (Number(b.venda) * b.qtd), 0);
    let custoTotal = carrinho.reduce((a, b) => a + (Number(b.custo) * b.qtd), 0);
    let desc = Math.max(0, Number(pdvDesconto) || 0);
    desc = Math.min(desc, subtotal);
    
    const estoqueReservado: CarrinhoItem[] = [];
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
          const requestId = crypto.randomUUID();
          await httpsCallable(functions, 'finalizeSale')({
            requestId,
            cliId: pdvCliente,
            pag: pdvPagamento,
            desconto: desc,
            items: carrinho.map(c => ({ id: c.id, codigo: c.codigo, marca: c.marca, modelo: c.modelo, qtd: c.qtd, venda: Number(c.venda), custo: Number(c.custo) }))
          });
      }
      setCarrinho([]); setPdvDesconto(0); setPdvCliente('');
      alert(comoOrcamento ? "Orçamento salvo!" : "Venda concluída com sucesso!");
    } catch (e: any) {
      if (!comoOrcamento && estoqueReservado.length > 0) {
        await Promise.all(estoqueReservado.map(item => runTransaction(ref(db, `empresas/${empresaId}/produtos/${item.id}/qtd`), quantidadeAtual => Number(quantidadeAtual || 0) + item.qtd)));
      }
      alert("Erro ao finalizar: " + e.message);
    } finally {
      vendaEmProcessamento.current = false;
      setFinalizandoVenda(false);
    }
  };

  const value = {
    user, loadingAuth, userRole, empresaId, dadosEmpresa, databaseError, configurarOtica, logout,
    produtos, clientes, vendas, caixas, orcamentos, ordensServico, carrinho,
    fornecedores, contas, categorias, usuarios,
    activeTab, setActiveTab, pdvSearch, setPdvSearch, abrirCaixa, fecharCaixa,
    salvarProduto, excluirProduto, salvarCliente, excluirCliente, salvarCadastro, excluirCadastro, excluirOrcamento, salvarOrdemServico, converterOrcamentoParaOs, registrarLancamentoCaixa,
    addToCart, removeFromCart, finalizarVenda, finalizandoVenda,
    caixaAberto, totalVendasCaixa, pdvCliente, setPdvCliente, pdvDesconto, setPdvDesconto, pdvPagamento, setPdvPagamento
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};