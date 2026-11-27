import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { doc, getDoc } from 'firebase/firestore';
import { executeQuery } from 'firebase/data-connect';
import {
  getCurrentUserAppStateRef,
  saveCurrentUserAppState,
} from '@dataconnect/generated';
import { db } from '../firebase';
import {
  Insumo,
  Produto,
  Mesa,
  Pedido,
  MovimentacaoEstoque,
  TransacaoFinanceira,
  ModuloAtivo,
  MetodoPagamento,
  ItemPedido,
  UnidadeMedida,
  CategoriaInsumo,
  CategoriaProduto,
  TurnoCaixa,
} from '../types';

interface AppContextType {
  dataSyncReady: boolean;
  dataSyncError: string | null;
  moduloAtivo: ModuloAtivo;
  setModuloAtivo: (modulo: ModuloAtivo) => void;
  canalAtendimento: 'salao' | 'balcao';
  setCanalAtendimento: (canal: 'salao' | 'balcao') => void;
  pedidoBalcaoSelecionadoId: string | null;
  setPedidoBalcaoSelecionadoId: (id: string | null) => void;
  mesaSelecionadaId: string | null;
  setMesaSelecionadaId: (id: string | null) => void;

  insumos: Insumo[];
  fornecedores: string[];
  categoriasProduto: CategoriaProduto[];
  produtos: Produto[];
  mesas: Mesa[];
  pedidos: Pedido[];
  movimentacoes: MovimentacaoEstoque[];
  transacoes: TransacaoFinanceira[];
  turnoCaixa: TurnoCaixa | null;
  valorEsperadoGaveta: number;
  abrirCaixa: (fundoInicial: number) => { sucesso: boolean; mensagem: string };
  fecharCaixa: (valorContado: number) => { sucesso: boolean; mensagem: string; esperado?: number; diferenca?: number };
  registrarMovimentacaoCaixa: (tipo: 'entrada' | 'saida', descricao: string, valor: number, dataOcorrencia: string) => void;
  criarPedidoBalcao: (identificacao: string) => string | null;
  cobrarPedidoBalcao: (pedidoId: string, metodo: MetodoPagamento) => { sucesso: boolean; mensagem: string };
  atualizarIdentificacaoPedidoBalcao: (pedidoId: string, identificacao: string) => void;

  // Atendimento / Mesas / Pedidos
  abrirMesa: (numeroMesa: number, pessoas?: number) => void;
  atualizarPessoasMesa: (mesaId: string, delta: number) => { sucesso: boolean; mensagem: string };
  adicionarMesa: (nome: string, capacidade: number) => { sucesso: boolean; mensagem: string };
  excluirMesa: (id: string, motivo: string) => { sucesso: boolean; mensagem: string };
  cancelarPedido: (pedidoId: string, motivo: string) => { sucesso: boolean; mensagem: string };
  adicionarItemAoPedido: (mesaId: string, produtoId: string, quantidade?: number, observacoes?: string) => void;
  removerItemDoPedido: (mesaId: string, itemId: string) => void;
  atualizarQuantidadeItemPedido: (mesaId: string, itemId: string, delta: number) => void;
  atualizarObservacaoItem: (mesaId: string, itemId: string, observacao: string) => void;
  toggleTaxaServico: (mesaId: string) => void;
  enviarPedidoParaCozinha: (mesaId: string) => void;
  fecharMesaComPagamento: (mesaId: string, metodo: MetodoPagamento) => { sucesso: boolean; mensagem: string };

  // Cozinha Kanban
  avancarStatusCozinha: (pedidoId: string) => void;

  // Cardápio
  salvarProdutoComFichaTecnica: (produto: Omit<Produto, 'id'> & { id?: string }) => void;
  adicionarCategoriaProduto: (nome: string) => { sucesso: boolean; mensagem: string };
  renomearCategoriaProduto: (nomeAtual: string, novoNome: string) => { sucesso: boolean; mensagem: string };
  excluirCategoriaProduto: (nome: string, categoriaSubstituta?: string) => { sucesso: boolean; mensagem: string };
  renomearProduto: (id: string, nome: string) => { sucesso: boolean; mensagem: string };
  excluirProduto: (id: string) => void;
  alternarStatusProduto: (id: string) => void;

  // Estoque
  adicionarInsumoDireto: (insumo: Omit<Insumo, 'id' | 'dataCriacao' | 'origem'>) => string;
  atualizarInsumo: (id: string, dados: Pick<Insumo, 'nome' | 'categoria' | 'unidade' | 'estoqueMinimo' | 'custoUnitario'> & { fornecedorPadrao: string }) => { sucesso: boolean; mensagem: string };
  adicionarFornecedor: (nome: string) => { sucesso: boolean; mensagem: string };
  renomearFornecedor: (nomeAtual: string, novoNome: string) => { sucesso: boolean; mensagem: string };
  excluirFornecedor: (nome: string) => { sucesso: boolean; mensagem: string };
  renomearInsumo: (id: string, nome: string) => { sucesso: boolean; mensagem: string };
  excluirInsumo: (id: string, motivo: string) => { sucesso: boolean; mensagem: string };
  registrarEntradaMercadoria: (dados: {
    ingredienteId: string;
    quantidade: number;
    custoUnitario: number;
    fornecedor?: string;
    notaFiscal?: string;
    gerarSaidaCaixa: boolean;
    metodoPagamento?: MetodoPagamento;
    dataCompra: string;
  }) => void;
  ajustarEstoqueManual: (dados: {
    ingredienteId: string;
    novoEstoque: number;
    motivo: string;
  }) => void;

  // Finanças
  adicionarDespesaManual: (dados: {
    descricao: string;
    categoria: string;
    metodo: MetodoPagamento | 'Transferência' | 'Boleto';
    valor: number;
    dataOcorrencia: string;
  }) => void;
  excluirTransacaoFinanceira: (id: string) => void;
  exportarExtratoCSV: (transacoesExportacao: TransacaoFinanceira[], periodo: string) => void;

