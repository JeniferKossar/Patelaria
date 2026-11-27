import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Users, Plus, ChefHat, AlertTriangle, LogOut } from 'lucide-react';
import { ModuloAtivo } from '../../types';

interface HeaderProps {
  onSolicitarAberturaCaixa: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSolicitarAberturaCaixa, onSignOut }) => {
  const {
    moduloAtivo,
    setModuloAtivo,
    mesas,
    pedidos,
    insumos,
    currentTimeString,
    abrirMesa,
    turnoCaixa,
    canalAtendimento,
    criarPedidoBalcao,
    setCanalAtendimento,
  } = useApp();

  const mesasOcupadas = mesas.filter((m) => m.status !== 'livre').length;
  const pedidosCozinha = pedidos.filter(
    (p) => p.status === 'na_fila' || p.status === 'em_preparo'
  ).length;
  const insumosCriticos = insumos.filter(
    (i) => i.estoqueAtual <= i.estoqueMinimo
  ).length;

  const moduloTitulos: Record<ModuloAtivo, { titulo: string; subtitulo: string }> = {
    pedido: {
      titulo: 'Atendimento & Salão',
      subtitulo: 'Abertura rápida de mesas, lançamento de pastéis e fechamento de conta.',
    },
    cozinha: {
      titulo: 'Fila da Cozinha (Kanban)',
      subtitulo: 'Acompanhe a produção do salão da primeira etapa de fritura até a entrega.',
    },
    estoque: {
      titulo: 'Controle de Estoque & Insumos',
      subtitulo: 'Monitoramento de insumos, entradas formais de mercadoria e baixa automática.',
    },
    cardapio: {
      titulo: 'Cardápio & Fichas Técnicas',
      subtitulo: 'Cadastre produtos com ficha técnica obrigatória e calcule CMV e margem em tempo real.',
    },
    financas: {
      titulo: 'Gestão Financeira & Caixa',
      subtitulo: 'Fluxo de caixa diário com Pix, débito, crédito e dinheiro separados.',
    },
  };

  const handleAbrirMesaLivre = () => {
    if (moduloAtivo === 'pedido' && canalAtendimento === 'balcao') {
      criarPedidoBalcao('Novo pedido');
      return;
    }
    const primeiraLivre = mesas.find((m) => m.status === 'livre');
    if (primeiraLivre) {
      abrirMesa(primeiraLivre.numero, Math.min(2, primeiraLivre.capacidade));
      setModuloAtivo('pedido');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
      {/* Zone 1: Breadcrumb and Active View */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>Pastelaria do Altamir</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-emerald-800 capitalize">{moduloAtivo}</span>
          </div>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-stone-900 truncate">
            {moduloTitulos[moduloAtivo].titulo}
          </h1>
        </div>
      </div>

      {/* Zone 2: Fast Telemetry indicators (Salão, Cozinha, Horário) */}
      <div className="hidden lg:flex items-center gap-5 text-xs text-stone-600">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-100/80">
          <Users className="w-3.5 h-3.5 text-stone-500" />
          <span>Salão:</span>
          <strong className="font-semibold text-stone-900 tabular-nums">
            {mesasOcupadas}/{mesas.length} mesas
          </strong>
        </div>

        {pedidosCozinha > 0 && (
          <button
            onClick={() => setModuloAtivo('cozinha')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors"
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-700" />
            <span>Na cozinha:</span>
            <strong className="font-semibold tabular-nums">{pedidosCozinha} pedidos</strong>
          </button>
        )}

        {insumosCriticos > 0 && (
          <button
            onClick={() => setModuloAtivo('estoque')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Estoque baixo:</span>
            <strong className="font-semibold tabular-nums">{insumosCriticos} insumos</strong>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-stone-500">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span className="tabular-nums font-mono text-[13px] text-stone-700">{currentTimeString}</span>
        </div>
      </div>

      {/* Zone 3: Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sair da conta"
          title="Sair da conta"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100"
        >
          <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
        {(!turnoCaixa || !turnoCaixa.aberto) && (
          <button
            type="button"
            onClick={onSolicitarAberturaCaixa}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 px-3.5 py-1.5 text-xs font-medium text-emerald-900 transition-colors hover:bg-emerald-50"
          >
            Abrir caixa
          </button>
        )}
        <button
          type="button"
          disabled={!turnoCaixa?.aberto || (moduloAtivo === 'pedido' && canalAtendimento === 'balcao' ? false : !mesas.some((mesa) => mesa.status === 'livre'))}
          onClick={() => {
            if (moduloAtivo === 'pedido' && canalAtendimento === 'balcao') {
              setCanalAtendimento('balcao');
            }
            handleAbrirMesaLivre();
          }}
          title={turnoCaixa?.aberto ? 'Abrir uma mesa livre' : 'Abra o caixa antes de abrir mesas'}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{moduloAtivo === 'pedido' && canalAtendimento === 'balcao' ? 'Novo Pedido' : 'Abrir Mesa'}</span>
        </button>
      </div>
    </header>
  );
};
