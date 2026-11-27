import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Insumo, MetodoPagamento, CategoriaInsumo, UnidadeMedida } from '../../types';
import {
  Package,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  TrendingDown,
  ShoppingCart,
  SlidersHorizontal,
  CheckCircle2,
  FileSpreadsheet,
  Trash2,
  Pencil,
} from 'lucide-react';
import { ConfirmDeleteDialog } from '../common/ConfirmDeleteDialog';

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const EstoqueView: React.FC = () => {
  const {
    insumos,
    fornecedores,
    produtos,
    movimentacoes,
    pedidos,
    registrarEntradaMercadoria,
    ajustarEstoqueManual,
    adicionarInsumoDireto,
    atualizarInsumo,
    adicionarFornecedor,
    renomearFornecedor,
    excluirFornecedor,
    excluirInsumo,
  } = useApp();

  const [abaAtiva, setAbaAtiva] = useState<'insumos' | 'previsao' | 'historico'>('insumos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [busca, setBusca] = useState('');

  // Modais
  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [insumoSelecionadoParaEntrada, setInsumoSelecionadoParaEntrada] = useState<Insumo | null>(null);

  const [modalAjusteAberto, setModalAjusteAberto] = useState(false);
  const [insumoSelecionadoParaAjuste, setInsumoSelecionadoParaAjuste] = useState<Insumo | null>(null);

  const [modalNovoInsumoAberto, setModalNovoInsumoAberto] = useState(false);
  const [insumoParaExcluir, setInsumoParaExcluir] = useState<Insumo | null>(null);
  const [insumoParaEditar, setInsumoParaEditar] = useState<Insumo | null>(null);
  const [erroSalvarInsumo, setErroSalvarInsumo] = useState<string | null>(null);
  const [erroExclusaoInsumo, setErroExclusaoInsumo] = useState<string | null>(null);
  const [mensagemExclusaoInsumo, setMensagemExclusaoInsumo] = useState<string | null>(null);
  const [mostrarGerenciadorFornecedores, setMostrarGerenciadorFornecedores] = useState(false);
  const [origemGerenciadorFornecedor, setOrigemGerenciadorFornecedor] = useState<'novo' | 'entrada' | 'edicao'>('novo');
  const [novoFornecedorNome, setNovoFornecedorNome] = useState('');
  const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState<string | null>(null);
  const [nomeFornecedorEditando, setNomeFornecedorEditando] = useState('');
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<string | null>(null);
  const [erroFornecedores, setErroFornecedores] = useState<string | null>(null);
  const [mensagemFornecedores, setMensagemFornecedores] = useState<string | null>(null);
  const [dadosEdicaoInsumo, setDadosEdicaoInsumo] = useState({
    nome: '',
    categoria: 'Outros' as CategoriaInsumo,
    unidade: 'kg' as UnidadeMedida,
    estoqueMinimo: '',
    custoUnitario: '',
    fornecedorPadrao: '',
  });

  // Form states para Entrada
  const [qtdEntrada, setQtdEntrada] = useState('');
  const [custoEntrada, setCustoEntrada] = useState('');
  const [fornecedorEntrada, setFornecedorEntrada] = useState('');
  const [nfEntrada, setNfEntrada] = useState('');
  const [dataCompra, setDataCompra] = useState(getLocalDate);
  const [gerarSaidaCaixa, setGerarSaidaCaixa] = useState(true);
  const [metodoPagamentoEntrada, setMetodoPagamentoEntrada] = useState<MetodoPagamento>('Pix');

  // Form states para Ajuste
  const [novoSaldoAjuste, setNovoSaldoAjuste] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('Conferência de Inventário Físico');

  // Form states para Novo Insumo Manual
  const [novoNome, setNovoNome] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<CategoriaInsumo>('Carnes & Proteínas');
  const [novaUnidade, setNovaUnidade] = useState<UnidadeMedida>('kg');
  const [novoEstoqueAtual, setNovoEstoqueAtual] = useState('0');
  const [novoEstoqueMin, setNovoEstoqueMin] = useState('5');
  const [novoCusto, setNovoCusto] = useState('10.00');
  const [novoFornecedor, setNovoFornecedor] = useState('');

  const categorias = [
    'Todas',
    'Carnes & Proteínas',
    'Queijos & Laticínios',
    'Massas & Farinhas',
    'Hortifruti & Recheios',
    'Doces & Confeitaria',
    'Óleos & Fritura',
    'Bebidas',
    'Embalagens & Descartáveis',
    'Outros',
  ];

  const insumosFiltrados = insumos.filter((i) => {
    const matchBusca = i.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = filtroCategoria === 'Todas' || i.categoria === filtroCategoria;
    return matchBusca && matchCat;
  });

  const totalValorEmEstoque = insumos.reduce(
    (acc, i) => acc + Math.max(0, i.estoqueAtual) * i.custoUnitario,
    0
  );

  const totalItensZerados = insumos.filter((i) => i.estoqueAtual <= 0).length;
  const totalItensAlerta = insumos.filter(
    (i) => i.estoqueAtual > 0 && i.estoqueAtual <= i.estoqueMinimo
  ).length;
  const produtosComInsumoSelecionado = insumoParaExcluir
    ? produtos.filter((produto) => produto.fichaTecnica.some(
        (item) => item.ingredienteId === insumoParaExcluir.id
      ))
    : [];
  const unidadeInsumoBloqueada = insumoParaEditar && (
    insumoParaEditar.estoqueAtual !== 0 ||
    movimentacoes.some((movimento) => movimento.ingredienteId === insumoParaEditar.id) ||
    produtos.some((produto) => produto.fichaTecnica.some((item) => item.ingredienteId === insumoParaEditar.id))
  );

  const handleConfirmarExclusaoInsumo = (motivo: string) => {
    if (!insumoParaExcluir) return;
    const resultado = excluirInsumo(insumoParaExcluir.id, motivo);
    if (!resultado.sucesso) {
      setErroExclusaoInsumo(resultado.mensagem);
      return;
    }

    setMensagemExclusaoInsumo(resultado.mensagem);
    setErroExclusaoInsumo(null);
    setInsumoParaExcluir(null);
  };

  const handleSalvarEdicaoInsumo = (event: React.FormEvent) => {
    event.preventDefault();
    if (!insumoParaEditar) return;
    const resultado = atualizarInsumo(insumoParaEditar.id, {
      ...dadosEdicaoInsumo,
      estoqueMinimo: Number(dadosEdicaoInsumo.estoqueMinimo),
      custoUnitario: Number(dadosEdicaoInsumo.custoUnitario),
    });
    if (!resultado.sucesso) {
      setErroSalvarInsumo(resultado.mensagem);
      return;
    }

    setMensagemExclusaoInsumo(resultado.mensagem);
    setErroSalvarInsumo(null);
    setInsumoParaEditar(null);
  };

  const abrirGerenciadorFornecedores = (origem: 'novo' | 'entrada' | 'edicao') => {
    setOrigemGerenciadorFornecedor(origem);
    setErroFornecedores(null);
    setMensagemFornecedores(null);
    setMostrarGerenciadorFornecedores(true);
  };

  const selecionarFornecedorNoFormulario = (fornecedor: string) => {
    if (origemGerenciadorFornecedor === 'entrada') setFornecedorEntrada(fornecedor);
    if (origemGerenciadorFornecedor === 'edicao') {
      setDadosEdicaoInsumo((dados) => ({ ...dados, fornecedorPadrao: fornecedor }));
    }
    if (origemGerenciadorFornecedor === 'novo') setNovoFornecedor(fornecedor);
  };

  const handleAdicionarFornecedor = (event: React.FormEvent) => {
    event.preventDefault();
    const nome = novoFornecedorNome.trim();
    const resultado = adicionarFornecedor(nome);
    if (!resultado.sucesso) {
      setErroFornecedores(resultado.mensagem);
      setMensagemFornecedores(null);
      return;
    }

    selecionarFornecedorNoFormulario(nome);
    setNovoFornecedorNome('');
    setErroFornecedores(null);
    setMensagemFornecedores(resultado.mensagem);
  };

  const handleSalvarNomeFornecedor = (nomeAtual: string) => {
    const nomeNovo = nomeFornecedorEditando.trim();
    const resultado = renomearFornecedor(nomeAtual, nomeNovo);
    if (!resultado.sucesso) {
      setErroFornecedores(resultado.mensagem);
      setMensagemFornecedores(null);
      return;
    }

    if (fornecedorEntrada === nomeAtual) setFornecedorEntrada(nomeNovo);
    if (novoFornecedor === nomeAtual) setNovoFornecedor(nomeNovo);
    if (dadosEdicaoInsumo.fornecedorPadrao === nomeAtual) {
      setDadosEdicaoInsumo((dados) => ({ ...dados, fornecedorPadrao: nomeNovo }));
    }
    setFornecedorEmEdicao(null);
    setErroFornecedores(null);
    setMensagemFornecedores(resultado.mensagem);
  };

  const handleExcluirFornecedor = (nome: string) => {
    const resultado = excluirFornecedor(nome);
    if (!resultado.sucesso) {
      setErroFornecedores(resultado.mensagem);
      setMensagemFornecedores(null);
      return;
    }

    if (fornecedorEntrada === nome) setFornecedorEntrada('');
    if (novoFornecedor === nome) setNovoFornecedor('');
    if (dadosEdicaoInsumo.fornecedorPadrao === nome) {
      setDadosEdicaoInsumo((dados) => ({ ...dados, fornecedorPadrao: '' }));
    }
    setFornecedorParaExcluir(null);
    setErroFornecedores(null);
    setMensagemFornecedores(resultado.mensagem);
  };

  // Previsão de compras: cálculo com base nas baixas automatizadas dos pedidos
  const previsaoCompras = insumos.map((insumo) => {
    // Procura consumo nas movimentações de pedidos
    const baixasDoInsumo = movimentacoes.filter(
      (m) => m.ingredienteId === insumo.id && m.tipo === 'baixa_pedido'
    );
    const totalConsumidoHistorico = baixasDoInsumo.reduce(
      (acc, m) => acc + Math.abs(m.quantidade),
      0
    );

    // Estimativa diária (usando consumo registrado ou base estimada se novo)
    const consumoDiarioEstimado = totalConsumidoHistorico > 0 ? totalConsumidoHistorico * 1.5 : (insumo.estoqueMinimo / 4);
    const diasAutonomia = consumoDiarioEstimado > 0 ? Math.floor(insumo.estoqueAtual / consumoDiarioEstimado) : 99;
    const sugestaoCompra7Dias = Math.max(
      0,
      Number(((consumoDiarioEstimado * 7) - insumo.estoqueAtual).toFixed(2))
    );

    return {
      insumo,
      consumoDiarioEstimado,
      diasAutonomia: diasAutonomia < 0 ? 0 : diasAutonomia,
      sugestaoCompra7Dias,
      custoEstimadoReposicao: Number((sugestaoCompra7Dias * insumo.custoUnitario).toFixed(2)),
    };
  });

  const handleSubmeterEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoSelecionadoParaEntrada) return;
    const qtd = parseFloat(qtdEntrada);
    const custo = parseFloat(custoEntrada);
    if (isNaN(qtd) || qtd <= 0) return;

    registrarEntradaMercadoria({
      ingredienteId: insumoSelecionadoParaEntrada.id,
      quantidade: qtd,
      custoUnitario: isNaN(custo) ? insumoSelecionadoParaEntrada.custoUnitario : custo,
      fornecedor: fornecedorEntrada,
      notaFiscal: nfEntrada,
      dataCompra,
      gerarSaidaCaixa,
      metodoPagamento: metodoPagamentoEntrada,
    });

    setModalEntradaAberto(false);
    setInsumoSelecionadoParaEntrada(null);
    setQtdEntrada('');
    setCustoEntrada('');
    setFornecedorEntrada('');
    setNfEntrada('');
    setDataCompra(getLocalDate());
  };

  const handleSubmeterAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoSelecionadoParaAjuste) return;
    const saldo = parseFloat(novoSaldoAjuste);
    if (isNaN(saldo) || saldo < 0) return;

    ajustarEstoqueManual({
      ingredienteId: insumoSelecionadoParaAjuste.id,
      novoEstoque: saldo,
      motivo: motivoAjuste,
    });

    setModalAjusteAberto(false);
    setInsumoSelecionadoParaAjuste(null);
    setNovoSaldoAjuste('');
  };

  const handleCriarNovoInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    const saldoInicial = Number(novoEstoqueAtual);
    const estoqueMinimo = Number(novoEstoqueMin);
    const custoUnitario = Number(novoCusto);
    if (
      !novoNome.trim() ||
      !Number.isFinite(saldoInicial) ||
      saldoInicial < 0 ||
      !Number.isFinite(estoqueMinimo) ||
      estoqueMinimo < 0 ||
      !Number.isFinite(custoUnitario) ||
      custoUnitario < 0
    ) return;

    adicionarInsumoDireto({
      nome: novoNome.trim(),
      categoria: novaCategoria,
      unidade: novaUnidade,
      estoqueAtual: saldoInicial,
      estoqueMinimo,
      custoUnitario,
      fornecedorPadrao: novoFornecedor.trim(),
    });

    setModalNovoInsumoAberto(false);
    setNovoNome('');
    setNovoEstoqueAtual('0');
    setNovoEstoqueMin('5');
    setNovoCusto('10.00');
    setNovoFornecedor('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 pb-20 md:pb-6 bg-stone-50/60 overflow-y-auto">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Controle de Estoque & Insumos
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 font-mono font-medium">
              {insumos.length} insumos
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Consulte e mantenha os insumos cadastrados, com saldo e alertas atualizados.
          </p>
        </div>

        {/* Banners Resumo e Botão Nova Entrada */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded-xl border border-stone-200 text-xs">
            <div>
              <span className="text-stone-500 block text-[11px]">Valor em estoque:</span>
              <strong className="font-bold text-stone-900 font-mono tabular-nums">
                R$ {totalValorEmEstoque.toFixed(2)}
              </strong>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div>
              <span className="text-stone-500 block text-[11px]">Atenção / Zerado:</span>
              <strong className="font-bold text-red-600 font-mono tabular-nums">
                {totalItensZerados + totalItensAlerta} itens
              </strong>
            </div>
          </div>
          <button
            onClick={() => setModalNovoInsumoAberto(true)}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>
      {mensagemExclusaoInsumo && (
        <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {mensagemExclusaoInsumo}
        </p>
      )}

      {/* ABAS DO MÓDULO DE ESTOQUE */}
      <div className="flex items-center justify-between border-b border-stone-200 mb-5 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAbaAtiva('insumos')}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-1.5 transition-all flex items-center gap-1.5 ${
              abaAtiva === 'insumos'
                ? 'border-emerald-800 text-emerald-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Painel de Insumos</span>
          </button>

          <button
            onClick={() => setAbaAtiva('previsao')}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-1.5 transition-all flex items-center gap-1.5 ${
              abaAtiva === 'previsao'
                ? 'border-emerald-800 text-emerald-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Previsão de Compras (Consumo Real)</span>
          </button>

          <button
            onClick={() => setAbaAtiva('historico')}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-1.5 transition-all flex items-center gap-1.5 ${
              abaAtiva === 'historico'
                ? 'border-emerald-800 text-emerald-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de Movimentações</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: PAINEL DE INSUMOS */}
      {abaAtiva === 'insumos' && (
        <div className="space-y-4">
          {/* Barra de Filtro e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    filtroCategoria === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Filtrar por nome de ingrediente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-emerald-700 w-full sm:w-60"
            />
          </div>

          {/* Tabela de Insumos */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-semibold">Insumo / Origem</th>
                    <th className="py-3 px-4 font-semibold">Categoria</th>
                    <th className="py-3 px-4 font-semibold text-right">Saldo Atual</th>
                    <th className="py-3 px-4 font-semibold text-right">Estoque Mínimo</th>
                    <th className="py-3 px-4 font-semibold text-right">Custo Médio</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Estocado</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {insumosFiltrados.map((insumo) => {
                    const isZerado = insumo.estoqueAtual <= 0;
                    const isBaixo = insumo.estoqueAtual > 0 && insumo.estoqueAtual <= insumo.estoqueMinimo;

                    return (
                      <tr key={insumo.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-stone-900">{insumo.nome}</span>
                            <button
                              type="button"
                              aria-label={`Editar cadastro do insumo ${insumo.nome}`}
                              title={`Editar cadastro de ${insumo.nome}`}
                              onClick={() => {
                                setErroSalvarInsumo(null);
                                setMensagemExclusaoInsumo(null);
                                setDadosEdicaoInsumo({
                                  nome: insumo.nome,
                                  categoria: insumo.categoria,
                                  unidade: insumo.unidade,
                                  estoqueMinimo: String(insumo.estoqueMinimo),
                                  custoUnitario: String(insumo.custoUnitario),
                                  fornecedorPadrao: insumo.fornecedorPadrao || '',
                                });
                                setInsumoParaEditar(insumo);
                              }}
                              className="rounded p-1 text-stone-400 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {insumo.origem === 'ficha_tecnica' ? (
                              <span className="text-emerald-700">Gatilho: Ficha Técnica</span>
                            ) : (
                              <span>Cadastro Manual</span>
                            )}
                            {insumo.fornecedorPadrao && ` · ${insumo.fornecedorPadrao}`}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-stone-600">{insumo.categoria}</td>

                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          <span
                            className={
                              isZerado
                                ? 'text-red-700 font-bold'
                                : isBaixo
                                ? 'text-amber-700 font-semibold'
                                : 'text-stone-900'
                            }
                          >
                            {insumo.estoqueAtual.toFixed(3)} {insumo.unidade}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-stone-500 tabular-nums">
                          {insumo.estoqueMinimo.toFixed(3)} {insumo.unidade}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-stone-800 tabular-nums">
                          R$ {insumo.custoUnitario.toFixed(2)} /{insumo.unidade}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold text-stone-900 tabular-nums">
                          R$ {(Math.max(0, insumo.estoqueAtual) * insumo.custoUnitario).toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isZerado ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">
                              Aguardando Entrada
                            </span>
                          ) : isBaixo ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Estoque Baixo
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Normal
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setInsumoSelecionadoParaEntrada(insumo);
                              setCustoEntrada(insumo.custoUnitario.toString());
                              setFornecedorEntrada(insumo.fornecedorPadrao || '');
                              setDataCompra(getLocalDate());
                              setModalEntradaAberto(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded font-medium text-xs transition-colors"
                          >
                            + Entrada NF
                          </button>

                          <button
                            onClick={() => {
                              setInsumoSelecionadoParaAjuste(insumo);
                              setNovoSaldoAjuste(insumo.estoqueAtual.toString());
                              setModalAjusteAberto(true);
                            }}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-medium text-xs transition-colors"
                          >
                            Ajustar
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir insumo ${insumo.nome}`}
                            title={`Excluir ${insumo.nome}`}
                            onClick={() => {
                              setMensagemExclusaoInsumo(null);
                              setErroExclusaoInsumo(null);
                              setInsumoParaExcluir(insumo);
                            }}
                            className="rounded p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: PREVISÃO DE COMPRAS (CONSUMO REAL) */}
      {abaAtiva === 'previsao' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 text-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Planejamento de Compras Inteligente
            </h3>
            <p className="text-stone-500">
              Cálculo baseado no consumo real das Fichas Técnicas a cada pedido finalizado no salão. A previsão calcula a necessidade de reposição para garantir 7 dias de giro seguro.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-semibold">Insumo</th>
                    <th className="py-3 px-4 font-semibold text-right">Saldo Atual</th>
                    <th className="py-3 px-4 font-semibold text-right">Consumo Diário Estimado</th>
                    <th className="py-3 px-4 font-semibold text-right">Autonomia</th>
                    <th className="py-3 px-4 font-semibold text-right">Sugestão de Compra (7 dias)</th>
                    <th className="py-3 px-4 font-semibold text-right">Custo Estimado</th>
                    <th className="py-3 px-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {previsaoCompras.map((item) => {
                    const precisaComprar = item.sugestaoCompra7Dias > 0;
                    return (
                      <tr key={item.insumo.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-stone-900">{item.insumo.nome}</span>
                          <span className="block text-[11px] text-stone-500">
                            {item.insumo.fornecedorPadrao || 'Fornecedor padrão não definido'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono tabular-nums text-stone-800">
                          {item.insumo.estoqueAtual.toFixed(3)} {item.insumo.unidade}
                        </td>

                        <td className="py-3 px-4 text-right font-mono tabular-nums text-stone-600">
                          ~{item.consumoDiarioEstimado.toFixed(3)} {item.insumo.unidade}/dia
                        </td>

                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          <span
                            className={
                              item.diasAutonomia <= 2
                                ? 'text-red-700 font-bold'
                                : item.diasAutonomia <= 5
                                ? 'text-amber-700 font-medium'
                                : 'text-emerald-800'
                            }
                          >
                            {item.diasAutonomia} dias
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          {precisaComprar ? (
                            <span className="text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              +{item.sugestaoCompra7Dias.toFixed(3)} {item.insumo.unidade}
                            </span>
                          ) : (
                            <span className="text-stone-400">Estoque suficiente</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-stone-900 font-semibold tabular-nums">
                          {precisaComprar ? `R$ ${item.custoEstimadoReposicao.toFixed(2)}` : 'R$ 0,00'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setInsumoSelecionadoParaEntrada(item.insumo);
                              setQtdEntrada(item.sugestaoCompra7Dias.toString());
                              setCustoEntrada(item.insumo.custoUnitario.toString());
                              setFornecedorEntrada(item.insumo.fornecedorPadrao || '');
                              setDataCompra(getLocalDate());
                              setModalEntradaAberto(true);
                            }}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium transition-colors"
                          >
                            Comprar Agora
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: HISTÓRICO DE MOVIMENTAÇÕES */}
      {abaAtiva === 'historico' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Registro Auditável de Entradas e Baixas
            </h3>
            <span className="text-xs text-stone-500">
              {movimentacoes.length} eventos registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Data / Hora</th>
                  <th className="py-3 px-4 font-semibold">Tipo</th>
                  <th className="py-3 px-4 font-semibold">Insumo</th>
                  <th className="py-3 px-4 font-semibold">Motivo / Vínculo</th>
                  <th className="py-3 px-4 font-semibold text-right">Qtd Movimentada</th>
                  <th className="py-3 px-4 font-semibold text-right">Saldo Resultante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {movimentacoes.map((mov) => {
                  const isEntrada = mov.quantidade > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-500 whitespace-nowrap">
                        {mov.dataHora}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {mov.tipo === 'perda_descarte' ? (
                          <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                            <Trash2 className="h-3 w-3" /> Perda / descarte
                          </span>
                        ) : mov.tipo === 'baixa_pedido' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <ArrowDownRight className="w-3 h-3" /> Baixa Pedido
                          </span>
                        ) : mov.tipo === 'entrada_compra' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ArrowUpRight className="w-3 h-3" /> Entrada Compra
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                            <SlidersHorizontal className="w-3 h-3" /> Ajuste Manual
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-medium text-stone-900">{mov.ingredienteNome}</td>

                      <td className="py-3 px-4 text-stone-600">{mov.motivo || '—'}</td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={isEntrada ? 'text-emerald-700' : 'text-red-700'}>
                          {isEntrada ? '+' : ''}
                          {mov.quantidade.toFixed(3)} {mov.unidade}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-stone-900 font-semibold tabular-nums">
                        {mov.saldoPosterior.toFixed(3)} {mov.unidade}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ENTRADA FORMAL DE MERCADORIAS */}
      {modalEntradaAberto && insumoSelecionadoParaEntrada && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-stone-200 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">
              Registrar Entrada de Mercadoria
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 mb-4">
              Insumo: <strong>{insumoSelecionadoParaEntrada.nome}</strong> (Saldo atual:{' '}
              {insumoSelecionadoParaEntrada.estoqueAtual} {insumoSelecionadoParaEntrada.unidade})
            </p>

            <form onSubmit={handleSubmeterEntrada} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Quantidade Recebida ({insumoSelecionadoParaEntrada.unidade}) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder={`Ex: 10 ${insumoSelecionadoParaEntrada.unidade}`}
                  value={qtdEntrada}
                  onChange={(e) => setQtdEntrada(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Custo Unitário (R$ por {insumoSelecionadoParaEntrada.unidade}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={custoEntrada}
                  onChange={(e) => setCustoEntrada(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Data da Compra / Emissão *
                </label>
                <input
                  type="date"
                  required
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Fornecedor / Origem
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={fornecedorEntrada}
                      onChange={(event) => setFornecedorEntrada(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2 py-2 focus:border-emerald-700 focus:outline-none"
                    >
                      <option value="">Não informado</option>
                      {fornecedores.map((fornecedor) => <option key={fornecedor} value={fornecedor}>{fornecedor}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => abrirGerenciadorFornecedores('entrada')}
                      className="shrink-0 rounded-lg border border-stone-200 bg-white px-2 text-[10px] font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Nº Nota Fiscal (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NF-4089"
                    value={nfEntrada}
                    onChange={(e) => setNfEntrada(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox para integrar com Finanças */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gerarSaidaCaixa}
                    onChange={(e) => setGerarSaidaCaixa(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  <span className="font-semibold text-stone-800">
                    Lançar despesa no Caixa (Finanças)
                  </span>
                </label>
                {gerarSaidaCaixa && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-600">
                    <span>
                      Valor total a debitar:{' '}
                      <strong className="font-mono text-stone-900">
                        R${' '}
                        {(
                          (parseFloat(qtdEntrada) || 0) * (parseFloat(custoEntrada) || 0)
                        ).toFixed(2)}
                      </strong>
                    </span>
                    <select
                      value={metodoPagamentoEntrada}
                      onChange={(e) => setMetodoPagamentoEntrada(e.target.value as MetodoPagamento)}
                      className="px-2 py-1 bg-white border border-stone-200 rounded text-xs"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEntradaAberto(false)}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-medium shadow-xs"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE MANUAL DE ESTOQUE */}
      {modalAjusteAberto && insumoSelecionadoParaAjuste && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-stone-200 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">Ajuste Manual de Insumo</h3>
            <p className="text-xs text-stone-500 mt-0.5 mb-4">
              {insumoSelecionadoParaAjuste.nome} (Saldo atual:{' '}
              {insumoSelecionadoParaAjuste.estoqueAtual} {insumoSelecionadoParaAjuste.unidade})
            </p>

            <form onSubmit={handleSubmeterAjuste} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Novo Saldo Real Conferido ({insumoSelecionadoParaAjuste.unidade}) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={novoSaldoAjuste}
                  onChange={(e) => setNovoSaldoAjuste(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Motivo do Ajuste *
                </label>
                <select
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none bg-white"
                >
                  <option value="Conferência de Inventário Físico">
                    Conferência de Inventário Físico
                  </option>
                  <option value="Perda / Validade / Descarte">Perda / Validade / Descarte</option>
                  <option value="Quebra durante preparação">Quebra durante preparação</option>
                  <option value="Ajuste de rendimento de corte">Ajuste de rendimento de corte</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAjusteAberto(false)}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium shadow-xs"
                >
                  Salvar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO INSUMO MANUAL */}
      {modalNovoInsumoAberto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-stone-200 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">Novo Insumo no Estoque</h3>
            <p className="text-xs text-stone-500 mt-0.5 mb-4">
              Informe o saldo que existe hoje. Um saldo inicial maior que zero será registrado no histórico como ajuste de cadastro.
            </p>

            <form onSubmit={handleCriarNovoInsumo} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Nome do Insumo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Queijo Gorgonzola Especial"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Categoria</label>
                  <select
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value as CategoriaInsumo)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none bg-white"
                  >
                    {categorias.filter((c) => c !== 'Todas').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Unidade de Medida</label>
                  <select
                    value={novaUnidade}
                    onChange={(e) => setNovaUnidade(e.target.value as UnidadeMedida)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none bg-white font-mono"
                  >
                    <option value="kg">kg (Quilograma)</option>
                    <option value="g">g (Grama)</option>
                    <option value="un">un (Unidade)</option>
                    <option value="l">l (Litro)</option>
                    <option value="ml">ml (Mililitro)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Estoque Atual *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    required
                    value={novoEstoqueAtual}
                    onChange={(e) => setNovoEstoqueAtual(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Estoque Mínimo *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    required
                    value={novoEstoqueMin}
                    onChange={(e) => setNovoEstoqueMin(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Custo Estimado (R$ por unidade) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={novoCusto}
                  onChange={(e) => setNovoCusto(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label htmlFor="novo-insumo-fornecedor" className="block font-medium text-stone-700">Fornecedor padrão (opcional)</label>
                  <button type="button" onClick={() => abrirGerenciadorFornecedores('novo')} className="text-[10px] font-medium text-emerald-800 hover:text-emerald-950">
                    Gerenciar fornecedores
                  </button>
                </div>
                <select
                  id="novo-insumo-fornecedor"
                  value={novoFornecedor}
                  onChange={(e) => setNovoFornecedor(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="">Não informado</option>
                  {fornecedores.map((fornecedor) => <option key={fornecedor} value={fornecedor}>{fornecedor}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoInsumoAberto(false)}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-medium shadow-xs"
                >
                  Cadastrar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {insumoParaExcluir && (
        <ConfirmDeleteDialog
          title="Deseja mesmo excluir este insumo?"
          description={`"${insumoParaExcluir.nome}" será removido do estoque e não poderá ser selecionado em novas entradas ou ajustes.`}
          consequences={(
            <>
              {produtosComInsumoSelecionado.length > 0 && (
                <p>
                  O insumo também será removido das fichas técnicas de:{' '}
                  <strong>{produtosComInsumoSelecionado.map((produto) => produto.nome).join(', ')}</strong>.
                </p>
              )}
              {insumoParaExcluir.estoqueAtual !== 0 && (
                <p className={produtosComInsumoSelecionado.length > 0 ? 'mt-2' : undefined}>
                  O saldo atual de <strong>{insumoParaExcluir.estoqueAtual.toFixed(3)} {insumoParaExcluir.unidade}</strong>{' '}
                  será zerado e o ajuste ficará registrado no histórico de movimentações.
                </p>
              )}
            </>
          )}
          reasons={['Cadastro duplicado', 'Insumo descontinuado', 'Nome, categoria ou unidade incorretos', 'Insumo não utilizado', 'Outro (informar)']}
          confirmLabel="Excluir insumo"
          onCancel={() => {
            setInsumoParaExcluir(null);
            setErroExclusaoInsumo(null);
          }}
          onConfirm={handleConfirmarExclusaoInsumo}
          error={erroExclusaoInsumo}
        />
      )}
      {insumoParaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <section role="dialog" aria-modal="true" aria-labelledby="editar-insumo-titulo" className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
            <h3 id="editar-insumo-titulo" className="text-base font-bold text-stone-900">Editar insumo</h3>
            <p className="mb-4 mt-1 text-xs text-stone-500">
              Atualize os dados de cadastro. Para alterar o saldo, use Entrada ou Ajustar e mantenha o histórico de estoque.
            </p>
            <form onSubmit={handleSalvarEdicaoInsumo} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="editar-insumo-nome" className="mb-1 block font-medium text-stone-700">Nome do insumo *</label>
                <input
                  id="editar-insumo-nome"
                  required
                  maxLength={100}
                  value={dadosEdicaoInsumo.nome}
                  onChange={(event) => setDadosEdicaoInsumo((dados) => ({ ...dados, nome: event.target.value }))}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editar-insumo-categoria" className="mb-1 block font-medium text-stone-700">Categoria *</label>
                  <select
                    id="editar-insumo-categoria"
                    value={dadosEdicaoInsumo.categoria}
                    onChange={(event) => setDadosEdicaoInsumo((dados) => ({ ...dados, categoria: event.target.value as CategoriaInsumo }))}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 focus:border-emerald-700 focus:outline-none"
                  >
                    {categorias.filter((categoria) => categoria !== 'Todas').map((categoria) => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="editar-insumo-unidade" className="mb-1 block font-medium text-stone-700">Unidade de medida *</label>
                  <select
                    id="editar-insumo-unidade"
                    disabled={Boolean(unidadeInsumoBloqueada)}
                    value={dadosEdicaoInsumo.unidade}
                    onChange={(event) => setDadosEdicaoInsumo((dados) => ({ ...dados, unidade: event.target.value as UnidadeMedida }))}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono focus:border-emerald-700 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-100"
                  >
                    <option value="kg">kg (Quilograma)</option>
                    <option value="g">g (Grama)</option>
                    <option value="un">un (Unidade)</option>
                    <option value="l">l (Litro)</option>
                    <option value="ml">ml (Mililitro)</option>
                  </select>
                  {unidadeInsumoBloqueada && (
                    <p className="mt-1 text-[10px] text-stone-500">A unidade não pode ser alterada após movimentações ou uso em fichas técnicas.</p>
                  )}
                </div>
                <div>
                  <label htmlFor="editar-insumo-minimo" className="mb-1 block font-medium text-stone-700">Estoque mínimo *</label>
                  <input
                    id="editar-insumo-minimo"
                    type="number"
                    min="0"
                    step="0.001"
                    required
                    value={dadosEdicaoInsumo.estoqueMinimo}
                    onChange={(event) => setDadosEdicaoInsumo((dados) => ({ ...dados, estoqueMinimo: event.target.value }))}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="editar-insumo-custo" className="mb-1 block font-medium text-stone-700">Custo unitário (R$) *</label>
                  <input
                    id="editar-insumo-custo"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={dadosEdicaoInsumo.custoUnitario}
                    onChange={(event) => setDadosEdicaoInsumo((dados) => ({ ...dados, custoUnitario: event.target.value }))}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label htmlFor="editar-insumo-fornecedor" className="block font-medium text-stone-700">Fornecedor padrão (opcional)</label>
                  <button type="button" onClick={() => abrirGerenciadorFornecedores('edicao')} className="text-[10px] font-medium text-emerald-800 hover:text-emerald-950">
                    Gerenciar fornecedores
                  </button>
                </div>
                <select
                  id="editar-insumo-fornecedor"
                  value={dadosEdicaoInsumo.fornecedorPadrao}
                  onChange={(event) => setDadosEdicaoInsumo((dados) => ({ ...dados, fornecedorPadrao: event.target.value }))}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="">Não informado</option>
                  {fornecedores.map((fornecedor) => <option key={fornecedor} value={fornecedor}>{fornecedor}</option>)}
                </select>
              </div>
              {erroSalvarInsumo && <p role="alert" className="text-xs text-red-700">{erroSalvarInsumo}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setInsumoParaEditar(null)} className="rounded-lg px-3.5 py-2 font-medium text-stone-600 hover:bg-stone-100">Cancelar</button>
                <button type="submit" className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white shadow-xs hover:bg-emerald-900">Salvar alterações</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {mostrarGerenciadorFornecedores && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="fornecedores-titulo"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stone-200 bg-white p-5 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="fornecedores-titulo" className="text-base font-bold text-stone-900">Fornecedores</h3>
                <p className="mt-1 text-xs text-stone-500">Cadastre e reutilize fornecedores sem preencher o nome a cada vez. A seleção nos insumos continua opcional.</p>
              </div>
              <button type="button" aria-label="Fechar fornecedores" onClick={() => setMostrarGerenciadorFornecedores(false)} className="rounded px-2 py-1 text-stone-500 hover:bg-stone-100">✕</button>
            </div>

            <form onSubmit={handleAdicionarFornecedor} className="mb-4 flex gap-2">
              <input
                required
                maxLength={100}
                value={novoFornecedorNome}
                onChange={(event) => setNovoFornecedorNome(event.target.value)}
                placeholder="Nome do fornecedor"
                aria-label="Nome do novo fornecedor"
                className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              />
              <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900">
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </form>

            {erroFornecedores && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{erroFornecedores}</p>}
            {mensagemFornecedores && <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{mensagemFornecedores}</p>}

            <div className="space-y-2">
              {fornecedores.length === 0 && (
                <p className="rounded-lg border border-dashed border-stone-300 px-3 py-5 text-center text-xs text-stone-500">Nenhum fornecedor cadastrado. Adicione um acima ou deixe o campo sem fornecedor.</p>
              )}
              {fornecedores.map((fornecedor) => {
                const insumosVinculados = insumos.filter((insumo) => insumo.fornecedorPadrao === fornecedor).length;
                return (
                  <div key={fornecedor} className="rounded-lg border border-stone-200 p-3">
                    <div className="flex items-center gap-2">
                      {fornecedorEmEdicao === fornecedor ? (
                        <>
                          <input
                            autoFocus
                            required
                            maxLength={100}
                            value={nomeFornecedorEditando}
                            onChange={(event) => setNomeFornecedorEditando(event.target.value)}
                            aria-label={`Novo nome para ${fornecedor}`}
                            className="min-w-0 flex-1 rounded-md border border-stone-200 px-2 py-1.5 text-sm focus:border-emerald-700 focus:outline-none"
                          />
                          <button type="button" onClick={() => handleSalvarNomeFornecedor(fornecedor)} className="rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800">Salvar</button>
                          <button type="button" onClick={() => setFornecedorEmEdicao(null)} className="rounded-md px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{fornecedor}</span>
                          <span className="text-[10px] text-stone-500">{insumosVinculados} insumo(s)</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFornecedorEmEdicao(fornecedor);
                              setNomeFornecedorEditando(fornecedor);
                              setErroFornecedores(null);
                            }}
                            aria-label={`Renomear ${fornecedor}`}
                            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFornecedorParaExcluir(fornecedorParaExcluir === fornecedor ? null : fornecedor)}
                            aria-label={`Excluir ${fornecedor}`}
                            className="rounded-md p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    {fornecedorParaExcluir === fornecedor && (
                      <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                        <p className="text-xs text-stone-700">
                          Excluir “{fornecedor}”?
                          {insumosVinculados > 0 && ` O fornecedor será removido do cadastro de ${insumosVinculados} insumo(s). Saldos e movimentações serão preservados.`}
                        </p>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setFornecedorParaExcluir(null)} className="rounded-md px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100">Cancelar</button>
                          <button type="button" onClick={() => handleExcluirFornecedor(fornecedor)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800">Confirmar exclusão</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end border-t border-stone-100 pt-3">
              <button type="button" onClick={() => setMostrarGerenciadorFornecedores(false)} className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800">Concluir</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
