import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MetodoPagamento, Mesa } from '../../types';
import { ConfirmDeleteDialog } from '../common/ConfirmDeleteDialog';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Clock,
  ChefHat,
  Info,
  Users,
  X,
} from 'lucide-react';

export const PedidoView: React.FC = () => {
  const {
    mesas,
    categoriasProduto,
    mesaSelecionadaId,
    setMesaSelecionadaId,
    produtos,
    pedidos,
    abrirMesa,
    adicionarMesa,
    excluirMesa,
    cancelarPedido,
    atualizarPessoasMesa,
    adicionarItemAoPedido,
    removerItemDoPedido,
    atualizarQuantidadeItemPedido,
    atualizarObservacaoItem,
    toggleTaxaServico,
    enviarPedidoParaCozinha,
    fecharMesaComPagamento,
    turnoCaixa,
    canalAtendimento,
    setCanalAtendimento,
    pedidoBalcaoSelecionadoId,
    setPedidoBalcaoSelecionadoId,
    criarPedidoBalcao,
    cobrarPedidoBalcao,
    atualizarIdentificacaoPedidoBalcao,
  } = useApp();

  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todos');
  const [metodoPagamentoSelecionado, setMetodoPagamentoSelecionado] = useState<MetodoPagamento>('Pix');
  const [feedbackMensagem, setFeedbackMensagem] = useState<string | null>(null);
  const [editandoObsItemId, setEditandoObsItemId] = useState<string | null>(null);
  const [tempObs, setTempObs] = useState('');
  const [mostrarCadastroMesa, setMostrarCadastroMesa] = useState(false);
  const [nomeNovaMesa, setNomeNovaMesa] = useState('');
  const [capacidadeNovaMesa, setCapacidadeNovaMesa] = useState('4');
  const [erroMesa, setErroMesa] = useState<string | null>(null);
  const [pedidoDrawerAberto, setPedidoDrawerAberto] = useState(false);
  const [identificacaoNovoPedido, setIdentificacaoNovoPedido] = useState('');
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<
    { tipo: 'mesa'; id: string; nome: string } |
    { tipo: 'pedido'; id: string; nome: string } |
    null
  >(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const mesaAtiva = canalAtendimento === 'salao'
    ? mesas.find((m) => m.id === mesaSelecionadaId) || mesas[0]
    : undefined;
  const pedidosBalcao = pedidos.filter((pedido) =>
    pedido.canal === 'balcao' &&
    ['aberto', 'na_fila', 'em_preparo', 'pronto', 'entregue'].includes(pedido.status)
  );
  const pedidoAtivo = canalAtendimento === 'balcao'
    ? pedidosBalcao.find((pedido) => pedido.id === pedidoBalcaoSelecionadoId) || pedidosBalcao[0]
    : pedidos.find((p) => p.id === mesaAtiva?.pedidoAtualId);
  const idAtendimento = canalAtendimento === 'balcao' ? pedidoAtivo?.id : mesaAtiva?.id;
  const pedidoPodeSerPago = pedidoAtivo && (
    canalAtendimento === 'balcao'
      ? ['pronto', 'entregue'].includes(pedidoAtivo.status)
      : ['aberto', 'pronto', 'entregue'].includes(pedidoAtivo.status)
  );
  const subtituloPedido = canalAtendimento === 'balcao'
    ? pedidoAtivo?.status === 'aberto'
      ? 'Envie o pedido para a cozinha'
      : pedidoAtivo?.metodoPagamento
        ? `Pago via ${pedidoAtivo.metodoPagamento}`
        : pedidoAtivo?.status === 'pronto' || pedidoAtivo?.status === 'entregue'
          ? 'Pronto · aguardando pagamento'
          : pedidoAtivo
            ? 'Enviado para a cozinha · aguardando preparo'
        : 'Crie um pedido para iniciar o atendimento'
    : mesaAtiva?.status === 'livre'
      ? 'Mesa livre (sem comanda aberta)'
      : `Aberto às ${mesaAtiva?.tempoAbertura || '12:00'}`;

  const categorias = ['Todos', ...categoriasProduto];

  const produtosFiltrados = produtos.filter((p) => {
    if (!p.ativo) return false;
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()));
    const matchCategoria =
      categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva;
    return matchBusca && matchCategoria;
  });

  const handleConfirmarPagamento = () => {
    if (!pedidoAtivo) return;
    const resultado = canalAtendimento === 'balcao'
      ? cobrarPedidoBalcao(pedidoAtivo.id, metodoPagamentoSelecionado)
      : mesaAtiva
        ? fecharMesaComPagamento(mesaAtiva.id, metodoPagamentoSelecionado)
        : { sucesso: false, mensagem: 'Selecione uma mesa para continuar.' };
    setFeedbackMensagem(resultado.mensagem);
    if (resultado.sucesso) setPedidoDrawerAberto(false);
    setTimeout(() => setFeedbackMensagem(null), 5000);
  };

  const handleCriarPedidoBalcao = (e: React.FormEvent) => {
    e.preventDefault();
    const identificacao = identificacaoNovoPedido.trim();
    if (!identificacao) return;
    const id = criarPedidoBalcao(identificacao);
    if (id) setIdentificacaoNovoPedido('');
  };

  const handleAdicionarMesa = (e: React.FormEvent) => {
    e.preventDefault();
    const resultado = adicionarMesa(nomeNovaMesa, Number(capacidadeNovaMesa));
    if (!resultado.sucesso) {
      setErroMesa(resultado.mensagem);
      return;
    }
    setErroMesa(null);
    setNomeNovaMesa('');
    setCapacidadeNovaMesa('4');
    setMostrarCadastroMesa(false);
    setFeedbackMensagem(resultado.mensagem);
  };

  const handleConfirmarExclusao = (motivo: string) => {
    if (!confirmacaoExclusao) return;
    const resultado = confirmacaoExclusao.tipo === 'mesa'
      ? excluirMesa(confirmacaoExclusao.id, motivo)
      : cancelarPedido(confirmacaoExclusao.id, motivo);

    if (!resultado.sucesso) {
      setErroExclusao(resultado.mensagem);
      return;
    }

    if (confirmacaoExclusao.tipo === 'pedido' && canalAtendimento === 'balcao') {
      setPedidoBalcaoSelecionadoId(null);
      setPedidoDrawerAberto(false);
    }
    setFeedbackMensagem(resultado.mensagem);
    setErroExclusao(null);
    setConfirmacaoExclusao(null);
  };

  const getStatusBadge = (mesa: Mesa) => {
    switch (mesa.status) {
      case 'livre':
        return <span className="text-[11px] text-stone-500 font-medium">Livre</span>;
      case 'ocupada':
        return <span className="text-[11px] font-semibold text-emerald-800">Comanda aberta</span>;
      case 'cozinha':
        return (
          <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
            <ChefHat className="w-3 h-3" /> Na cozinha
          </span>
        );
      case 'pronta':
        return (
          <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Pronta
          </span>
        );
      default:
        return <span className="text-[11px] text-stone-500">Livre</span>;
    }
  };

  return (
    <div className="grid min-h-full grid-cols-1 bg-white pb-28 md:h-full md:min-h-0 md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-[minmax(28rem,1fr)_auto] md:overflow-y-auto md:pb-0">
      {/* 1. SUB-COLUNA: SELEÇÃO DE MESAS */}
      <section aria-label="Mesas do salão" className="flex min-w-0 flex-col border-b border-stone-200 bg-white p-4 md:min-h-0 md:overflow-hidden md:border-b-0 md:border-r">
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1" role="tablist" aria-label="Canal de atendimento">
          <button
            type="button"
            role="tab"
            aria-selected={canalAtendimento === 'salao'}
            onClick={() => setCanalAtendimento('salao')}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${canalAtendimento === 'salao' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Salão
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={canalAtendimento === 'balcao'}
            onClick={() => setCanalAtendimento('balcao')}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${canalAtendimento === 'balcao' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Balcão / Para levar
          </button>
        </div>
        {canalAtendimento === 'salao' ? (
          <>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">Mesas do Salão</h2>
            <p className="text-xs text-stone-500">Livre = disponível · aberta = em atendimento</p>
          </div>
          <button
            type="button"
            disabled={!turnoCaixa?.aberto || !mesas.some((mesa) => mesa.status === 'livre')}
            onClick={() => {
              const primeiraLivre = mesas.find((m) => m.status === 'livre');
              if (primeiraLivre) abrirMesa(primeiraLivre.numero, Math.min(2, primeiraLivre.capacidade));
            }}
            className="text-xs px-2.5 py-1 font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md border border-emerald-200 transition-colors"
          >
            + Abrir livre
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setErroMesa(null);
            setMostrarCadastroMesa((aberto) => !aberto);
          }}
          className="mb-3 w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
        >
          + Adicionar mesa
        </button>
        {mostrarCadastroMesa && (
          <form onSubmit={handleAdicionarMesa} className="mb-3 space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <label className="block text-xs font-medium text-stone-700">
              Nome
              <input
                autoFocus
                required
                maxLength={40}
                value={nomeNovaMesa}
                onChange={(e) => setNomeNovaMesa(e.target.value)}
                placeholder="Ex.: Varanda"
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2 py-1.5"
              />
            </label>
            <label className="block text-xs font-medium text-stone-700">
              Capacidade
              <input
                type="number"
                min={1}
                max={30}
                step={1}
                required
                value={capacidadeNovaMesa}
                onChange={(e) => setCapacidadeNovaMesa(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2 py-1.5"
              />
            </label>
            {erroMesa && <p role="alert" className="text-xs text-red-700">{erroMesa}</p>}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-md bg-emerald-800 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-900">
                Salvar mesa
              </button>
              <button type="button" onClick={() => setMostrarCadastroMesa(false)} className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Grade de Mesas */}
        <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1 min-[420px]:grid-cols-3 md:min-h-0 md:max-h-none md:flex-1 md:grid-cols-2">
          {mesas.map((mesa) => {
            const isSelected = mesa.id === mesaAtiva?.id;
            const pedidoMesa = pedidos.find((p) => p.id === mesa.pedidoAtualId);
            return (
              <div
                key={mesa.id}
                className={`relative rounded-xl border transition-all ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/30 shadow-xs'
                    : mesa.status === 'livre'
                    ? 'border-stone-200 bg-stone-50/50 hover:bg-white hover:border-stone-300'
                    : mesa.status === 'pronta'
                    ? 'border-blue-300 bg-blue-50/40 hover:bg-blue-50/70'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setMesaSelecionadaId(mesa.id)}
                  className="w-full p-3.5 text-left"
                >
                <div className="flex min-w-0 items-center justify-between gap-1">
                  <span className="truncate text-sm font-bold text-stone-900">{mesa.nome}</span>
                  {mesa.pessoas && (
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-stone-500">
                      <Users className="h-2.5 w-2.5" /> {mesa.pessoas}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="min-w-0">{getStatusBadge(mesa)}</span>
                  <span className="text-[10px] text-stone-400">{mesa.capacidade} lugares</span>
                </div>
                {pedidoMesa && pedidoMesa.total > 0 && (
                  <div className="mt-1 truncate text-right text-xs font-mono font-semibold tabular-nums text-stone-900">
                    R$ {pedidoMesa.total.toFixed(2)}
                  </div>
                )}
                </button>
                {mesa.status === 'livre' && !mesa.pedidoAtualId && (
                  <button
                    type="button"
                    aria-label={`Excluir ${mesa.nome}`}
                    title={`Excluir ${mesa.nome}`}
                    onClick={() => {
                      setErroExclusao(null);
                      setConfirmacaoExclusao({ tipo: 'mesa', id: mesa.id, nome: mesa.nome });
                    }}
                    className="absolute right-1 top-1 rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {erroMesa && !mostrarCadastroMesa && <p role="alert" className="mt-2 text-xs text-red-700">{erroMesa}</p>}

        {/* Quick summary footer for tables */}
        <div className="mt-4 pt-3 border-t border-stone-100 hidden lg:flex items-center justify-between text-xs text-stone-500">
          <span>{mesas.filter((m) => m.status !== 'livre').length} ocupadas</span>
          <span aria-hidden="true">·</span>
          <span>{mesas.filter((m) => m.status === 'livre').length} livres</span>
        </div>
          </>
        ) : (
          <>
            <div className="mb-3">
              <h2 className="text-sm font-bold tracking-tight text-stone-900">Pedidos de balcão</h2>
              <p className="text-xs text-stone-500">Identifique pelo nome do cliente ou número da ficha.</p>
            </div>
            <form onSubmit={handleCriarPedidoBalcao} className="mb-3 flex gap-2">
              <input
                required
                maxLength={50}
                value={identificacaoNovoPedido}
                onChange={(event) => setIdentificacaoNovoPedido(event.target.value)}
                placeholder="Nome ou nº da ficha"
                aria-label="Nome do cliente ou número da ficha"
                className="min-w-0 flex-1 rounded-md border border-stone-300 px-2.5 py-2 text-xs focus:border-emerald-700 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!turnoCaixa?.aberto}
                className="shrink-0 rounded-md bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Novo
              </button>
            </form>
            <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 md:min-h-0 md:flex-1">
              {pedidosBalcao.map((pedido) => (
                <button
                  type="button"
                  key={pedido.id}
                  onClick={() => setPedidoBalcaoSelecionadoId(pedido.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${pedido.id === pedidoAtivo?.id ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600/20' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                >
                  <span className="block truncate text-sm font-semibold text-stone-900">{pedido.identificacaoBalcao}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-stone-500">
                    <span>
                      Ficha #{pedido.numeroSequencial} · {pedido.status === 'aberto'
                        ? 'Aguardando envio à cozinha'
                        : pedido.status === 'pronto'
                          ? 'Pronto · aguarda pagamento'
                          : pedido.status === 'entregue'
                            ? 'Entregue · aguarda pagamento'
                          : pedido.status === 'em_preparo'
                            ? 'Em preparo'
                            : 'Na cozinha'}
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-stone-800">R$ {pedido.total.toFixed(2)}</span>
                  </span>
                </button>
              ))}
              {pedidosBalcao.length === 0 && (
                <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-xs text-stone-500">
                  Nenhum pedido ativo. Crie um pedido para começar.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* 2. COLUNA CENTRAL: CATÁLOGO DE PRODUTOS & LANÇAMENTO */}
      <section aria-label="Catálogo de produtos" className="flex min-w-0 flex-col p-4 lg:p-6 md:min-h-0 md:overflow-y-auto">
        {feedbackMensagem && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedbackMensagem}</span>
            </div>
            <button
              onClick={() => setFeedbackMensagem(null)}
              className="text-stone-400 hover:text-stone-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Um bom atendimento começa aqui.
            </h2>
            <p className="text-xs text-stone-500">
              {canalAtendimento === 'balcao'
                ? pedidoAtivo
                  ? `Pedido para ${pedidoAtivo.identificacaoBalcao}. A cobrança é feita antes do envio à cozinha.`
                  : 'Crie ou selecione um pedido de balcão à esquerda.'
                : mesaAtiva
                ? mesaAtiva.status === 'livre'
                  ? `${mesaAtiva.nome} está livre. Ao lançar um item, a comanda será aberta.`
                  : `Adicionando itens à comanda da ${mesaAtiva.nome}.`
                : 'Selecione uma mesa à esquerda'}
            </p>
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar pastel ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Abas de Categorias */}
        <div
          aria-label="Categorias de produtos"
          className="relative z-10 mb-4 flex w-full shrink-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-2 scrollbar-none"
        >
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                categoriaAtiva === cat
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grade de Produtos */}
        <div className="grid auto-rows-fr grid-cols-1 gap-3.5 sm:grid-cols-2">
          {produtosFiltrados.map((produto) => {
            return (
              <div
                key={produto.id}
                className="group flex min-h-44 flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:border-emerald-700 hover:shadow-xs"
              >
                <div className="p-3.5">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="truncate text-xs font-bold text-stone-900">
                        {produto.nome}
                      </h3>
                    </div>
                    <p className="mt-0.5 min-h-[2.5em] overflow-hidden text-ellipsis text-[11px] leading-snug text-stone-500 line-clamp-2">
                      {produto.descricao}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-900 tabular-nums">
                        R$ {produto.preco.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> ~{produto.tempoPreparoMinutos} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão de Adição Rápida */}
                <div className="px-3.5 pb-3 pt-0 flex justify-end">
                  <button
                    type="button"
                    disabled={
                      canalAtendimento === 'balcao'
                        ? !pedidoAtivo || pedidoAtivo.status !== 'aberto'
                        : !mesaAtiva
                    }
                    onClick={() => {
                      if (canalAtendimento === 'balcao') {
                        if (pedidoAtivo?.status === 'aberto') adicionarItemAoPedido(pedidoAtivo.id, produto.id, 1);
                      } else if (mesaAtiva) {
                        adicionarItemAoPedido(mesaAtiva.id, produto.id, 1);
                      }
                    }}
                    className="w-full py-1.5 px-3 bg-stone-100 hover:bg-emerald-800 hover:text-white text-stone-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {canalAtendimento === 'balcao'
                        ? pedidoAtivo?.status === 'aberto'
                          ? 'Adicionar ao pedido'
                          : 'Selecione um pedido aberto'
                        : mesaAtiva?.status === 'livre'
                        ? `Abrir ${mesaAtiva.nome} e lançar`
                        : `Lançar na ${mesaAtiva?.nome || 'Mesa'}`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {produtosFiltrados.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-200">
            <p className="text-sm text-stone-500 font-medium">Nenhum produto encontrado nesta categoria.</p>
            <p className="text-xs text-stone-400 mt-1">Experimente buscar por outro nome ou cadastre no Cardápio.</p>
          </div>
        )}
      </section>

      {/* 3. COLUNA DIREITA: COMANDA / CONTA DA MESA ATIVA */}
      {pedidoDrawerAberto && (
        <button
          type="button"
          aria-label="Fechar pedido"
          onClick={() => setPedidoDrawerAberto(false)}
          className="fixed inset-0 z-40 bg-stone-950/40 md:hidden"
        />
      )}
      <section
        aria-label={canalAtendimento === 'balcao' ? 'Pedido de balcão ativo' : 'Comanda da mesa ativa'}
        aria-modal={pedidoDrawerAberto ? true : undefined}
        role={pedidoDrawerAberto ? 'dialog' : undefined}
        className={`${pedidoDrawerAberto ? 'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col overflow-y-auto rounded-t-2xl border-x' : 'hidden'} min-h-0 min-w-0 border-stone-200 bg-white p-4 shadow-xl md:static md:col-span-2 md:flex md:max-h-none md:overflow-y-visible md:rounded-none md:border-x-0 md:border-t md:shadow-none md:p-5 xl:items-start xl:gap-6`}
      >
        <div className="min-w-0 xl:flex-1">
          {/* Cabeçalho da Comanda */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 tracking-tight">
                  {canalAtendimento === 'balcao'
                    ? pedidoAtivo
                      ? `Balcão · ${pedidoAtivo.identificacaoBalcao}`
                      : 'Nenhum pedido selecionado'
                    : mesaAtiva?.nome || 'Nenhuma mesa'}
                </h3>
                {pedidoAtivo && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                    #{pedidoAtivo.numeroSequencial}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {subtituloPedido}
              </p>
              {canalAtendimento === 'balcao' && pedidoAtivo?.status === 'aberto' && (
                <label className="mt-2 block text-[11px] font-medium text-stone-600">
                  Cliente ou ficha
                  <input
                    value={pedidoAtivo.identificacaoBalcao || ''}
                    onChange={(event) => atualizarIdentificacaoPedidoBalcao(pedidoAtivo.id, event.target.value)}
                    maxLength={50}
                    className="mt-1 block w-full rounded-md border border-stone-300 px-2 py-1.5 text-xs text-stone-900"
                  />
                </label>
              )}
              {canalAtendimento === 'salao' && mesaAtiva && mesaAtiva.status !== 'livre' && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-stone-600">Pessoas:</span>
                  <button
                    type="button"
                    aria-label="Diminuir pessoas"
                    disabled={(mesaAtiva.pessoas || 1) <= 1}
                    onClick={() => atualizarPessoasMesa(mesaAtiva.id, -1)}
                    className="rounded border border-stone-200 p-1 text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <strong aria-live="polite" className="min-w-4 text-center text-stone-900">
                    {mesaAtiva.pessoas || 1}
                  </strong>
                  <button
                    type="button"
                    aria-label="Aumentar pessoas"
                    disabled={(mesaAtiva.pessoas || 1) >= mesaAtiva.capacidade}
                    onClick={() => atualizarPessoasMesa(mesaAtiva.id, 1)}
                    className="rounded border border-stone-200 p-1 text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <span className="text-stone-400">/ {mesaAtiva.capacidade} lugares</span>
                </div>
              )}
            </div>

            {canalAtendimento === 'balcao' && pedidoAtivo?.status === 'aberto' && (
              <button
                type="button"
                onClick={() => {
                  setErroExclusao(null);
                  setConfirmacaoExclusao({
                    tipo: 'pedido',
                    id: pedidoAtivo.id,
                    nome: pedidoAtivo.identificacaoBalcao || `Pedido #${pedidoAtivo.numeroSequencial}`,
                  });
                }}
                className="text-xs text-stone-400 transition-colors hover:text-red-600"
                title="Cancelar pedido"
              >
                Cancelar
              </button>
            )}
            {canalAtendimento === 'salao' && mesaAtiva && mesaAtiva.status !== 'livre' && (
              <button
                onClick={() => {
                  if (!pedidoAtivo) return;
                  setErroExclusao(null);
                  setConfirmacaoExclusao({
                    tipo: 'pedido',
                    id: pedidoAtivo.id,
                    nome: `${mesaAtiva.nome} · Pedido #${pedidoAtivo.numeroSequencial}`,
                  });
                }}
                className="text-stone-400 hover:text-red-600 text-xs transition-colors"
                title="Cancelar comanda"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              aria-label="Fechar pedido"
              onClick={() => setPedidoDrawerAberto(false)}
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Estado de Envio para Cozinha */}
          {pedidoAtivo && pedidoAtivo.itens.length > 0 && (
            <div className="my-3 flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
              <div className="flex items-center gap-2">
                {pedidoAtivo.status === 'aberto' ? (
                  <span className="text-stone-600">
                    {canalAtendimento === 'balcao' ? 'Aguardando envio à cozinha' : 'Itens em edição'}
                  </span>
                ) : pedidoAtivo.status === 'na_fila' ? (
                  <span className="font-semibold text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Na fila da cozinha
                  </span>
                ) : pedidoAtivo.status === 'em_preparo' ? (
                  <span className="font-semibold text-amber-800 flex items-center gap-1">
                    <ChefHat className="w-3.5 h-3.5" /> Em preparo no fogão
                  </span>
                ) : pedidoAtivo.status === 'pronto' ? (
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pronto no salão
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pedido entregue
                  </span>
                )}
              </div>

              {pedidoAtivo.status === 'aberto' && (
                <button
                  onClick={() => {
                    if (canalAtendimento === 'balcao') {
                      enviarPedidoParaCozinha(pedidoAtivo.id);
                    } else if (mesaAtiva) {
                      enviarPedidoParaCozinha(mesaAtiva.id);
                    }
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium flex items-center gap-1 transition-colors text-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Enviar p/ Cozinha</span>
                </button>
              )}
            </div>
          )}

          {/* Lista de Itens na Comanda */}
          <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto pr-1 my-2">
            {pedidoAtivo && pedidoAtivo.itens.length > 0 ? (
              pedidoAtivo.itens.map((item) => (
                <div key={item.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-stone-900 leading-tight">
                        {item.nome}
                      </p>
                      <span className="text-[11px] font-mono text-stone-500 tabular-nums">
                        {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                      </span>

                      {/* Observações */}
                      {editandoObsItemId === item.id ? (
                        <div className="mt-1 flex items-center gap-1">
                          <input
                            type="text"
                            value={tempObs}
                            onChange={(e) => setTempObs(e.target.value)}
                            placeholder="Ex: sem queijo, bem dourado..."
                            className="text-xs px-2 py-0.5 border border-stone-300 rounded w-full"
                          />
                          <button
                            onClick={() => {
                              if (idAtendimento) atualizarObservacaoItem(idAtendimento, item.id, tempObs);
                              setEditandoObsItemId(null);
                            }}
                            className="text-xs px-2 py-0.5 bg-stone-900 text-white rounded"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <p
                          onClick={() => {
                            if (canalAtendimento === 'balcao' && pedidoAtivo.status !== 'aberto') return;
                            setEditandoObsItemId(item.id);
                            setTempObs(item.observacoes || '');
                          }}
                          className={`mt-0.5 flex items-center gap-1 text-[11px] italic ${canalAtendimento === 'balcao' && pedidoAtivo.status !== 'aberto' ? 'text-stone-400' : 'cursor-pointer text-amber-800 hover:text-amber-900'}`}
                        >
                          {item.observacoes ? `Obs: ${item.observacoes}` : '+ Adicionar observação'}
                        </p>
                      )}
                    </div>

                    {/* Preço e Controles */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-bold font-mono text-stone-900 tabular-nums">
                        R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1 bg-stone-100 rounded p-0.5">
                        <button
                          type="button"
                          disabled={canalAtendimento === 'balcao' && pedidoAtivo.status !== 'aberto'}
                          onClick={() => idAtendimento && atualizarQuantidadeItemPedido(idAtendimento, item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-white rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-xs font-mono font-medium px-1.5 tabular-nums">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          disabled={canalAtendimento === 'balcao' && pedidoAtivo.status !== 'aberto'}
                          onClick={() => idAtendimento && atualizarQuantidadeItemPedido(idAtendimento, item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-white rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          disabled={canalAtendimento === 'balcao' && pedidoAtivo.status !== 'aberto'}
                          onClick={() => idAtendimento && removerItemDoPedido(idAtendimento, item.id)}
                          className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-white rounded transition-colors ml-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-stone-400 text-xs">
                {canalAtendimento === 'balcao'
                  ? 'Nenhum item lançado neste pedido ainda.'
                  : 'Nenhum item lançado nesta mesa ainda.'}
                <br />
                Clique nos produtos do catálogo para adicionar.
              </div>
            )}
          </div>
        </div>

        {/* Totais e Fechamento com Método de Pagamento */}
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-md ring-1 ring-stone-100 xl:mt-0 xl:w-[min(32rem,48%)] xl:shrink-0">
          <div className="space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums text-stone-900 font-medium">
                R$ {pedidoAtivo ? pedidoAtivo.subtotal.toFixed(2) : '0,00'}
              </span>
            </div>

            {canalAtendimento === 'salao' && <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pedidoAtivo?.taxaServicoAtiva || false}
                  onChange={() => mesaAtiva && toggleTaxaServico(mesaAtiva.id)}
                  disabled={!pedidoAtivo || pedidoAtivo.itens.length === 0}
                  className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-700"
                />
                <span>Serviço opcional (10%)</span>
              </label>
              <span className="font-mono tabular-nums text-stone-900 font-medium">
                R$ {pedidoAtivo ? pedidoAtivo.taxaServicoValor.toFixed(2) : '0,00'}
              </span>
            </div>}

            <div className="flex justify-between items-baseline pt-2 border-t border-stone-200">
              <span className="text-sm font-bold text-stone-900">Total a cobrar</span>
              <span className="text-xl font-bold font-mono text-emerald-900 tabular-nums">
                R$ {pedidoAtivo ? pedidoAtivo.total.toFixed(2) : '0,00'}
              </span>
            </div>
          </div>

          {/* Débito e crédito ficam separados para aplicar as taxas da maquininha por modalidade. */}
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
              {canalAtendimento === 'balcao' ? 'Forma de pagamento' : 'Como o cliente vai pagar?'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setMetodoPagamentoSelecionado('Pix')}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                  metodoPagamentoSelecionado === 'Pix'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>Pix</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPagamentoSelecionado('Cartão de Débito')}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                  metodoPagamentoSelecionado === 'Cartão de Débito'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPagamentoSelecionado('Cartão de Crédito')}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                  metodoPagamentoSelecionado === 'Cartão de Crédito'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-700" />
                <span>Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPagamentoSelecionado('Dinheiro')}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                  metodoPagamentoSelecionado === 'Dinheiro'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-700" />
                <span>Dinheiro</span>
              </button>
            </div>
            <p className="mt-1 text-[10px] text-stone-500">
              A taxa da maquininha poderá ser calculada separadamente para débito e crédito.
            </p>
          </div>

          {/* Botão de Fechamento com Gatilho Automático */}
          <button
            onClick={handleConfirmarPagamento}
            disabled={!pedidoAtivo || pedidoAtivo.itens.length === 0 || !pedidoPodeSerPago}
            className="w-full mt-4 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{canalAtendimento === 'balcao' ? 'Registrar pagamento' : 'Fechar comanda e cobrar'}</span>
          </button>

          <div className="mt-2 text-[10px] text-stone-500 leading-tight flex items-start gap-1">
            <Info className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
            <span>
              {canalAtendimento === 'balcao'
                ? 'Envie o pedido à cozinha. Quando ficar pronto ou for entregue, registre o pagamento; o estoque será baixado conforme a Ficha Técnica.'
                : 'Ao pagar, a comanda é encerrada, a mesa é liberada, o caixa recebe o valor e o estoque é baixado conforme a Ficha Técnica.'}
            </span>
          </div>
        </div>
      </section>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={pedidoDrawerAberto}
        onClick={() => setPedidoDrawerAberto(true)}
        className="fixed inset-x-4 bottom-[4.5rem] z-30 flex items-center justify-between rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-900 md:hidden"
      >
        <span>
          {canalAtendimento === 'balcao'
            ? pedidoAtivo?.status === 'aberto'
              ? 'Enviar à cozinha'
              : pedidoPodeSerPago
                ? 'Cobrar pedido'
                : 'Pedido enviado'
            : 'Ver pedido'}
          <span className="ml-1 text-xs font-normal text-emerald-100">
            ({pedidoAtivo?.itens.reduce((total, item) => total + item.quantidade, 0) || 0} itens)
          </span>
        </span>
        <span className="font-mono tabular-nums">
          R$ {pedidoAtivo ? pedidoAtivo.total.toFixed(2) : '0,00'}
        </span>
      </button>
      {confirmacaoExclusao && (
        <ConfirmDeleteDialog
          title={confirmacaoExclusao.tipo === 'mesa' ? 'Deseja mesmo excluir esta mesa?' : 'Deseja mesmo cancelar este pedido?'}
          description={confirmacaoExclusao.tipo === 'mesa'
            ? `A mesa "${confirmacaoExclusao.nome}" será removida do cadastro. Só é possível excluir mesas livres e sem comanda aberta; os pedidos anteriores permanecerão no histórico.`
            : `O pedido "${confirmacaoExclusao.nome}" sairá do atendimento e da cozinha. O registro ficará no histórico com o motivo do cancelamento. Pedidos pagos não podem ser cancelados.`}
          reasons={confirmacaoExclusao.tipo === 'mesa'
            ? ['Mesa desativada ou removida do salão', 'Cadastro duplicado', 'Nome ou número cadastrado incorretamente', 'Mudança no layout do salão', 'Outro (informar)']
            : ['Cliente desistiu do pedido', 'Pedido lançado por engano', 'Pedido duplicado', 'Produto indisponível', 'Outro (informar)']}
          confirmLabel={confirmacaoExclusao.tipo === 'mesa' ? 'Excluir mesa' : 'Cancelar pedido'}
          onCancel={() => {
            setConfirmacaoExclusao(null);
            setErroExclusao(null);
          }}
          onConfirm={handleConfirmarExclusao}
          error={erroExclusao}
        />
      )}
    </div>
  );
};
