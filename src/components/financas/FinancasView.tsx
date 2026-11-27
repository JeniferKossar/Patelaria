import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MetodoPagamento } from '../../types';
import {
  Download,
  Plus,
  QrCode,
  CreditCard,
  Banknote,
  AlertCircle,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  LockKeyhole,
} from 'lucide-react';

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDataOcorrencia(dataOcorrencia?: string, dataHora?: string) {
  if (dataOcorrencia && /^\d{4}-\d{2}-\d{2}$/.test(dataOcorrencia)) return dataOcorrencia;
  const dataHoraCompleta = dataHora?.match(/^(\d{4}-\d{2}-\d{2})/);
  return dataHoraCompleta?.[1] || null;
}

export const FinancasView: React.FC = () => {
  const {
    transacoes,
    pedidos,
    mesas,
    turnoCaixa,
    valorEsperadoGaveta,
    fecharCaixa,
    registrarMovimentacaoCaixa,
    adicionarDespesaManual,
    excluirTransacaoFinanceira,
    exportarExtratoCSV,
  } = useApp();

  const [modalNovaDespesa, setModalNovaDespesa] = useState(false);
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState('Insumos & Mercadorias');
  const [metodoDespesa, setMetodoDespesa] = useState<MetodoPagamento>('Pix');
  const [valorDespesa, setValorDespesa] = useState('');
  const [dataDespesa, setDataDespesa] = useState(getLocalDate);
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
  const [valorContado, setValorContado] = useState('');
  const [resultadoFechamento, setResultadoFechamento] = useState<string | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida' | null>(null);
  const [descricaoMovimentacao, setDescricaoMovimentacao] = useState('');
  const [valorMovimentacao, setValorMovimentacao] = useState('');
  const [dataMovimentacao, setDataMovimentacao] = useState(getLocalDate);
  const [erroMovimentacao, setErroMovimentacao] = useState<string | null>(null);
  const [periodoExtrato, setPeriodoExtrato] = useState<'all' | 'month' | '7days' | 'custom' | 'undated'>('all');
  const [dataInicioExtrato, setDataInicioExtrato] = useState(() => `${getLocalDate().slice(0, 7)}-01`);
  const [dataFimExtrato, setDataFimExtrato] = useState(getLocalDate);

  const transacoesTurno = turnoCaixa
    ? transacoes.filter((transacao) => transacao.turnoId === turnoCaixa.id)
    : [];
  const vendasTurno = transacoesTurno.filter((transacao) => transacao.origem === 'pedido_fechado');
  const totalEntradas = vendasTurno
    .reduce((acc, t) => acc + t.valor, 0);

  const totalSaidas = transacoesTurno
    .filter((t) => t.tipo === 'saida')
    .reduce((acc, t) => acc + t.valor, 0);

  const saidasGaveta = transacoesTurno
    .filter((t) =>
      t.tipo === 'saida' &&
      (t.metodo === 'Dinheiro' || t.categoria === 'Insumos & Mercadorias')
    )
    .reduce((acc, t) => acc + t.valor, 0);

  const resultadoOperacional = totalEntradas - totalSaidas;

  const totalPedidosFechados = vendasTurno.length;
  const totalDespesasPagas = transacoesTurno.filter((t) => t.tipo === 'saida').length;

  // Quebra por Método de Pagamento
  const entradasPix = vendasTurno
    .filter((t) => t.metodo === 'Pix')
    .reduce((acc, t) => acc + t.valor, 0);

  const entradasDebito = vendasTurno
    .filter((t) => t.metodo === 'Cartão de Débito')
    .reduce((acc, t) => acc + t.valor, 0);

  const entradasCredito = vendasTurno
    .filter((t) => t.metodo === 'Cartão de Crédito')
    .reduce((acc, t) => acc + t.valor, 0);

  const entradasCartaoLegado = vendasTurno
    .filter((t) => t.metodo === 'Cartão')
    .reduce((acc, t) => acc + t.valor, 0);

  const entradasCartao = entradasDebito + entradasCredito + entradasCartaoLegado;

  const entradasDinheiro = vendasTurno
    .filter((t) => t.metodo === 'Dinheiro')
    .reduce((acc, t) => acc + t.valor, 0);

  // Mesas abertas ainda não recebidas (alerta)
  const pedidosAbertos = pedidos.filter((p) => p.status !== 'pago' && p.status !== 'cancelado' && p.total > 0);
  const totalEmAberto = pedidosAbertos.reduce((acc, p) => acc + p.total, 0);

  const transacoesExtrato = transacoes.filter((transacao) => {
    const data = getDataOcorrencia(transacao.dataOcorrencia, transacao.dataHora);
    if (periodoExtrato === 'all') return true;
    if (periodoExtrato === 'undated') return data === null;
    if (!data) return false;
    if (periodoExtrato === 'month') return data.slice(0, 7) === getLocalDate().slice(0, 7);
    if (periodoExtrato === '7days') {
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - 6);
      const inicioFormatado = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-${String(inicio.getDate()).padStart(2, '0')}`;
      return data >= inicioFormatado && data <= getLocalDate();
    }
    return data >= dataInicioExtrato && data <= dataFimExtrato;
  });
  const descricaoPeriodoExtrato = periodoExtrato === 'all'
    ? 'Todas as datas'
    : periodoExtrato === 'month'
      ? 'Mês atual'
      : periodoExtrato === '7days'
        ? 'Últimos 7 dias'
        : periodoExtrato === 'undated'
          ? 'Sem data'
          : `${new Date(`${dataInicioExtrato}T00:00:00`).toLocaleDateString('pt-BR')} a ${new Date(`${dataFimExtrato}T00:00:00`).toLocaleDateString('pt-BR')}`;

  const handleSalvarDespesa = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorDespesa);
    if (!descricaoDespesa.trim() || isNaN(val) || val <= 0) return;

    adicionarDespesaManual({
      descricao: descricaoDespesa.trim(),
      categoria: categoriaDespesa,
      metodo: metodoDespesa,
      valor: val,
      dataOcorrencia: dataDespesa,
    });

    setModalNovaDespesa(false);
    setDescricaoDespesa('');
    setValorDespesa('');
    setDataDespesa(getLocalDate());
  };

  const handleFecharCaixa = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorContado.trim() === '' || !Number.isFinite(Number(valorContado)) || Number(valorContado) < 0) {
      setResultadoFechamento('Informe o valor contado, igual ou maior que zero.');
      return;
    }
    const resultado = fecharCaixa(Number(valorContado));
    if (!resultado.sucesso) {
      setResultadoFechamento(resultado.mensagem);
      return;
    }
    setResultadoFechamento(resultado.mensagem);
    setModalFechamentoAberto(false);
    setValorContado('');
  };

  const handleSalvarMovimentacao = (event: React.FormEvent) => {
    event.preventDefault();
    const valor = Number(valorMovimentacao);
    if (!tipoMovimentacao || !descricaoMovimentacao.trim() || !Number.isFinite(valor) || valor <= 0) {
      setErroMovimentacao('Informe uma descrição e um valor maior que zero.');
      return;
    }
    registrarMovimentacaoCaixa(tipoMovimentacao, descricaoMovimentacao, valor, dataMovimentacao);
    setTipoMovimentacao(null);
    setDescricaoMovimentacao('');
    setValorMovimentacao('');
    setDataMovimentacao(getLocalDate());
    setErroMovimentacao(null);
  };

  const handleExcluirTransacao = (id: string, descricao: string, pedidoId?: string) => {
    const avisoVinculo = pedidoId
      ? '\n\nAtenção: isso remove apenas o lançamento financeiro. O pedido e as baixas de estoque não serão revertidos.'
      : '';
    if (confirm(`Excluir o lançamento "${descricao}" do histórico?${avisoVinculo}`)) {
      excluirTransacaoFinanceira(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 pb-20 md:pb-6 bg-stone-50/60">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Caixa do turno
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Gaveta, retiradas e conferência do turno em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportarExtratoCSV(transacoesExtrato, descricaoPeriodoExtrato)}
            disabled={transacoesExtrato.length === 0}
            title={`Exportar ${transacoesExtrato.length} lançamentos do período selecionado`}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar período ({transacoesExtrato.length})</span>
          </button>

          <button
            onClick={() => {
              setDataDespesa(getLocalDate());
              setModalNovaDespesa(true);
            }}
            disabled={!turnoCaixa?.aberto}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Movimentação</span>
          </button>
        </div>
      </div>

      <section className="mb-5 rounded-2xl bg-emerald-950 p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-200">Dinheiro esperado na gaveta</p>
            <p className="mt-2 font-mono text-4xl font-bold tabular-nums sm:text-5xl">
              R$ {turnoCaixa?.aberto ? valorEsperadoGaveta.toFixed(2) : '0,00'}
            </p>
            <p className="mt-2 text-xs text-emerald-200">
              {turnoCaixa?.aberto
                ? `Fundo inicial: R$ ${turnoCaixa.fundoInicial.toFixed(2)} · ${totalPedidosFechados} pedidos recebidos neste turno`
                : 'Caixa fechado. Abra um turno para iniciar as operações.'}
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
            <button
              type="button"
              disabled={!turnoCaixa?.aberto}
              onClick={() => {
                setDataMovimentacao(getLocalDate());
                setErroMovimentacao(null);
                setTipoMovimentacao('saida');
              }}
              className="flex min-h-20 items-center gap-3 rounded-xl bg-white px-5 py-4 text-left font-semibold text-red-800 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUpFromLine className="h-6 w-6" />
              <span><span className="block text-base">Sangria</span><span className="text-xs font-normal text-stone-500">Retirada da gaveta</span></span>
            </button>
            <button
              type="button"
              disabled={!turnoCaixa?.aberto}
              onClick={() => {
                setDataMovimentacao(getLocalDate());
                setErroMovimentacao(null);
                setTipoMovimentacao('entrada');
              }}
              className="flex min-h-20 items-center gap-3 rounded-xl bg-white px-5 py-4 text-left font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownToLine className="h-6 w-6" />
              <span><span className="block text-base">Suprimento</span><span className="text-xs font-normal text-stone-500">Adicionar troco</span></span>
            </button>
            <button
              type="button"
              disabled={!turnoCaixa?.aberto}
              onClick={() => {
                setResultadoFechamento(null);
                setModalFechamentoAberto(true);
              }}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
            >
              <LockKeyhole className="h-4 w-4" />
              Encerrar turno (fechamento cego)
            </button>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-stone-900">Dinheiro físico</h3>
          <p className="mb-4 text-xs text-stone-500">Movimenta o saldo e a conferência da gaveta.</p>
          <div className="flex items-center justify-between border-b border-stone-100 py-2 text-sm">
            <span>Vendas em dinheiro</span><strong className="font-mono">R$ {entradasDinheiro.toFixed(2)}</strong>
          </div>
          <div className="flex items-center justify-between border-b border-stone-100 py-2 text-sm">
            <span>Saídas que afetam a gaveta</span><strong className="font-mono text-red-700">− R$ {saidasGaveta.toFixed(2)}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
            <span>Insumos e despesas em dinheiro são deduzidos automaticamente.</span>
            <strong className="text-stone-700">{totalDespesasPagas} saídas</strong>
          </div>
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-stone-900">Recebimentos digitais</h3>
          <p className="mb-4 text-xs text-stone-500">Entram na conta bancária e não alteram a gaveta.</p>
          <div className="flex items-center justify-between border-b border-stone-100 py-2 text-sm">
            <span className="flex items-center gap-2"><QrCode className="h-4 w-4 text-emerald-700" /> Pix</span>
            <strong className="font-mono">R$ {entradasPix.toFixed(2)}</strong>
          </div>
          <div className="flex items-center justify-between border-b border-stone-100 py-2 text-sm">
            <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-700" /> Cartões</span>
            <strong className="font-mono">R$ {entradasCartao.toFixed(2)}</strong>
          </div>
          <div className="mt-3 flex justify-between text-xs text-stone-500">
            <span>Débito R$ {entradasDebito.toFixed(2)} · Crédito R$ {entradasCredito.toFixed(2)}{entradasCartaoLegado > 0 && ` · Outros R$ ${entradasCartaoLegado.toFixed(2)}`}</span>
            <strong className="text-stone-700">Turno</strong>
          </div>
        </section>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <div>
          <p className="text-xs text-stone-500">Vendas recebidas neste turno</p>
          <p className="text-xl font-bold font-mono text-stone-900">R$ {totalEntradas.toFixed(2)}</p>
          <p className={`text-xs ${resultadoOperacional >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            Resultado após saídas registradas: R$ {resultadoOperacional.toFixed(2)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${turnoCaixa?.aberto ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-600'}`}>
          {turnoCaixa?.aberto ? 'Turno aberto' : 'Turno fechado'}
        </span>
      </div>

      {/* TABELA DE ÚLTIMAS MOVIMENTAÇÕES */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs mb-5">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Últimas Movimentações do Caixa</h3>
            <p className="text-xs text-stone-500">
              Histórico sincronizado a cada pagamento e compra formal
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="text-[11px] font-medium text-stone-600">
              Período
              <select
                value={periodoExtrato}
                onChange={(event) => setPeriodoExtrato(event.target.value as typeof periodoExtrato)}
                className="ml-2 rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs"
              >
                <option value="all">Todas as datas</option>
                <option value="month">Mês atual</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="custom">Personalizado</option>
                <option value="undated">Sem data</option>
              </select>
            </label>
            {periodoExtrato === 'custom' && (
              <>
                <label className="text-[11px] text-stone-600">
                  De
                  <input
                    type="date"
                    value={dataInicioExtrato}
                    max={dataFimExtrato}
                    onChange={(event) => setDataInicioExtrato(event.target.value)}
                    className="ml-1 rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs"
                  />
                </label>
                <label className="text-[11px] text-stone-600">
                  Até
                  <input
                    type="date"
                    value={dataFimExtrato}
                    min={dataInicioExtrato}
                    onChange={(event) => setDataFimExtrato(event.target.value)}
                    className="ml-1 rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs"
                  />
                </label>
              </>
            )}
            <span className="text-xs text-stone-500 font-mono">
              {transacoesExtrato.length} de {transacoes.length} lançamentos
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Data da ocorrência / registro</th>
                <th className="py-3 px-4 font-semibold">Descrição</th>
                <th className="py-3 px-4 font-semibold">Método</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold text-right">Valor</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transacoesExtrato.map((t) => {
                const isEntrada = t.tipo === 'entrada';
                const dataOcorrencia = getDataOcorrencia(t.dataOcorrencia, t.dataHora);
                return (
                  <tr key={t.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-stone-500 whitespace-nowrap">
                      {dataOcorrencia
                        ? new Date(`${dataOcorrencia}T00:00:00`).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                      <span className="block text-[10px] text-stone-400">Registro: {t.dataHora}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{t.descricao}</div>
                      <div className="text-[11px] text-stone-400">{t.categoria}</div>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{t.metodo}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isEntrada
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isEntrada ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      <span className={isEntrada ? 'text-emerald-800' : 'text-red-700'}>
                        {isEntrada ? '+' : '-'} R$ {t.valor.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.origem !== 'abertura_caixa' && t.origem !== 'suprimento' && t.origem !== 'sangria' && (
                        <button
                          type="button"
                          aria-label={`Excluir lançamento: ${t.descricao}`}
                          title="Excluir apenas este lançamento financeiro"
                          onClick={() => handleExcluirTransacao(t.id, t.descricao, t.pedidoId)}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {transacoesExtrato.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-stone-500">
                    Nenhum lançamento encontrado para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALERTA INFERIOR: MESAS ABERTAS AINDA NÃO É RECEITA */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start sm:items-center gap-3">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1">
          <strong>Mesas abertas ainda não é receita:</strong> O salão possui atualmente{' '}
          <strong className="font-mono">
            R$ {totalEmAberto.toFixed(2)}
          </strong>{' '}
          em pedidos abertos ({pedidosAbertos.length} mesas). Este valor não compõe o caixa acima até que a conta seja confirmada no módulo Pedido.
        </div>
      </div>

      {tipoMovimentacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="movimentacao-caixa-titulo"
            className={`w-full max-w-md rounded-xl border border-stone-200 border-t-4 bg-white p-5 shadow-xl ${tipoMovimentacao === 'saida' ? 'border-t-red-700' : 'border-t-emerald-800'}`}
          >
            <h3 id="movimentacao-caixa-titulo" className="text-base font-bold text-stone-900">
              {tipoMovimentacao === 'saida' ? 'Nova sangria' : 'Novo suprimento'}
            </h3>
            <p className="mb-4 mt-1 text-xs text-stone-500">
              {tipoMovimentacao === 'saida'
                ? 'Registre a retirada de dinheiro da gaveta com o mesmo padrão de uma nova movimentação.'
                : 'Registre o dinheiro adicionado à gaveta e informe o motivo.'}
            </p>
            <form onSubmit={handleSalvarMovimentacao} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="movimentacao-motivo" className="mb-1 block font-medium text-stone-700">Motivo *</label>
                <input
                  id="movimentacao-motivo"
                  autoFocus
                  required
                  value={descricaoMovimentacao}
                  onChange={(event) => setDescricaoMovimentacao(event.target.value)}
                  placeholder={tipoMovimentacao === 'saida' ? 'Ex.: pagamento do motoboy' : 'Ex.: reforço de troco'}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="movimentacao-valor" className="mb-1 block font-medium text-stone-700">Valor (R$) *</label>
                <input
                  id="movimentacao-valor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={valorMovimentacao}
                  onChange={(event) => setValorMovimentacao(event.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono font-bold text-stone-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="movimentacao-data" className="mb-1 block font-medium text-stone-700">Data da ocorrência *</label>
                <input
                  id="movimentacao-data"
                  type="date"
                  required
                  value={dataMovimentacao}
                  onChange={(event) => setDataMovimentacao(event.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                />
              </div>
              {erroMovimentacao && <p role="alert" className="text-xs text-red-700">{erroMovimentacao}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTipoMovimentacao(null)} className="rounded-lg px-3.5 py-2 font-medium text-stone-600 hover:bg-stone-100">Cancelar</button>
                <button type="submit" className={`rounded-lg px-4 py-2 font-medium text-white shadow-xs ${tipoMovimentacao === 'saida' ? 'bg-red-700 hover:bg-red-800' : 'bg-emerald-800 hover:bg-emerald-900'}`}>
                  Registrar {tipoMovimentacao === 'saida' ? 'sangria' : 'suprimento'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {modalFechamentoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <section role="dialog" aria-modal="true" aria-labelledby="fechamento-cego-titulo" className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
            <h3 id="fechamento-cego-titulo" className="text-base font-bold text-stone-900">Fechamento cego</h3>
            <p className="mb-4 mt-1 text-sm text-stone-600">
              Conte o dinheiro físico da gaveta e informe o total antes de consultar o valor esperado.
            </p>
            <form onSubmit={handleFecharCaixa} className="space-y-4">
              <label className="block text-sm font-medium text-stone-700">
                Total contado na gaveta (R$)
                <input
                  autoFocus
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={valorContado}
                  onChange={(event) => setValorContado(event.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 font-mono text-lg focus:border-emerald-700 focus:outline-none"
                />
              </label>
              {resultadoFechamento && <p role="alert" className="text-sm text-red-700">{resultadoFechamento}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalFechamentoAberto(false)} className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">Voltar</button>
                <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">Registrar contagem e fechar turno</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL: NOVA DESPESA MANUAL */}
      {modalNovaDespesa && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-stone-200 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">Lançar Saída no Caixa</h3>
            <p className="text-xs text-stone-500 mt-0.5 mb-4">
              Registre compras pontuais de mercado, manutenção de fritadeira, gás ou sangria.
            </p>

            <form onSubmit={handleSalvarDespesa} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Descrição do Pagamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de Óleo de Algodão no Atacadão"
                  value={descricaoDespesa}
                  onChange={(e) => setDescricaoDespesa(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Categoria</label>
                  <select
                    value={categoriaDespesa}
                    onChange={(e) => setCategoriaDespesa(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none bg-white"
                  >
                    <option value="Insumos & Mercadorias">Insumos & Mercadorias</option>
                    <option value="Operacional & Gás">Operacional & Gás</option>
                    <option value="Manutenção & Limpeza">Manutenção & Limpeza</option>
                    <option value="Retirada / Pró-labore">Retirada / Pró-labore</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Método de Pagamento</label>
                  <select
                    value={metodoDespesa}
                    onChange={(e) => setMetodoDespesa(e.target.value as MetodoPagamento)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none bg-white"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Valor da Despesa (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={valorDespesa}
                  onChange={(e) => setValorDespesa(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono font-bold text-stone-900 focus:border-emerald-700 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Data da despesa *</label>
                <input
                  type="date"
                  required
                  value={dataDespesa}
                  onChange={(event) => setDataDespesa(event.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaDespesa(false)}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium shadow-xs"
                >
                  Registrar Saída
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
