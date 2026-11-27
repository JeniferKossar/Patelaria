export type CategoriaProduto = string;

export type UnidadeMedida = 'kg' | 'g' | 'un' | 'ml' | 'l';

export type CategoriaInsumo = 
  | 'Carnes & Proteínas'
  | 'Queijos & Laticínios'
  | 'Massas & Farinhas'
  | 'Hortifruti & Recheios'
  | 'Doces & Confeitaria'
  | 'Óleos & Fritura'
  | 'Bebidas'
  | 'Embalagens & Descartáveis'
  | 'Outros';

export interface Insumo {
  id: string;
  nome: string;
  categoria: CategoriaInsumo;
  unidade: UnidadeMedida;
  estoqueAtual: number;
  estoqueMinimo: number;
  custoUnitario: number; // R$ por unidade de medida
  fornecedorPadrao?: string;
  dataCriacao: string;
  origem: 'ficha_tecnica' | 'cadastro_manual';
}

export interface FichaTecnicaItem {
  ingredienteId: string;
  nome?: string;
  quantidade: number;
  unidade: UnidadeMedida;
  custoUnitarioEstimado: number;
}

export interface Produto {
  id: string;
  codigo?: string;
  nome: string;
  categoria: CategoriaProduto;
  preco: number;
  descricao: string;
  ativo: boolean;
  tempoPreparoMinutos: number;
  fichaTecnica: FichaTecnicaItem[];
}

export type StatusMesa = 'livre' | 'ocupada' | 'cozinha' | 'pronta' | 'fechando';

export interface Mesa {
  id: string;
  numero: number;
  nome: string;
  status: StatusMesa;
  capacidade: number;
  pedidoAtualId?: string;
  pessoas?: number;
  tempoAbertura?: string;
}

export interface ItemPedido {
  id: string;
  produtoId: string;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  observacoes?: string;
  fichaTecnicaSnapshot: FichaTecnicaItem[];
}

export type StatusPedido = 'aberto' | 'na_fila' | 'em_preparo' | 'pronto' | 'entregue' | 'pago' | 'cancelado';

export type MetodoPagamento =
  | 'Pix'
  | 'Cartão de Débito'
  | 'Cartão de Crédito'
  | 'Cartão'
  | 'Dinheiro';

export interface Pedido {
  id: string;
  numeroSequencial: number; // ex: 1042
  mesaId?: string;
  mesaNumero?: number;
  pessoas?: number;
  canal?: 'salao' | 'balcao';
  identificacaoBalcao?: string;
  status: StatusPedido;
  itens: ItemPedido[];
  subtotal: number;
  taxaServicoAtiva: boolean;
  taxaServicoValor: number;
  total: number;
  metodoPagamento?: MetodoPagamento;
  horarioCriacao: string;
  horarioEnvioCozinha?: string;
  horarioInicioPreparo?: string;
  horarioPronto?: string;
  horarioEntrega?: string;
  horarioFechamento?: string;
  observacaoGeral?: string;
}

export type TipoMovimentacaoEstoque = 
  | 'entrada_compra'
  | 'baixa_pedido'
  | 'ajuste_manual'
  | 'perda_descarte';

export interface MovimentacaoEstoque {
  id: string;
  ingredienteId: string;
  ingredienteNome: string;
  tipo: TipoMovimentacaoEstoque;
  quantidade: number; // positiva para entrada, negativa para saída
  unidade: UnidadeMedida;
  saldoAnterior: number;
  saldoPosterior: number;
  dataHora: string;
  dataOcorrencia?: string;
  pedidoId?: string;
  motivo?: string;
  custoTotal?: number;
}

export type TipoTransacao = 'entrada' | 'saida';

export interface TransacaoFinanceira {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  categoria: string;
  metodo: MetodoPagamento | 'Transferência' | 'Boleto';
  valor: number;
  dataHora: string;
  dataOcorrencia?: string;
  pedidoId?: string;
  origem:
    | 'pedido_fechado'
    | 'entrada_mercadoria'
    | 'despesa_manual'
    | 'abertura_caixa'
    | 'suprimento'
    | 'sangria';
  turnoId?: string;
}

export interface TurnoCaixa {
  id: string;
  aberto: boolean;
  fundoInicial: number;
  abertoEm: string;
  fechadoEm?: string;
  valorContado?: number;
  valorEsperado?: number;
  diferenca?: number;
}

export type ModuloAtivo = 'pedido' | 'cozinha' | 'estoque' | 'cardapio' | 'financas';
