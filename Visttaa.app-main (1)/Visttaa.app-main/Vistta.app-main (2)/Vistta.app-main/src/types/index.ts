export interface Prescricao {
  id?: string;
  medico: string;
  crm?: string;
  dataReceita?: string;
  obs: string;
  longe?: { od: MedidaOtica; oe: MedidaOtica };
  perto?: { od: MedidaOtica; oe: MedidaOtica };
  od: MedidaOtica;
  oe: MedidaOtica;
}

export interface MedidaOtica {
  esf: string;
  cil: string;
  eixo: string;
  dnp: string;
  add: string;
  altura?: string;
}

export interface Endereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  tel: string;
  nasc: string;
  email?: string;
  endereco?: Endereco;
  prescricao?: Prescricao;
  prescricoes?: Prescricao[];
}

export interface Produto {
  id: string;
  codigo: string;
  categoria: string;
  marca: string;
  modelo: string;
  cor: string;
  tamanho?: string;
  material?: string;
  fornecedorId?: string;
  tratamento?: string;
  custo: number | string;
  venda: number | string;
  qtd: number | string;
  min: number | string;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  telefone?: string;
  email?: string;
  contatoComercial?: string;
  endereco?: Endereco;
  categoriaFornecimento?: string;
  prazoEntrega?: number | string;
  condicoesComerciais?: string;
  parceriaAtiva?: boolean;
}

export interface CarrinhoItem extends Produto {
  qtd: number; // Qtd no carrinho
}

export interface Venda {
  id: string;
  cliId: string;
  pag: string;
  subtotal: number;
  desconto: number;
  total: number;
  custoBase: number;
  itens: number;
  data: string;
  caixaId?: string;
}

export interface Orcamento {
  id: string;
  cliId: string;
  subtotal: number;
  desconto: number;
  total: number;
  itens: Array<{ id: string; marca: string; modelo: string; qtd: number; venda: number | string }>;
  data: string;
  status: 'pendente' | 'aprovado' | 'cancelado';
}

export interface Caixa {
  id: string;
  dataAbertura: string;
  valorInicial: number;
  status: 'aberto' | 'fechado';
  operador: string;
  dataFechamento?: string;
  totalVendas?: number;
  valorFinal?: number;
  lancamentos?: CaixaLancamento[];
}

export interface CaixaLancamento {
  id?: string;
  tipo: 'entrada' | 'saida' | 'sangria';
  descricao: string;
  valor: number;
  data: string;
  operador?: string;
}

export type StatusOs = 'aguardando_montagem' | 'em_laboratorio' | 'pronto_retirada' | 'entregue' | 'cancelada';

export interface OrdemServico {
  id: string;
  clienteId: string;
  orcamentoId?: string;
  vendaId?: string;
  itens: Array<{ produtoId?: string; descricao: string; qtd: number; valor: number; tratamento?: string }>;
  receitaId?: string;
  status: StatusOs;
  observacoes?: string;
  previsaoEntrega?: string;
  criadoEm: string;
  atualizadoEm: string;
}