  // Utilitários
  currentTimeString: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const LEGACY_STORAGE_OWNER_KEY = 'mesaviva_local_data_owner_v1';

interface PersistedAppData {
  insumos: Insumo[];
  fornecedores: string[];
  categoriasProduto: CategoriaProduto[];
  produtos: Produto[];
  mesas: Mesa[];
  pedidos: Pedido[];
  movimentacoes: MovimentacaoEstoque[];
  transacoes: TransacaoFinanceira[];
  turnoCaixa: TurnoCaixa | null;
}

const STORAGE_KEYS = {
  MODULO: 'mesaviva_modulo',
  MESA_SELECIONADA: 'mesaviva_mesa_selecionada_v1',
  INSUMOS: 'mesaviva_insumos_v1',
  PRODUTOS: 'mesaviva_produtos_v1',
  MESAS: 'mesaviva_mesas_v1',
  PEDIDOS: 'mesaviva_pedidos_v1',
  MOVIMENTACOES: 'mesaviva_movimentacoes_v1',
  TRANSACOES: 'mesaviva_transacoes_v1',
  TURNO_CAIXA: 'mesaviva_turno_caixa_v1',
  FORNECEDORES: 'mesaviva_fornecedores_v1',
  CATEGORIAS_PRODUTO: 'mesaviva_categorias_produto_v1',
};

function getUserStorageKey(userId: string, key: string) {
  return `${key}_${userId}`;
}

function getUserStoredValue(userId: string, key: string) {
  const scopedValue = localStorage.getItem(getUserStorageKey(userId, key));
  if (scopedValue !== null) return scopedValue;
  const legacyOwner = localStorage.getItem(LEGACY_STORAGE_OWNER_KEY);
  return !legacyOwner || legacyOwner === userId ? localStorage.getItem(key) : null;
}

function setUserStoredValue(userId: string, key: string, value: string) {
  localStorage.setItem(getUserStorageKey(userId, key), value);
}

function removeUserStoredValue(userId: string, key: string) {
  localStorage.removeItem(getUserStorageKey(userId, key));
}

const CATEGORIAS_PRODUTO_PADRAO: CategoriaProduto[] = [
  'Pastéis Salgados',
  'Pastéis Doces',
  'Porções',
  'Bebidas',
];

function formatCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizePersistedData(data: Record<string, unknown>): PersistedAppData {
  return {
    insumos: Array.isArray(data.insumos) ? data.insumos as Insumo[] : [],
    fornecedores: Array.isArray(data.fornecedores) ? data.fornecedores as string[] : [],
    categoriasProduto: Array.isArray(data.categoriasProduto) ? data.categoriasProduto as CategoriaProduto[] : [],
    produtos: Array.isArray(data.produtos) ? data.produtos as Produto[] : [],
    mesas: Array.isArray(data.mesas) ? data.mesas as Mesa[] : [],
    pedidos: Array.isArray(data.pedidos) ? data.pedidos as Pedido[] : [],
    movimentacoes: Array.isArray(data.movimentacoes) ? data.movimentacoes as MovimentacaoEstoque[] : [],
    transacoes: Array.isArray(data.transacoes) ? data.transacoes as TransacaoFinanceira[] : [],
    turnoCaixa: data.turnoCaixa && typeof data.turnoCaixa === 'object'
      ? data.turnoCaixa as TurnoCaixa
      : null,
  };
}

function serializePersistedData(data: PersistedAppData): PersistedAppData {
  return JSON.parse(JSON.stringify(data)) as PersistedAppData;
}

export const AppProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ children, userId }) => {
  const [moduloAtivo, setModuloAtivoState] = useState<ModuloAtivo>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.MODULO);
    return (saved as ModuloAtivo) || 'pedido';
  });
  const [canalAtendimento, setCanalAtendimento] = useState<'salao' | 'balcao'>('salao');
  const [pedidoBalcaoSelecionadoId, setPedidoBalcaoSelecionadoId] = useState<string | null>(null);

  const [mesaSelecionadaId, setMesaSelecionadaId] = useState<string | null>(
    () => getUserStoredValue(userId, STORAGE_KEYS.MESA_SELECIONADA)
  );

  const [insumos, setInsumos] = useState<Insumo[]>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.INSUMOS);
    return saved ? JSON.parse(saved) : [];
  });

  const [fornecedores, setFornecedores] = useState<string[]>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.FORNECEDORES);
    const fornecedoresSalvos: string[] = saved ? JSON.parse(saved) : [];
    return Array.from(new Set([
      ...fornecedoresSalvos,
      ...insumos.map((insumo) => insumo.fornecedorPadrao?.trim() || '').filter(Boolean),
    ]));
  });

  const [produtos, setProdutos] = useState<Produto[]>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.PRODUTOS);
    return saved ? JSON.parse(saved) : [];
  });

  const [categoriasProduto, setCategoriasProduto] = useState<CategoriaProduto[]>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.CATEGORIAS_PRODUTO);
    const categoriasSalvas: CategoriaProduto[] = saved ? JSON.parse(saved) : [];
    return Array.from(new Set([
      ...CATEGORIAS_PRODUTO_PADRAO,
      ...categoriasSalvas,
      ...produtos.map((produto) => produto.categoria),
    ]));
  });

  const [mesas, setMesas] = useState<Mesa[]>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.MESAS);
    return saved ? JSON.parse(saved) : [];
  });

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.PEDIDOS);
    return saved ? JSON.parse(saved) : [];
  });

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.MOVIMENTACOES);
    return saved ? JSON.parse(saved) : [];
  });

  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.TRANSACOES);
    return saved ? JSON.parse(saved) : [];
  });

  const [turnoCaixa, setTurnoCaixa] = useState<TurnoCaixa | null>(() => {
    const saved = getUserStoredValue(userId, STORAGE_KEYS.TURNO_CAIXA);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as TurnoCaixa;
    } catch (error) {
      console.error('Não foi possível ler o turno de caixa salvo.', error);
      return null;
    }
  });
  const [dataSyncReady, setDataSyncReady] = useState(false);
  const [dataSyncError, setDataSyncError] = useState<string | null>(null);
  const initialDataRef = useRef<PersistedAppData>({
    insumos,
    fornecedores,
    categoriasProduto,
    produtos,
    mesas,
    pedidos,
    movimentacoes,
    transacoes,
    turnoCaixa,
  });
  const lastSyncedDataRef = useRef<string | null>(null);
  const pendingDataRef = useRef<PersistedAppData | null>(null);
  useEffect(() => {
    setDataSyncReady(false);
    setDataSyncError(null);
    lastSyncedDataRef.current = null;
    pendingDataRef.current = null;
    if (!localStorage.getItem(LEGACY_STORAGE_OWNER_KEY)) {
      localStorage.setItem(LEGACY_STORAGE_OWNER_KEY, userId);
    }
    let active = true;
    let polling = false;
    let initialSyncComplete = false;

    const readSqlData = async () => {
      const result = await executeQuery(getCurrentUserAppStateRef(), {
        fetchPolicy: 'SERVER_ONLY',
      });
      const state = result.data.appStates[0]?.state;
      return state && typeof state === 'object'
        ? normalizePersistedData(state as Record<string, unknown>)
        : null;
    };

    const applyCloudData = (cloudData: PersistedAppData) => {
      const normalizedData = serializePersistedData(cloudData);
      const signature = JSON.stringify(normalizedData);
      if (signature === lastSyncedDataRef.current) return;
      lastSyncedDataRef.current = signature;
      setInsumos(normalizedData.insumos);
      setFornecedores(normalizedData.fornecedores);
      setCategoriasProduto(normalizedData.categoriasProduto);
      setProdutos(normalizedData.produtos);
      setMesas(normalizedData.mesas);
      setPedidos(normalizedData.pedidos);
      setMovimentacoes(normalizedData.movimentacoes);
      setTransacoes(normalizedData.transacoes);
      setTurnoCaixa(normalizedData.turnoCaixa);
    };

    const syncFromSql = async (migrateIfMissing: boolean) => {
      if (pendingDataRef.current) {
        const pendingData = pendingDataRef.current;
        const pendingSignature = JSON.stringify(pendingData);
        await saveCurrentUserAppState({ state: pendingData });
        if (JSON.stringify(pendingDataRef.current) === pendingSignature) {
          pendingDataRef.current = null;
          lastSyncedDataRef.current = pendingSignature;
        }
        setDataSyncError(null);
        setDataSyncReady(true);
        return;
      }

      const sqlData = await readSqlData();
      if (sqlData) {
        applyCloudData(sqlData);
        initialSyncComplete = true;
        setDataSyncError(null);
        setDataSyncReady(true);
        return;
      }

      if (!migrateIfMissing) return;

      const legacySnapshot = await getDoc(doc(db, 'users', userId, 'appData', 'state'));
      const initialData = legacySnapshot.exists()
        ? normalizePersistedData(legacySnapshot.data())
        : serializePersistedData(initialDataRef.current);
      const migratedData = serializePersistedData(initialData);
      await saveCurrentUserAppState({ state: migratedData });
      applyCloudData(migratedData);
      initialSyncComplete = true;
      setDataSyncError(null);
      setDataSyncReady(true);
    };

    polling = true;
    void syncFromSql(true).catch((error: unknown) => {
      if (!active) return;
      console.error('Não foi possível carregar ou migrar os dados para o SQL Connect.', error);
      setDataSyncError('Não foi possível sincronizar os dados com o SQL Connect. Verifique a conexão e as permissões.');
      setDataSyncReady(true);
    }).finally(() => {
      polling = false;
    });

    const intervalId = window.setInterval(() => {
      if (polling || !active) return;
      polling = true;
      void syncFromSql(!initialSyncComplete).catch((error: unknown) => {
        if (!active) return;
        console.error('Não foi possível atualizar os dados do SQL Connect.', error);
        setDataSyncError('Não foi possível atualizar os dados do SQL Connect. Verifique a conexão.');
      }).finally(() => {
        polling = false;
      });
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [userId]);

  useEffect(() => {
    if (!dataSyncReady || dataSyncError) return;
    const cloudData = serializePersistedData({
      insumos,
      fornecedores,
      categoriasProduto,
      produtos,
      mesas,
      pedidos,
      movimentacoes,
      transacoes,
      turnoCaixa,
    });
    const signature = JSON.stringify(cloudData);
    if (signature === lastSyncedDataRef.current) return;

    lastSyncedDataRef.current = signature;
    pendingDataRef.current = cloudData;
    void saveCurrentUserAppState({ state: cloudData }).then(() => {
      if (JSON.stringify(pendingDataRef.current) === signature) {
        pendingDataRef.current = null;
      }
      setDataSyncError(null);
    }).catch((error: unknown) => {
      console.error('Não foi possível salvar os dados no SQL Connect.', error);
      setDataSyncError('Não foi possível sincronizar os dados. Verifique a conexão e as permissões do SQL Connect.');
    });
  }, [
    dataSyncReady,
    dataSyncError,
    userId,
    insumos,
    fornecedores,
    categoriasProduto,
    produtos,
    mesas,
    pedidos,
    movimentacoes,
    transacoes,
    turnoCaixa,
  ]);

  const valorEsperadoGaveta = turnoCaixa
    ? Number((
        turnoCaixa.fundoInicial +
        transacoes
          .filter((transacao) =>
            transacao.turnoId === turnoCaixa.id &&
            transacao.origem !== 'abertura_caixa' &&
            (transacao.dataOcorrencia || formatLocalDate()) >= formatLocalDate(new Date(turnoCaixa.abertoEm)) &&
            (transacao.metodo === 'Dinheiro' ||
              (transacao.tipo === 'saida' && transacao.categoria === 'Insumos & Mercadorias'))
          )
          .reduce((saldo, transacao) => saldo + (transacao.tipo === 'entrada' ? transacao.valor : -transacao.valor), 0)
      ).toFixed(2))
    : 0;

  const [currentTimeString, setCurrentTimeString] = useState<string>(formatCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeString(formatCurrentTime());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Sync to local storage
  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.MODULO, moduloAtivo);
  }, [moduloAtivo]);

  useEffect(() => {
    if (mesaSelecionadaId && mesas.some((mesa) => mesa.id === mesaSelecionadaId)) {
      setUserStoredValue(userId, STORAGE_KEYS.MESA_SELECIONADA, mesaSelecionadaId);
    } else if (mesas.length > 0) {
      setMesaSelecionadaId(mesas[0].id);
    } else {
      removeUserStoredValue(userId, STORAGE_KEYS.MESA_SELECIONADA);
    }
  }, [userId, mesaSelecionadaId, mesas]);

  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.INSUMOS, JSON.stringify(insumos));
  }, [userId, insumos]);

  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.FORNECEDORES, JSON.stringify(fornecedores));
  }, [userId, fornecedores]);

  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
  }, [userId, produtos]);

  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.CATEGORIAS_PRODUTO, JSON.stringify(categoriasProduto));
  }, [userId, categoriasProduto]);

  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.MESAS, JSON.stringify(mesas));
  }, [userId, mesas]);

  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.PEDIDOS, JSON.stringify(pedidos));
  }, [userId, pedidos]);

  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.MOVIMENTACOES, JSON.stringify(movimentacoes));
  }, [userId, movimentacoes]);

  useEffect(() => {
    setUserStoredValue(userId, STORAGE_KEYS.TRANSACOES, JSON.stringify(transacoes));
  }, [userId, transacoes]);

  useEffect(() => {
    if (turnoCaixa) {
      setUserStoredValue(userId, STORAGE_KEYS.TURNO_CAIXA, JSON.stringify(turnoCaixa));
    } else {
      removeUserStoredValue(userId, STORAGE_KEYS.TURNO_CAIXA);
    }
  }, [userId, turnoCaixa]);

  const setModuloAtivo = (modulo: ModuloAtivo) => {
    setModuloAtivoState(modulo);
  };

  const abrirCaixa = (fundoInicial: number) => {
    if (!Number.isFinite(fundoInicial) || fundoInicial < 0) {
      return { sucesso: false, mensagem: 'Informe um fundo inicial válido.' };
    }
    if (turnoCaixa?.aberto) {
      return { sucesso: false, mensagem: 'O caixa já está aberto.' };
    }
    const novoTurno: TurnoCaixa = {
      id: `turno-${Date.now()}`,
      aberto: true,
      fundoInicial: Number(fundoInicial.toFixed(2)),
      abertoEm: new Date().toISOString(),
    };
    setTurnoCaixa(novoTurno);
    setTransacoes((prev) => [{
      id: `trans-${Date.now()}`,
      tipo: 'entrada',
      descricao: 'Fundo inicial de caixa',
      categoria: 'Abertura de caixa',
      metodo: 'Dinheiro',
      valor: novoTurno.fundoInicial,
      dataHora: formatCurrentTime(),
      dataOcorrencia: formatLocalDate(),
      origem: 'abertura_caixa',
      turnoId: novoTurno.id,
    }, ...prev]);
    return { sucesso: true, mensagem: 'Caixa aberto. O fundo inicial foi registrado.' };
  };

  const fecharCaixa = (valorContado: number) => {
    if (!turnoCaixa?.aberto) {
      return { sucesso: false, mensagem: 'Não há um turno de caixa aberto.' };
    }
    if (!Number.isFinite(valorContado) || valorContado < 0) {
      return { sucesso: false, mensagem: 'Informe um valor contado válido.' };
    }
    const esperado = valorEsperadoGaveta;
    const diferenca = Number((valorContado - esperado).toFixed(2));
    setTurnoCaixa({
      ...turnoCaixa,
      aberto: false,
      fechadoEm: new Date().toISOString(),
      valorContado: Number(valorContado.toFixed(2)),
      valorEsperado: esperado,
      diferenca,
    });
    return {
      sucesso: true,
      mensagem: diferenca === 0 ? 'Caixa fechado sem divergência.' : 'Caixa fechado. Confira a diferença apurada.',
      esperado,
      diferenca,
    };
  };

  const registrarMovimentacaoCaixa = (tipo: 'entrada' | 'saida', descricao: string, valor: number, dataOcorrencia: string) => {
    if (!turnoCaixa?.aberto || !descricao.trim() || !Number.isFinite(valor) || valor <= 0 || !dataOcorrencia) return;
    const origem = tipo === 'entrada' ? 'suprimento' : 'sangria';
    const categoria = tipo === 'entrada' ? 'Suprimento de caixa' : 'Sangria';
    const transacao: TransacaoFinanceira = {
      id: `trans-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipo,
      descricao: descricao.trim(),
      categoria,
      metodo: 'Dinheiro',
      valor: Number(valor.toFixed(2)),
      dataHora: formatCurrentTime(),
      dataOcorrencia,
      origem,
      turnoId: turnoCaixa.id,
    };
    setTransacoes((prev) => [transacao, ...prev]);
  };

  // --- ATENDIMENTO & PEDIDOS ---

  const abrirMesa = (numeroMesa: number, pessoas = 2) => {
    if (!turnoCaixa?.aberto) return;
    const mesaExistente = mesas.find((m) => m.numero === numeroMesa);
    if (!mesaExistente) return;

    if (mesaExistente.status !== 'livre') {
      setMesaSelecionadaId(mesaExistente.id);
      return;
    }

    if (!Number.isInteger(pessoas) || pessoas < 1) return;
    const pessoasAtendidas = Math.min(pessoas, mesaExistente.capacidade);
    const nextNumeroSequencial =
      pedidos.length > 0 ? Math.max(...pedidos.map((p) => p.numeroSequencial)) + 1 : 1001;

    const novoPedidoId = `ped-${Date.now()}`;
    const novoPedido: Pedido = {
      id: novoPedidoId,
      numeroSequencial: nextNumeroSequencial,
      mesaId: mesaExistente.id,
      mesaNumero: numeroMesa,
      pessoas: pessoasAtendidas,
      status: 'aberto',
      itens: [],
      subtotal: 0,
      taxaServicoAtiva: false,
      taxaServicoValor: 0,
      total: 0,
      horarioCriacao: formatCurrentTime(),
    };

    setPedidos((prev) => [novoPedido, ...prev]);
    setMesas((prev) =>
      prev.map((m) =>
        m.id === mesaExistente.id
          ? {
              ...m,
              status: 'ocupada',
              pedidoAtualId: novoPedidoId,
              pessoas: pessoasAtendidas,
              tempoAbertura: formatCurrentTime(),
            }
          : m
      )
    );
    setMesaSelecionadaId(mesaExistente.id);
  };

  const criarPedidoBalcao = (identificacao: string): string | null => {
    if (!turnoCaixa?.aberto || !identificacao.trim()) return null;
    const numeroSequencial = pedidos.length > 0
      ? Math.max(...pedidos.map((pedido) => pedido.numeroSequencial)) + 1
      : 1001;
    const id = `balcao-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const pedido: Pedido = {
      id,
      numeroSequencial,
      pessoas: 0,
      canal: 'balcao',
      identificacaoBalcao: identificacao.trim(),
      status: 'aberto',
      itens: [],
      subtotal: 0,
      taxaServicoAtiva: false,
      taxaServicoValor: 0,
      total: 0,
      horarioCriacao: formatCurrentTime(),
    };
    setPedidos((prev) => [pedido, ...prev]);
    setPedidoBalcaoSelecionadoId(id);
    return id;
  };

  const atualizarIdentificacaoPedidoBalcao = (pedidoId: string, identificacao: string) => {
    setPedidos((prev) => prev.map((pedido) =>
      pedido.id === pedidoId && pedido.canal === 'balcao' && pedido.status === 'aberto'
        ? { ...pedido, identificacaoBalcao: identificacao.trim() }
        : pedido
    ));
  };

  const atualizarPessoasMesa = (mesaId: string, delta: number) => {
    const mesa = mesas.find((item) => item.id === mesaId);
    if (!mesa || mesa.status === 'livre' || !mesa.pedidoAtualId) {
      return { sucesso: false, mensagem: 'Abra uma comanda antes de alterar as pessoas.' };
    }
    if (!Number.isInteger(delta) || delta === 0) {
      return { sucesso: false, mensagem: 'A quantidade deve ser alterada em números inteiros.' };
    }

    const pessoas = (mesa.pessoas || 1) + delta;
    if (pessoas < 1 || pessoas > mesa.capacidade) {
      return {
        sucesso: false,
        mensagem: `Esta mesa aceita de 1 a ${mesa.capacidade} pessoas.`,
      };
    }

    setMesas((prev) => prev.map((item) => (
      item.id === mesaId ? { ...item, pessoas } : item
    )));
    setPedidos((prev) => prev.map((pedido) => (
      pedido.id === mesa.pedidoAtualId ? { ...pedido, pessoas } : pedido
    )));
    return { sucesso: true, mensagem: `Quantidade atualizada para ${pessoas} pessoas.` };
  };

  const adicionarMesa = (nome: string, capacidade: number) => {
    const nomeNormalizado = nome.trim();
    if (!nomeNormalizado || nomeNormalizado.length > 40) {
      return { sucesso: false, mensagem: 'Informe um nome de mesa com até 40 caracteres.' };
    }
    if (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > 30) {
      return { sucesso: false, mensagem: 'A capacidade deve ser de 1 a 30 pessoas.' };
    }
    if (mesas.some((mesa) => mesa.nome.toLocaleLowerCase() === nomeNormalizado.toLocaleLowerCase())) {
      return { sucesso: false, mensagem: 'Já existe uma mesa com esse nome.' };
    }

    const maiorNumero = pedidos.reduce(
      (maior, pedido) => Math.max(maior, pedido.mesaNumero || 0),
      mesas.reduce((maior, mesa) => Math.max(maior, mesa.numero), 0)
    );
    const numero = maiorNumero + 1;
    const novaMesa: Mesa = {
      id: `mesa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      numero,
      nome: nomeNormalizado,
      status: 'livre',
      capacidade,
    };
    setMesas((prev) => [...prev, novaMesa]);
    setMesaSelecionadaId(novaMesa.id);
    return { sucesso: true, mensagem: `${nomeNormalizado} foi adicionada.` };
  };

  const excluirMesa = (id: string, motivo: string) => {
    const mesa = mesas.find((item) => item.id === id);
    if (!mesa) return { sucesso: false, mensagem: 'Mesa não encontrada.' };
    if (mesa.status !== 'livre' || mesa.pedidoAtualId) {
      return { sucesso: false, mensagem: 'Feche ou cancele a comanda antes de excluir esta mesa.' };
    }
    if (!motivo.trim()) {
      return { sucesso: false, mensagem: 'Selecione um motivo para excluir a mesa.' };
    }

    setMesas((prev) => prev.filter((item) => item.id !== id));
    if (mesaSelecionadaId === id) {
      setMesaSelecionadaId(mesas.find((item) => item.id !== id)?.id || null);
    }
    return { sucesso: true, mensagem: `${mesa.nome} foi excluída. Motivo: ${motivo.trim()}` };
  };

  const recalcularPedido = (pedido: Pedido): Pedido => {
    const subtotal = pedido.itens.reduce(
      (acc, item) => acc + item.precoUnitario * item.quantidade,
      0
    );
    const taxaServicoValor = pedido.taxaServicoAtiva ? Number((subtotal * 0.1).toFixed(2)) : 0;
    const total = Number((subtotal + taxaServicoValor).toFixed(2));
    return {
      ...pedido,
      subtotal,
      taxaServicoValor,
      total,
    };
  };

  const adicionarItemAoPedido = (
    mesaId: string,
    produtoId: string,
    quantidade = 1,
    observacoes = ''
  ) => {
    if (!turnoCaixa?.aberto) return;
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!Number.isInteger(quantidade) || quantidade < 1) return;

    const produto = produtos.find((p) => p.id === produtoId && p.ativo);
    if (!produto) return;

    if (!mesa) {
      const pedidoExistente = pedidos.find((pedido) => pedido.id === mesaId && pedido.canal === 'balcao' && pedido.status === 'aberto');
      if (!pedidoExistente) return;
      setPedidos((prevPedidos) => prevPedidos.map((pedido) => {
        if (pedido.id !== pedidoExistente.id) return pedido;
        const indiceItem = pedido.itens.findIndex(
          (item) => item.produtoId === produtoId && (item.observacoes || '') === (observacoes || '')
        );
        const novosItens = indiceItem >= 0
          ? pedido.itens.map((item, index) => index === indiceItem
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item)
          : [...pedido.itens, {
              id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              produtoId: produto.id,
              nome: produto.nome,
              precoUnitario: produto.preco,
              quantidade,
              observacoes,
              fichaTecnicaSnapshot: produto.fichaTecnica,
            }];
        return recalcularPedido({ ...pedido, itens: novosItens });
      }));
      return;
    }

    const targetPedidoId = mesa.pedidoAtualId || `ped-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setPedidos((prevPedidos) => {
      let pedidoIndex = prevPedidos.findIndex((p) => p.id === targetPedidoId);

      let currentPedido: Pedido;
      if (pedidoIndex === -1) {
        const nextNum =
          prevPedidos.length > 0 ? Math.max(...prevPedidos.map((p) => p.numeroSequencial)) + 1 : 1001;
        currentPedido = {
          id: targetPedidoId!,
          numeroSequencial: nextNum,
          mesaId,
          mesaNumero: mesa.numero,
          pessoas: mesa.pessoas || Math.min(2, mesa.capacidade),
          status: 'aberto',
          itens: [],
          subtotal: 0,
          taxaServicoAtiva: false,
          taxaServicoValor: 0,
          total: 0,
          horarioCriacao: formatCurrentTime(),
        };
      } else {
        currentPedido = prevPedidos[pedidoIndex];
      }

      // Check if same product without differing notes already exists
      const existingItemIndex = currentPedido.itens.findIndex(
        (i) => i.produtoId === produtoId && (i.observacoes || '') === (observacoes || '')
      );

      let novosItens: ItemPedido[];
      if (existingItemIndex >= 0) {
        novosItens = currentPedido.itens.map((it, idx) =>
          idx === existingItemIndex
            ? { ...it, quantidade: it.quantidade + quantidade }
            : it
        );
      } else {
        const novoItem: ItemPedido = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          produtoId: produto.id,
          nome: produto.nome,
          precoUnitario: produto.preco,
          quantidade,
          observacoes,
          fichaTecnicaSnapshot: produto.fichaTecnica,
        };
        novosItens = [...currentPedido.itens, novoItem];
      }

      const updated = recalcularPedido({
        ...currentPedido,
        itens: novosItens,
      });

      if (pedidoIndex === -1) {
        return [updated, ...prevPedidos];
      }
      return prevPedidos.map((p, idx) => (idx === pedidoIndex ? updated : p));
    });

    // Make sure mesa is marked as ocupada with current order
    setMesas((prev) =>
      prev.map((m) =>
        m.id === mesaId
          ? {
              ...m,
              status: m.status === 'livre' ? 'ocupada' : m.status,
              pedidoAtualId: targetPedidoId,
              pessoas: m.pessoas || Math.min(2, m.capacidade),
              tempoAbertura: m.tempoAbertura || formatCurrentTime(),
            }
          : m
      )
    );
    setMesaSelecionadaId(mesaId);
  };

  const removerItemDoPedido = (mesaId: string, itemId: string) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    const pedidoId = mesa?.pedidoAtualId || mesaId;

    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId || (p.canal === 'balcao' && p.status !== 'aberto')) return p;
        const novosItens = p.itens.filter((item) => item.id !== itemId);
        return recalcularPedido({ ...p, itens: novosItens });
      })
    );
  };

  const atualizarQuantidadeItemPedido = (mesaId: string, itemId: string, delta: number) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    const pedidoId = mesa?.pedidoAtualId || mesaId;

    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId || (p.canal === 'balcao' && p.status !== 'aberto')) return p;
        const novosItens = p.itens
          .map((item) => {
            if (item.id === itemId) {
              const novaQtd = item.quantidade + delta;
              return novaQtd > 0 ? { ...item, quantidade: novaQtd } : null;
            }
            return item;
          })
          .filter(Boolean) as ItemPedido[];

        return recalcularPedido({ ...p, itens: novosItens });
      })
    );
  };

  const atualizarObservacaoItem = (mesaId: string, itemId: string, observacao: string) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    const pedidoId = mesa?.pedidoAtualId || mesaId;

    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId || (p.canal === 'balcao' && p.status !== 'aberto')) return p;
        const novosItens = p.itens.map((item) =>
          item.id === itemId ? { ...item, observacoes: observacao } : item
        );
        return { ...p, itens: novosItens };
      })
    );
  };

  const toggleTaxaServico = (mesaId: string) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    const pedidoId = mesa?.pedidoAtualId || mesaId;

    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId || p.canal === 'balcao') return p;
        return recalcularPedido({
          ...p,
          taxaServicoAtiva: !p.taxaServicoAtiva,
        });
      })
    );
  };

  const enviarPedidoParaCozinha = (mesaId: string) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    const pedidoId = mesa?.pedidoAtualId || mesaId;
    const pedido = pedidos.find((item) => item.id === pedidoId);
    if (!pedido || pedido.status !== 'aberto' || pedido.itens.length === 0) return;

    const agora = formatCurrentTime();
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              status: 'na_fila',
              horarioEnvioCozinha: agora,
            }
          : p
      )
    );

    if (mesa) {
      setMesas((prev) =>
        prev.map((m) => (m.id === mesaId ? { ...m, status: 'cozinha' } : m))
      );
    }
  };

  // --- FECHAMENTO E COBRANÇA + BAIXA AUTOMATIZADA NO ESTOQUE + FINANÇAS ---

  const baixarEstoqueDoPedido = (pedido: Pedido, agora: string) => {
    const novasMovimentacoes: MovimentacaoEstoque[] = [];
    const novoMapaInsumos = new Map<string, Insumo>(insumos.map((insumo) => [insumo.id, { ...insumo }]));
    pedido.itens.forEach((item) => {
      const produto = produtos.find((referencia) => referencia.id === item.produtoId);
      const ficha = produto?.fichaTecnica.length ? produto.fichaTecnica : item.fichaTecnicaSnapshot;
      ficha.forEach((ingredienteFicha) => {
        const insumo = novoMapaInsumos.get(ingredienteFicha.ingredienteId);
        if (!insumo) return;
        const quantidadeConsumida = Number((ingredienteFicha.quantidade * item.quantidade).toFixed(3));
        const saldoAnterior = insumo.estoqueAtual;
        const saldoPosterior = Number((saldoAnterior - quantidadeConsumida).toFixed(3));
        insumo.estoqueAtual = saldoPosterior;
        novasMovimentacoes.push({
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ingredienteId: insumo.id,
          ingredienteNome: insumo.nome,
          tipo: 'baixa_pedido',
          quantidade: -quantidadeConsumida,
          unidade: insumo.unidade,
          saldoAnterior,
          saldoPosterior,
          dataHora: `Hoje ${agora}`,
          pedidoId: pedido.id,
          motivo: `Baixa automatizada (Ficha Técnica Pedido #${pedido.numeroSequencial} - ${item.quantidade}x ${item.nome})`,
        });
      });
    });
    setInsumos(Array.from(novoMapaInsumos.values()));
    if (novasMovimentacoes.length > 0) setMovimentacoes((prev) => [...novasMovimentacoes, ...prev]);
  };

  const cobrarPedidoBalcao = (
    pedidoId: string,
    metodo: MetodoPagamento
  ): { sucesso: boolean; mensagem: string } => {
    if (!turnoCaixa?.aberto) return { sucesso: false, mensagem: 'Abra o caixa antes de receber pagamentos.' };
    const pedido = pedidos.find((item) => item.id === pedidoId && item.canal === 'balcao');
    if (!pedido || !['pronto', 'entregue'].includes(pedido.status)) {
      return { sucesso: false, mensagem: 'A cobrança do balcão fica disponível quando o pedido estiver pronto.' };
    }
    if (pedido.itens.length === 0) return { sucesso: false, mensagem: 'Adicione ao menos um item antes de cobrar.' };
    const agora = formatCurrentTime();
    baixarEstoqueDoPedido(pedido, agora);
    setTransacoes((prev) => [{
      id: `trans-${Date.now()}`,
      tipo: 'entrada',
      descricao: `Pedido de balcão #${pedido.numeroSequencial} - ${pedido.identificacaoBalcao}`,
      categoria: 'Venda Balcão',
      metodo,
      valor: pedido.total,
      dataHora: agora,
      dataOcorrencia: formatLocalDate(),
      pedidoId: pedido.id,
      origem: 'pedido_fechado',
      turnoId: turnoCaixa.id,
    }, ...prev]);
    setPedidos((prev) => prev.map((item) => item.id === pedidoId
      ? { ...item, status: 'pago', metodoPagamento: metodo, horarioFechamento: agora }
      : item));
    return { sucesso: true, mensagem: `Pedido #${pedido.numeroSequencial} pago com sucesso.` };
  };

  const fecharMesaComPagamento = (
    mesaId: string,
    metodo: MetodoPagamento
  ): { sucesso: boolean; mensagem: string } => {
    if (!turnoCaixa?.aberto) {
      return { sucesso: false, mensagem: 'Abra o caixa antes de receber pagamentos.' };
    }
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa || !mesa.pedidoAtualId) {
      return { sucesso: false, mensagem: 'Nenhum pedido ativo nesta mesa.' };
    }

    const pedido = pedidos.find((p) => p.id === mesa.pedidoAtualId);
    if (!pedido || pedido.itens.length === 0) {
      return { sucesso: false, mensagem: 'Não é possível fechar uma mesa sem itens lançados.' };
    }
    if (!['aberto', 'pronto', 'entregue'].includes(pedido.status)) {
      return { sucesso: false, mensagem: 'Aguarde o pedido ficar pronto antes de fechar a comanda.' };
    }

    const agora = formatCurrentTime();

    // 1. GATILHO DA FICHA TÉCNICA: Baixa automatizada dos ingredientes do pedido.
    baixarEstoqueDoPedido(pedido, agora);

    // 2. GATILHO DE FINANÇAS: Consolida entrada no fluxo de caixa
    const novaTransacao: TransacaoFinanceira = {
      id: `trans-${Date.now()}`,
      tipo: 'entrada',
      descricao: `Pedido #${pedido.numeroSequencial} - Mesa ${mesa.numero.toString().padStart(2, '0')}`,
      categoria: 'Venda Salão',
      metodo,
      valor: pedido.total,
      dataHora: agora,
      dataOcorrencia: formatLocalDate(),
      pedidoId: pedido.id,
      origem: 'pedido_fechado',
      turnoId: turnoCaixa.id,
    };
    setTransacoes((prev) => [novaTransacao, ...prev]);

    // 3. ATUALIZA PEDIDO
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedido.id
          ? {
              ...p,
              status: 'pago',
              metodoPagamento: metodo,
              horarioFechamento: agora,
            }
          : p
      )
    );

    // 4. LIBERA MESA
    setMesas((prev) =>
      prev.map((m) =>
        m.id === mesaId
          ? {
              ...m,
              status: 'livre',
              pedidoAtualId: undefined,
              pessoas: undefined,
              tempoAbertura: undefined,
            }
          : m
      )
    );

    // Confetti effect
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#22c55e', '#16a34a', '#eab308', '#0284c7'],
      });
    } catch {
      // ignore in environments without canvas
    }

    return {
      sucesso: true,
      mensagem: `Pagamento de R$ ${pedido.total.toFixed(2)} registrado via ${metodo}! Mesa ${mesa.numero} liberada e insumos baixados do estoque.`,
    };
  };

  const cancelarPedido = (pedidoId: string, motivo: string) => {
    const pedido = pedidos.find((item) => item.id === pedidoId);
    if (!pedido) return { sucesso: false, mensagem: 'Pedido não encontrado.' };
    if (!motivo.trim()) {
      return { sucesso: false, mensagem: 'Selecione um motivo para cancelar o pedido.' };
    }
    if (pedido.metodoPagamento || pedido.status === 'pago' || pedido.status === 'entregue') {
      return { sucesso: false, mensagem: 'Pedidos pagos ou entregues não podem ser cancelados por aqui.' };
    }
    if (pedido.status === 'cancelado') {
      return { sucesso: false, mensagem: 'Este pedido já foi cancelado.' };
    }

    setPedidos((prev) => prev.map((item) => item.id === pedidoId
      ? {
          ...item,
          status: 'cancelado',
          observacaoGeral: `Pedido cancelado. Motivo: ${motivo.trim()}`,
        }
      : item));

    const mesa = mesas.find((item) => item.pedidoAtualId === pedidoId);
    if (mesa) {
      setMesas((prev) => prev.map((item) => item.id === mesa.id
        ? {
            ...item,
            status: 'livre',
            pedidoAtualId: undefined,
            pessoas: undefined,
            tempoAbertura: undefined,
          }
        : item));
    }

    return { sucesso: true, mensagem: `Pedido #${pedido.numeroSequencial} cancelado. Motivo: ${motivo.trim()}` };
  };

  // --- COZINHA KANBAN ---

  const avancarStatusCozinha = (pedidoId: string) => {
    const agora = formatCurrentTime();
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p;

        if (p.status === 'na_fila') {
          return {
            ...p,
            status: 'em_preparo',
            horarioInicioPreparo: agora,
          };
        }
        if (p.status === 'em_preparo') {
          // Atualiza status da mesa correspondente para 'pronta'
          if (p.mesaId) {
            setMesas((prevM) =>
              prevM.map((m) => (m.id === p.mesaId ? { ...m, status: 'pronta' } : m))
            );
          }
          return {
            ...p,
            status: 'pronto',
            horarioPronto: agora,
          };
        }
        if (p.status === 'pronto') {
          // Confirmar entrega ao salão
          if (p.mesaId) {
            setMesas((prevM) =>
              prevM.map((m) => (m.id === p.mesaId ? { ...m, status: 'ocupada' } : m))
            );
          }
          return {
            ...p,
            status: 'entregue',
            horarioEntrega: agora,
          };
        }
        return p;
      })
    );
  };

  // --- CARDÁPIO & GATILHO DE CRIAÇÃO NO ESTOQUE ---

  const salvarProdutoComFichaTecnica = (produtoData: Omit<Produto, 'id'> & { id?: string }) => {
    const isNovo = !produtoData.id;
    const prodId = produtoData.id || `prod-${Date.now()}`;

    // GATILHO OBRIGATÓRIO DA ESPECIFICAÇÃO:
    // "A inclusão dos ingredientes nesta aba é o gatilho que cria o item correspondente no Estoque.
    // O sistema listará os itens inicialmente com saldo zerado, aguardando a entrada formal de mercadorias pela equipe."
    const novosInsumosParaAdicionar: Insumo[] = [];
    const novoMapaInsumos = new Map<string, Insumo>(insumos.map((i) => [i.id, i]));

    produtoData.fichaTecnica.forEach((itemFt) => {
      // Se o ingredienteId não existir ainda nos insumos, criamos com saldo 0
      if (!novoMapaInsumos.has(itemFt.ingredienteId)) {
        const nomeIngrediente = itemFt.nome || `Novo Insumo (${itemFt.unidade})`;
        const novoInsumo: Insumo = {
          id: itemFt.ingredienteId,
          nome: nomeIngrediente,
          categoria: 'Outros',
          unidade: itemFt.unidade,
          estoqueAtual: 0, // Saldo inicial ZERADO conforme requisito!
          estoqueMinimo: itemFt.unidade === 'kg' ? 2 : itemFt.unidade === 'un' ? 30 : 5,
          custoUnitario: itemFt.custoUnitarioEstimado || 0,
          dataCriacao: new Date().toISOString().split('T')[0],
          origem: 'ficha_tecnica',
        };
        novosInsumosParaAdicionar.push(novoInsumo);
        novoMapaInsumos.set(novoInsumo.id, novoInsumo);
      }
    });

    if (novosInsumosParaAdicionar.length > 0) {
      setInsumos((prev) => [...prev, ...novosInsumosParaAdicionar]);
    }

    const produtoCompleto: Produto = {
      ...produtoData,
      id: prodId,
      codigo: produtoData.codigo || `PAS-${Math.floor(100 + Math.random() * 900)}`,
    };

    setCategoriasProduto((prev) => prev.some((categoria) => categoria.toLocaleLowerCase() === produtoCompleto.categoria.toLocaleLowerCase())
      ? prev
      : [...prev, produtoCompleto.categoria]);

    setProdutos((prev) => {
      if (isNovo) {
        return [produtoCompleto, ...prev];
      }
      return prev.map((p) => (p.id === prodId ? produtoCompleto : p));
    });
  };

  const adicionarCategoriaProduto = (nome: string) => {
    const nomeNormalizado = nome.trim();
    if (!nomeNormalizado || nomeNormalizado.length > 50) {
      return { sucesso: false, mensagem: 'Informe um nome de categoria com até 50 caracteres.' };
    }
    if (categoriasProduto.some((categoria) => categoria.toLocaleLowerCase() === nomeNormalizado.toLocaleLowerCase())) {
      return { sucesso: false, mensagem: 'Essa categoria já está cadastrada.' };
    }

    setCategoriasProduto((prev) => [...prev, nomeNormalizado].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    return { sucesso: true, mensagem: `Categoria "${nomeNormalizado}" cadastrada.` };
  };

  const renomearCategoriaProduto = (nomeAtual: string, novoNome: string) => {
    const nomeNormalizado = novoNome.trim();
    if (!categoriasProduto.includes(nomeAtual)) {
      return { sucesso: false, mensagem: 'Categoria não encontrada.' };
    }
    if (!nomeNormalizado || nomeNormalizado.length > 50) {
      return { sucesso: false, mensagem: 'Informe um nome de categoria com até 50 caracteres.' };
    }
    if (categoriasProduto.some((categoria) =>
      categoria !== nomeAtual && categoria.toLocaleLowerCase() === nomeNormalizado.toLocaleLowerCase()
    )) {
      return { sucesso: false, mensagem: 'Já existe outra categoria com esse nome.' };
    }

    setCategoriasProduto((prev) => prev
      .map((categoria) => categoria === nomeAtual ? nomeNormalizado : categoria)
      .sort((a, b) => a.localeCompare(b, 'pt-BR')));
    setProdutos((prev) => prev.map((produto) => produto.categoria === nomeAtual
      ? { ...produto, categoria: nomeNormalizado }
      : produto));
    return { sucesso: true, mensagem: `Categoria renomeada para "${nomeNormalizado}".` };
  };

  const excluirCategoriaProduto = (nome: string, categoriaSubstituta?: string) => {
    if (!categoriasProduto.includes(nome)) {
      return { sucesso: false, mensagem: 'Categoria não encontrada.' };
    }
    if (categoriasProduto.length <= 1) {
      return { sucesso: false, mensagem: 'Mantenha pelo menos uma categoria cadastrada.' };
    }
    const produtosNaCategoria = produtos.some((produto) => produto.categoria === nome);
    if (produtosNaCategoria && (!categoriaSubstituta || categoriaSubstituta === nome || !categoriasProduto.includes(categoriaSubstituta))) {
      return { sucesso: false, mensagem: 'Escolha uma categoria de destino para os produtos antes de excluir.' };
    }

    if (categoriaSubstituta) {
      setProdutos((prev) => prev.map((produto) => produto.categoria === nome
        ? { ...produto, categoria: categoriaSubstituta }
        : produto));
    }
    setCategoriasProduto((prev) => prev.filter((categoria) => categoria !== nome));
    return {
      sucesso: true,
      mensagem: produtosNaCategoria
        ? `Categoria "${nome}" excluída; os produtos foram movidos para "${categoriaSubstituta}".`
        : `Categoria "${nome}" excluída.`,
    };
  };

  const excluirProduto = (id: string) => {
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  };

  const renomearProduto = (id: string, nome: string) => {
    const produto = produtos.find((item) => item.id === id);
    const nomeNormalizado = nome.trim();
    if (!produto) return { sucesso: false, mensagem: 'Produto não encontrado.' };
    if (!nomeNormalizado || nomeNormalizado.length > 100) {
      return { sucesso: false, mensagem: 'Informe um nome com até 100 caracteres.' };
    }

    setProdutos((prev) => prev.map((item) => item.id === id
      ? { ...item, nome: nomeNormalizado }
      : item));
    return { sucesso: true, mensagem: `Nome do produto atualizado para "${nomeNormalizado}".` };
  };

  const alternarStatusProduto = (id: string) => {
    setProdutos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p))
    );
  };

  // --- ESTOQUE: ENTRADA FORMAL & AJUSTES ---

  const adicionarInsumoDireto = (
    dados: Omit<Insumo, 'id' | 'dataCriacao' | 'origem'>
  ): string => {
    const id = `ins-${Date.now()}`;
    const novo: Insumo = {
      ...dados,
      id,
      dataCriacao: new Date().toISOString().split('T')[0],
      origem: 'cadastro_manual',
    };
    setInsumos((prev) => [...prev, novo]);
    if (novo.fornecedorPadrao?.trim()) {
      const fornecedor = novo.fornecedorPadrao.trim();
      setFornecedores((prev) => prev.some((item) => item.toLocaleLowerCase() === fornecedor.toLocaleLowerCase())
        ? prev
        : [...prev, fornecedor]);
    }
    if (novo.estoqueAtual > 0) {
      const agora = formatCurrentTime();
      setMovimentacoes((prev) => [{
        id: `mov-${Date.now()}`,
        ingredienteId: novo.id,
        ingredienteNome: novo.nome,
        tipo: 'ajuste_manual',
        quantidade: novo.estoqueAtual,
        unidade: novo.unidade,
        saldoAnterior: 0,
        saldoPosterior: novo.estoqueAtual,
        dataHora: `Hoje ${agora}`,
        motivo: 'Saldo inicial informado no cadastro do insumo',
      }, ...prev]);
    }
    return id;
  };

  const atualizarInsumo = (
    id: string,
    dados: Pick<Insumo, 'nome' | 'categoria' | 'unidade' | 'estoqueMinimo' | 'custoUnitario'> & { fornecedorPadrao: string }
  ) => {
    const insumo = insumos.find((item) => item.id === id);
    if (!insumo) return { sucesso: false, mensagem: 'Insumo não encontrado.' };

    const nomeNormalizado = dados.nome.trim();
    if (!nomeNormalizado || nomeNormalizado.length > 100) {
      return { sucesso: false, mensagem: 'Informe um nome com até 100 caracteres.' };
    }
    if (
      !Number.isFinite(dados.estoqueMinimo) ||
      dados.estoqueMinimo < 0 ||
      !Number.isFinite(dados.custoUnitario) ||
      dados.custoUnitario < 0
    ) {
      return { sucesso: false, mensagem: 'Estoque mínimo e custo devem ser números iguais ou maiores que zero.' };
    }

    const unidadeEmUso = insumo.estoqueAtual !== 0 ||
      movimentacoes.some((movimento) => movimento.ingredienteId === id) ||
      produtos.some((produto) => produto.fichaTecnica.some((item) => item.ingredienteId === id));
    if (dados.unidade !== insumo.unidade && unidadeEmUso) {
      return {
        sucesso: false,
        mensagem: 'Não é possível alterar a unidade após o uso do insumo. Cadastre outro insumo para manter o histórico e as fichas técnicas corretos.',
      };
    }

    setInsumos((prev) => prev.map((item) => item.id === id
      ? { ...item, ...dados, nome: nomeNormalizado, fornecedorPadrao: dados.fornecedorPadrao.trim() }
      : item));
    if (dados.fornecedorPadrao.trim()) {
      const fornecedor = dados.fornecedorPadrao.trim();
      setFornecedores((prev) => prev.some((item) => item.toLocaleLowerCase() === fornecedor.toLocaleLowerCase())
        ? prev
        : [...prev, fornecedor]);
    }
    setProdutos((prev) => prev.map((produto) => ({
      ...produto,
      fichaTecnica: produto.fichaTecnica.map((item) => item.ingredienteId === id
        ? {
            ...item,
            nome: nomeNormalizado,
            unidade: dados.unidade,
            custoUnitarioEstimado: dados.custoUnitario,
          }
        : item),
    })));

    return { sucesso: true, mensagem: `Dados de "${nomeNormalizado}" atualizados com sucesso.` };
  };

  const adicionarFornecedor = (nome: string) => {
    const nomeNormalizado = nome.trim();
    if (!nomeNormalizado || nomeNormalizado.length > 100) {
      return { sucesso: false, mensagem: 'Informe o nome do fornecedor com até 100 caracteres.' };
    }
    if (fornecedores.some((fornecedor) => fornecedor.toLocaleLowerCase() === nomeNormalizado.toLocaleLowerCase())) {
      return { sucesso: false, mensagem: 'Esse fornecedor já está cadastrado.' };
    }

    setFornecedores((prev) => [...prev, nomeNormalizado].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    return { sucesso: true, mensagem: `Fornecedor "${nomeNormalizado}" cadastrado.` };
  };

  const renomearFornecedor = (nomeAtual: string, novoNome: string) => {
    const nomeNormalizado = novoNome.trim();
    if (!fornecedores.includes(nomeAtual)) {
      return { sucesso: false, mensagem: 'Fornecedor não encontrado.' };
    }
    if (!nomeNormalizado || nomeNormalizado.length > 100) {
      return { sucesso: false, mensagem: 'Informe o nome do fornecedor com até 100 caracteres.' };
    }
    if (fornecedores.some((fornecedor) =>
      fornecedor !== nomeAtual && fornecedor.toLocaleLowerCase() === nomeNormalizado.toLocaleLowerCase()
    )) {
      return { sucesso: false, mensagem: 'Já existe outro fornecedor com esse nome.' };
    }

    setFornecedores((prev) => prev
      .map((fornecedor) => fornecedor === nomeAtual ? nomeNormalizado : fornecedor)
      .sort((a, b) => a.localeCompare(b, 'pt-BR')));
    setInsumos((prev) => prev.map((insumo) => insumo.fornecedorPadrao === nomeAtual
      ? { ...insumo, fornecedorPadrao: nomeNormalizado }
      : insumo));
    return { sucesso: true, mensagem: `Fornecedor renomeado para "${nomeNormalizado}".` };
  };

  const excluirFornecedor = (nome: string) => {
    if (!fornecedores.includes(nome)) {
      return { sucesso: false, mensagem: 'Fornecedor não encontrado.' };
    }

    const insumosVinculados = insumos.filter((insumo) => insumo.fornecedorPadrao === nome).length;
    setFornecedores((prev) => prev.filter((fornecedor) => fornecedor !== nome));
    setInsumos((prev) => prev.map((insumo) => insumo.fornecedorPadrao === nome
      ? { ...insumo, fornecedorPadrao: undefined }
      : insumo));
    return {
      sucesso: true,
      mensagem: insumosVinculados > 0
        ? `Fornecedor "${nome}" excluído e removido do cadastro de ${insumosVinculados} insumo(s).`
        : `Fornecedor "${nome}" excluído.`,
    };
  };

  const renomearInsumo = (id: string, nome: string) => {
    const insumo = insumos.find((item) => item.id === id);
    const nomeNormalizado = nome.trim();
    if (!insumo) return { sucesso: false, mensagem: 'Insumo não encontrado.' };
    if (!nomeNormalizado || nomeNormalizado.length > 100) {
      return { sucesso: false, mensagem: 'Informe um nome com até 100 caracteres.' };
    }

    setInsumos((prev) => prev.map((item) => item.id === id
      ? { ...item, nome: nomeNormalizado }
      : item));
    setProdutos((prev) => prev.map((produto) => ({
      ...produto,
      fichaTecnica: produto.fichaTecnica.map((item) => (
        item.ingredienteId === id ? { ...item, nome: nomeNormalizado } : item
      )),
    })));
    return { sucesso: true, mensagem: `Nome do insumo atualizado para "${nomeNormalizado}".` };
  };

  const excluirInsumo = (id: string, motivo: string) => {
    const insumo = insumos.find((item) => item.id === id);
    if (!insumo) return { sucesso: false, mensagem: 'Insumo não encontrado.' };
    if (!motivo.trim()) {
      return { sucesso: false, mensagem: 'Selecione um motivo para excluir o insumo.' };
    }

    const quantidadeAjuste = Number((-insumo.estoqueAtual).toFixed(3));
    if (quantidadeAjuste !== 0) {
      const agora = formatCurrentTime();
      const movimento: MovimentacaoEstoque = {
        id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ingredienteId: insumo.id,
        ingredienteNome: insumo.nome,
        tipo: quantidadeAjuste < 0 ? 'perda_descarte' : 'ajuste_manual',
        quantidade: quantidadeAjuste,
        unidade: insumo.unidade,
        saldoAnterior: insumo.estoqueAtual,
        saldoPosterior: 0,
        dataHora: `Hoje ${agora}`,
        motivo: `Regularização do saldo pela exclusão do insumo: ${motivo.trim()}`,
      };
      setMovimentacoes((prev) => [movimento, ...prev]);
    }

    setProdutos((prev) => prev.map((produto) => ({
      ...produto,
      fichaTecnica: produto.fichaTecnica.filter((item) => item.ingredienteId !== id),
    })));
    setInsumos((prev) => prev.filter((item) => item.id !== id));
    return { sucesso: true, mensagem: `${insumo.nome} foi excluído. Motivo: ${motivo.trim()}` };
  };

  const registrarEntradaMercadoria = (dados: {
    ingredienteId: string;
    quantidade: number;
    custoUnitario: number;
    fornecedor?: string;
    notaFiscal?: string;
    gerarSaidaCaixa: boolean;
    metodoPagamento?: MetodoPagamento;
    dataCompra: string;
  }) => {
    const insumo = insumos.find((i) => i.id === dados.ingredienteId);
    if (!insumo) return;
    if (dados.fornecedor?.trim()) {
      const fornecedor = dados.fornecedor.trim();
      setFornecedores((prev) => prev.some((item) => item.toLocaleLowerCase() === fornecedor.toLocaleLowerCase())
        ? prev
        : [...prev, fornecedor]);
    }

    const agora = formatCurrentTime();
    const saldoAnterior = insumo.estoqueAtual;
    const saldoPosterior = Number((saldoAnterior + dados.quantidade).toFixed(3));
    const custoTotal = Number((dados.quantidade * dados.custoUnitario).toFixed(2));

    // Atualiza saldo e custo médio
    setInsumos((prev) =>
      prev.map((i) => {
        if (i.id !== dados.ingredienteId) return i;
        return {
          ...i,
          estoqueAtual: saldoPosterior,
          custoUnitario: dados.custoUnitario,
          fornecedorPadrao: dados.fornecedor || i.fornecedorPadrao,
        };
      })
    );

    // Log de movimentação de estoque
    const mov: MovimentacaoEstoque = {
      id: `mov-${Date.now()}`,
      ingredienteId: insumo.id,
      ingredienteNome: insumo.nome,
      tipo: 'entrada_compra',
      quantidade: dados.quantidade,
      unidade: insumo.unidade,
      saldoAnterior,
      saldoPosterior,
      dataHora: `Hoje ${agora}`,
      dataOcorrencia: dados.dataCompra,
      motivo: `Entrada formal de mercadorias ${dados.notaFiscal ? `(NF: ${dados.notaFiscal})` : ''} - Fornecedor: ${dados.fornecedor || 'Geral'}`,
      custoTotal,
    };
    setMovimentacoes((prev) => [mov, ...prev]);

    // Opcionalmente gera saída no Fluxo de Caixa das Finanças
    if (dados.gerarSaidaCaixa && custoTotal > 0) {
      const transacao: TransacaoFinanceira = {
        id: `trans-${Date.now()}`,
        tipo: 'saida',
        descricao: `Compra de Insumo: ${insumo.nome} (${dados.quantidade} ${insumo.unidade}) ${dados.fornecedor ? `- ${dados.fornecedor}` : ''}`,
        categoria: 'Insumos & Mercadorias',
        metodo: dados.metodoPagamento || 'Pix',
        valor: custoTotal,
        dataHora: agora,
        dataOcorrencia: dados.dataCompra,
        origem: 'entrada_mercadoria',
        turnoId: turnoCaixa?.aberto ? turnoCaixa.id : undefined,
      };
      setTransacoes((prev) => [transacao, ...prev]);
    }
  };

  const ajustarEstoqueManual = (dados: {
    ingredienteId: string;
    novoEstoque: number;
    motivo: string;
  }) => {
    const insumo = insumos.find((i) => i.id === dados.ingredienteId);
    if (!insumo) return;

    const agora = formatCurrentTime();
    const saldoAnterior = insumo.estoqueAtual;
    const delta = Number((dados.novoEstoque - saldoAnterior).toFixed(3));
    const saldoPosterior = dados.novoEstoque;

    setInsumos((prev) =>
      prev.map((i) => (i.id === dados.ingredienteId ? { ...i, estoqueAtual: saldoPosterior } : i))
    );

    const mov: MovimentacaoEstoque = {
      id: `mov-${Date.now()}`,
      ingredienteId: insumo.id,
      ingredienteNome: insumo.nome,
      tipo: delta < 0 ? 'perda_descarte' : 'ajuste_manual',
      quantidade: delta,
      unidade: insumo.unidade,
      saldoAnterior,
      saldoPosterior,
      dataHora: `Hoje ${agora}`,
      motivo: `Ajuste manual de estoque: ${dados.motivo}`,
    };
    setMovimentacoes((prev) => [mov, ...prev]);
  };

  // --- FINANÇAS ---

  const adicionarDespesaManual = (dados: {
    descricao: string;
    categoria: string;
    metodo: MetodoPagamento | 'Transferência' | 'Boleto';
    valor: number;
    dataOcorrencia: string;
  }) => {
    const agora = formatCurrentTime();
    const nova: TransacaoFinanceira = {
      id: `trans-${Date.now()}`,
      tipo: 'saida',
      descricao: dados.descricao,
      categoria: dados.categoria,
      metodo: dados.metodo,
      valor: dados.valor,
      dataHora: agora,
      dataOcorrencia: dados.dataOcorrencia,
      origem: 'despesa_manual',
      turnoId: turnoCaixa?.aberto ? turnoCaixa.id : undefined,
    };
    setTransacoes((prev) => [nova, ...prev]);
  };

  const excluirTransacaoFinanceira = (id: string) => {
    setTransacoes((prev) => prev.filter((transacao) =>
      transacao.id !== id ||
      transacao.origem === 'abertura_caixa' ||
      transacao.origem === 'suprimento' ||
      transacao.origem === 'sangria'
    ));
  };

  const exportarExtratoCSV = (transacoesExportacao: TransacaoFinanceira[], periodo: string) => {
    const entradas = transacoesExportacao
      .filter((transacao) => transacao.tipo === 'entrada')
      .reduce((total, transacao) => total + transacao.valor, 0);
    const saidas = transacoesExportacao
      .filter((transacao) => transacao.tipo === 'saida')
      .reduce((total, transacao) => total + transacao.valor, 0);
    const escaparTextoCSV = (valor: string | number) => {
      const texto = String(valor);
      const seguro = /^[\s]*[=+\-@]/.test(texto) ? `'${texto}` : texto;
      return `"${seguro.replace(/"/g, '""')}"`;
    };
    const formatarValorCSV = (valor: number) => valor.toFixed(2).replace('.', ',');
    const linhas: (string | number)[][] = [
      ['Relatório financeiro', periodo],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      ['Lançamentos', transacoesExportacao.length],
      ['Total de entradas (R$)', formatarValorCSV(entradas)],
      ['Total de saídas (R$)', formatarValorCSV(saidas)],
      ['Saldo do período (R$)', formatarValorCSV(entradas - saidas)],
      [],
      ['Data da ocorrência', 'Data/Hora do registro', 'Tipo', 'Descrição', 'Categoria', 'Método', 'Valor (R$)'],
      ...transacoesExportacao.map((transacao) => [
        transacao.dataOcorrencia || transacao.dataHora.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '',
        transacao.dataHora,
        transacao.tipo === 'entrada' ? 'Entrada' : 'Saída',
        transacao.descricao,
        transacao.categoria,
        transacao.metodo,
        formatarValorCSV(transacao.valor),
      ]),
    ];
    const csvContent = `\uFEFF${linhas
      .map((linha) => linha.map(escaparTextoCSV).join(';'))
      .join('\r\n')}`;
    const arquivo = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extrato_financeiro_pastelaria_${formatLocalDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppContext.Provider
      value={{
        dataSyncReady,
        dataSyncError,
        moduloAtivo,
        setModuloAtivo,
        canalAtendimento,
        setCanalAtendimento,
        pedidoBalcaoSelecionadoId,
        setPedidoBalcaoSelecionadoId,
        mesaSelecionadaId,
        setMesaSelecionadaId,
        insumos,
        fornecedores,
        categoriasProduto,
        produtos,
        mesas,
        pedidos,
        movimentacoes,
        transacoes,
        turnoCaixa,
        valorEsperadoGaveta,
        abrirCaixa,
        fecharCaixa,
        registrarMovimentacaoCaixa,
        criarPedidoBalcao,
        cobrarPedidoBalcao,
        atualizarIdentificacaoPedidoBalcao,
        abrirMesa,
        adicionarMesa,
        excluirMesa,
        cancelarPedido,
        adicionarItemAoPedido,
        removerItemDoPedido,
        atualizarQuantidadeItemPedido,
        atualizarObservacaoItem,
        toggleTaxaServico,
        enviarPedidoParaCozinha,
        fecharMesaComPagamento,
        avancarStatusCozinha,
        salvarProdutoComFichaTecnica,
        adicionarCategoriaProduto,
        renomearCategoriaProduto,
        excluirCategoriaProduto,
        renomearProduto,
        excluirProduto,
        alternarStatusProduto,
        adicionarInsumoDireto,
        atualizarInsumo,
        adicionarFornecedor,
        renomearFornecedor,
        excluirFornecedor,
        renomearInsumo,
        excluirInsumo,
        registrarEntradaMercadoria,
        ajustarEstoqueManual,
        adicionarDespesaManual,
        excluirTransacaoFinanceira,
        exportarExtratoCSV,
        atualizarPessoasMesa,
        currentTimeString,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
