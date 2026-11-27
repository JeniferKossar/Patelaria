import React from 'react';
import { useApp } from '../../context/AppContext';
import { ModuloAtivo } from '../../types';
import {
  UtensilsCrossed,
  ChefHat,
  Package,
  BookOpen,
  TrendingUp,
  Store,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  id: ModuloAtivo;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { moduloAtivo, setModuloAtivo, pedidos, insumos } = useApp();

  const pedidosNaCozinha = pedidos.filter(
    (p) => p.status === 'na_fila' || p.status === 'em_preparo'
  ).length;

  const insumosAlerta = insumos.filter(
    (i) => i.estoqueAtual <= i.estoqueMinimo
  ).length;

  const navItems: NavItem[] = [
    { id: 'pedido', label: 'Pedido', icon: UtensilsCrossed },
    { id: 'cozinha', label: 'Cozinha', icon: ChefHat, badge: pedidosNaCozinha > 0 ? pedidosNaCozinha : undefined },
    { id: 'estoque', label: 'Estoque', icon: Package, badge: insumosAlerta > 0 ? insumosAlerta : undefined },
    { id: 'cardapio', label: 'Cardápio', icon: BookOpen },
    { id: 'financas', label: 'Finanças', icon: TrendingUp },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-16 xl:w-64 flex-col bg-stone-900 text-stone-300 border-r border-stone-800 shrink-0 select-none">
        {/* Brand Area */}
        <div className="flex justify-center border-b border-stone-800 p-4 xl:justify-start xl:p-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div className="hidden xl:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-base font-['Plus_Jakarta_Sans']">
                  mesa viva
                </span>
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  ERP
                </span>
              </div>
              <p className="text-xs text-stone-400">Pastelaria do Altamir</p>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="hidden px-5 pt-5 pb-2 text-[11px] font-medium tracking-wider text-stone-400 uppercase xl:block">
          Gestão Operacional
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-3 space-y-1 xl:px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = moduloAtivo === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setModuloAtivo(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`relative w-full flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-150 xl:justify-between xl:px-3 ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-stone-400'}`} />
                  <span className="hidden xl:inline">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`absolute right-0 top-0 rounded-full px-1.5 py-0.5 text-[10px] font-mono font-medium xl:static xl:px-2 xl:text-xs ${
                      isActive
                        ? 'bg-emerald-700 text-emerald-100'
                        : item.id === 'cozinha'
                        ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50'
                        : 'bg-red-900/60 text-red-200 border border-red-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Informative Card */}
        <div className="m-3 hidden rounded-lg border border-stone-700/50 bg-stone-800/80 p-4 text-xs xl:block">
          <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fluxo Automatizado</span>
          </div>
          <p className="text-stone-400 leading-relaxed text-[11px]">
            Cardápio cria insumo no Estoque. Venda no Pedido baixa ingredientes e alimenta o Caixa.
          </p>
        </div>

        {/* User / Operator Card */}
        <div className="hidden items-center justify-between border-t border-stone-800 p-4 xl:flex">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700 flex items-center justify-center font-semibold text-xs">
              AD
            </div>
            <div className="text-xs">
              <p className="font-medium text-white">Administrador</p>
              <p className="text-stone-400 text-[11px]">Perfil de demonstração</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = moduloAtivo === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setModuloAtivo(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute -top-1 right-1 w-4 h-4 bg-amber-500 text-stone-900 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
