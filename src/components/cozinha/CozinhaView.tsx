import React from 'react';
import { useApp } from '../../context/AppContext';
import { Pedido } from '../../types';
import {
  ChefHat,
  Clock,
  Play,
  CheckCircle2,
  UtensilsCrossed,
  Volume2,
} from 'lucide-react';

export const CozinhaView: React.FC = () => {
  const { pedidos, avancarStatusCozinha } = useApp();

  // Pedidos ativos da cozinha (exclui pagos ou que ainda estão em edição 'aberto')
  const pedidosCozinha = pedidos.filter(
    (p) => p.status === 'na_fila' || p.status === 'em_preparo' || p.status === 'pronto'
  );

  const naFila = pedidosCozinha.filter((p) => p.status === 'na_fila');
  const emPreparo = pedidosCozinha.filter((p) => p.status === 'em_preparo');
  const prontos = pedidosCozinha.filter((p) => p.status === 'pronto');

  const tempoMedioPreparoMin = 11;

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext fallback
    }
  };

  const handleAvancar = (pedidoId: string) => {
    playChime();
    avancarStatusCozinha(pedidoId);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 pb-20 md:pb-6 bg-stone-50/60 overflow-y-auto">
      {/* CABEÇALHO DO KANBAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Cada pedido no seu tempo.
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              Ao vivo
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Acompanhe a produção do salão da primeira etapa até a entrega, sem comandas de papel.
          </p>
        </div>

        {/* Métricas */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-white px-3.5 py-2 rounded-xl border border-stone-200 text-xs">
            <div>
              <span className="text-stone-500 block text-[11px]">Em produção:</span>
              <strong className="font-bold text-stone-900 tabular-nums">
                {pedidosCozinha.length} pedidos
              </strong>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div>
              <span className="text-stone-500 block text-[11px]">Tempo médio:</span>
              <strong className="font-bold text-stone-900 tabular-nums">
                {tempoMedioPreparoMin} min
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* RAIS DO KANBAN (3 COLUNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 items-start">
        {/* COLUNA 1: NA FILA */}
        <div className="bg-white/80 rounded-xl border border-stone-200 flex flex-col h-full shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Na Fila
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200">
              {naFila.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {naFila.map((pedido) => (
              <PedidoKanbanCard
                key={pedido.id}
                pedido={pedido}
                etapa="na_fila"
                onAvancar={() => handleAvancar(pedido.id)}
              />
            ))}

            {naFila.length === 0 && (
              <div className="py-12 text-center text-stone-400 text-xs">
                Nenhum pedido aguardando na fila.
                <p className="text-[11px] text-stone-400 mt-1">
                  Novos pedidos do salão aparecem aqui automaticamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 2: EM PREPARO */}
        <div className="bg-white/80 rounded-xl border border-amber-200 flex flex-col h-full shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-amber-100 flex items-center justify-between bg-amber-50/60">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Em Preparo (Fritando)
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
              {emPreparo.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {emPreparo.map((pedido) => (
              <PedidoKanbanCard
                key={pedido.id}
                pedido={pedido}
                etapa="em_preparo"
                onAvancar={() => handleAvancar(pedido.id)}
              />
            ))}

            {emPreparo.length === 0 && (
              <div className="py-12 text-center text-stone-400 text-xs">
                Nenhum pedido no fogão no momento.
                <p className="text-[11px] text-stone-400 mt-1">
                  Inicie o preparo dos itens da fila para monitorar o tempo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 3: PRONTOS */}
        <div className="bg-white/80 rounded-xl border border-emerald-200 flex flex-col h-full shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/60">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Prontos para Entrega
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
              {prontos.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {prontos.map((pedido) => (
              <PedidoKanbanCard
                key={pedido.id}
                pedido={pedido}
                etapa="pronto"
                onAvancar={() => handleAvancar(pedido.id)}
              />
            ))}

            {prontos.length === 0 && (
              <div className="py-12 text-center text-stone-400 text-xs">
                Nenhum pastel aguardando retirada.
                <p className="text-[11px] text-stone-400 mt-1">
                  Quando finalizar o preparo, o garçom será notificado aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RODAPÉ EXPLICATIVO DA ARQUITETURA */}
      <div className="mt-6 p-3.5 rounded-lg bg-stone-100/80 border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>
            <strong>Da cozinha ao caixa:</strong> Pedidos seguem direto para entrega no salão. A baixa de insumos no estoque é consolidada assim que a conta é paga.
          </span>
        </div>
        <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
          Sincronização em tempo real
        </span>
      </div>
    </div>
  );
};

interface PedidoKanbanCardProps {
  pedido: Pedido;
  etapa: 'na_fila' | 'em_preparo' | 'pronto';
  onAvancar: () => void;
}

const PedidoKanbanCard: React.FC<PedidoKanbanCardProps> = ({
  pedido,
  etapa,
  onAvancar,
}) => {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-3.5 shadow-2xs hover:border-stone-300 transition-all">
      {/* Topo do Card */}
      <div className="flex items-start justify-between border-b border-stone-100 pb-2 mb-2.5">
        <div>
          <span className="text-sm font-bold text-stone-900">
            {pedido.canal === 'balcao'
              ? `Balcão · ${pedido.identificacaoBalcao || 'Para levar'}`
              : pedido.mesaNumero !== undefined
                ? `Mesa ${pedido.mesaNumero.toString().padStart(2, '0')}`
                : 'Pedido'}
          </span>
          <span className="text-xs font-mono text-stone-500 block">
            Pedido #{pedido.numeroSequencial}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-medium text-stone-600 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3 text-stone-400" />
            {etapa === 'na_fila' && (pedido.horarioEnvioCozinha || pedido.horarioCriacao)}
            {etapa === 'em_preparo' && (pedido.horarioInicioPreparo || 'Em andamento')}
            {etapa === 'pronto' && (pedido.horarioPronto || 'Pronto')}
          </span>
          {pedido.canal !== 'balcao' && pedido.pessoas !== undefined && (
            <span className="text-[10px] text-stone-400 block mt-0.5">
              {pedido.pessoas} pessoas
            </span>
          )}
        </div>
      </div>

      {/* Lista de Itens do Pedido */}
      <div className="space-y-1.5 my-2">
        {pedido.itens.map((item) => (
          <div key={item.id} className="text-xs">
            <div className="flex items-center justify-between text-stone-800">
              <span className="font-semibold">
                {item.quantidade}x {item.nome}
              </span>
            </div>
            {item.observacoes && (
              <p className="text-[11px] text-amber-900 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/50 mt-0.5 italic">
                {item.observacoes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Botão de Ação do Kanban */}
      <div className="mt-3 pt-2.5 border-t border-stone-100">
        {etapa === 'na_fila' && (
          <button
            onClick={onAvancar}
            className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Iniciar preparo</span>
          </button>
        )}

        {etapa === 'em_preparo' && (
          <button
            onClick={onAvancar}
            className="w-full py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Marcar como pronto</span>
          </button>
        )}

        {etapa === 'pronto' && (
          <button
            onClick={onAvancar}
            className="w-full py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Confirmar entrega no salão</span>
          </button>
        )}
      </div>
    </div>
  );
};
