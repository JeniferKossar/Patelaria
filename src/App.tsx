/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { AppProvider, useApp } from './context/AppContext';
import { LoginView } from './components/auth/LoginView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PedidoView } from './components/pedido/PedidoView';
import { CozinhaView } from './components/cozinha/CozinhaView';
import { EstoqueView } from './components/estoque/EstoqueView';
import { CardapioView } from './components/cardapio/CardapioView';
import { FinancasView } from './components/financas/FinancasView';
import { auth } from './firebase';

const MainLayout: React.FC<{ onSignOut: () => void; authError: string | null }> = ({
  onSignOut,
  authError,
}) => {
  const { moduloAtivo, turnoCaixa, abrirCaixa, dataSyncReady, dataSyncError } = useApp();
  const [fundoInicial, setFundoInicial] = useState('');
  const [erroAbertura, setErroAbertura] = useState<string | null>(null);
  const [mostrarAberturaCaixa, setMostrarAberturaCaixa] = useState(true);

  const handleAbrirCaixa = (event: React.FormEvent) => {
    event.preventDefault();
    const valor = Number(fundoInicial);
    if (fundoInicial.trim() === '' || !Number.isFinite(valor) || valor < 0) {
      setErroAbertura('Informe um valor válido para o fundo de troco.');
      return;
    }
    const resultado = abrirCaixa(valor);
    if (!resultado.sucesso) {
      setErroAbertura(resultado.mensagem);
      return;
    }
    setErroAbertura(null);
    setMostrarAberturaCaixa(false);
  };

  if (!dataSyncReady) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5f6f2]">
        <div role="status" className="flex items-center gap-3 text-sm font-medium text-stone-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-800/20 border-t-emerald-800" />
          Sincronizando dados...
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-[100dvh] w-full overflow-hidden bg-stone-100/70 text-stone-800 font-['Plus_Jakarta_Sans',sans-serif] md:h-dvh md:min-h-0">
      {/* Sidebar de navegação principal (Desktop à esquerda, Dock no Mobile) */}
      <Sidebar />

      {/* Área de conteúdo principal */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          onSolicitarAberturaCaixa={() => setMostrarAberturaCaixa(true)}
          onSignOut={onSignOut}
        />
        {authError && (
          <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 sm:px-6">
            {authError}
          </p>
        )}
        {dataSyncError && (
          <p role="alert" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6">
            {dataSyncError} As alterações ainda não foram confirmadas no SQL Connect.
          </p>
        )}

        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {moduloAtivo === 'pedido' && <PedidoView />}
          {moduloAtivo === 'cozinha' && <CozinhaView />}
          {moduloAtivo === 'estoque' && <EstoqueView />}
          {moduloAtivo === 'cardapio' && <CardapioView />}
          {moduloAtivo === 'financas' && <FinancasView />}
        </main>
      </div>
      {(!turnoCaixa || !turnoCaixa.aberto) && mostrarAberturaCaixa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="abrir-caixa-titulo"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <span className="text-xl font-bold">R$</span>
            </div>
            <h2 id="abrir-caixa-titulo" className="text-xl font-bold text-stone-900">
              {turnoCaixa?.valorEsperado !== undefined ? 'Turno encerrado' : 'Abra o caixa para começar'}
            </h2>
            {turnoCaixa?.valorEsperado !== undefined && turnoCaixa.valorContado !== undefined && (
              <div className={`mt-4 rounded-xl border p-4 text-sm ${turnoCaixa.diferenca === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
                <p className="font-semibold">Conferência do fechamento anterior</p>
                <div className="mt-2 flex justify-between"><span>Contado</span><strong>R$ {turnoCaixa.valorContado.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span>Esperado</span><strong>R$ {turnoCaixa.valorEsperado.toFixed(2)}</strong></div>
                <div className="mt-1 flex justify-between border-t border-current/15 pt-1"><span>Diferença</span><strong>{(turnoCaixa.diferenca ?? 0) < 0 ? '−' : '+'} R$ {Math.abs(turnoCaixa.diferenca ?? 0).toFixed(2)}</strong></div>
              </div>
            )}
            <p className="mt-1 text-sm text-stone-600">
              Informe o dinheiro físico disponível como fundo de troco.
              A abertura libera o atendimento e inicia um novo turno.
            </p>
            <form onSubmit={handleAbrirCaixa} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-stone-700">
                Fundo de maneio / troco (R$)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  required
                  value={fundoInicial}
                  onChange={(event) => setFundoInicial(event.target.value)}
                  placeholder="Ex.: 150,00"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 font-mono text-lg focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              {erroAbertura && <p role="alert" className="text-sm text-red-700">{erroAbertura}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Registrar abertura e iniciar turno
              </button>
              <button
                type="button"
                onClick={() => setMostrarAberturaCaixa(false)}
                className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Abrir depois
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregandoAutenticacao, setCarregandoAutenticacao] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(
    auth,
    (usuarioAutenticado) => {
      setUsuario(usuarioAutenticado);
      setAuthError(null);
      setCarregandoAutenticacao(false);
    },
    (error) => {
      console.error('Não foi possível verificar a sessão do Firebase.', error);
      setAuthError('Não foi possível verificar sua sessão. Atualize a página ou tente entrar novamente.');
      setCarregandoAutenticacao(false);
    }
  ), []);

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Não foi possível encerrar a sessão do Firebase.', error);
      setAuthError('Não foi possível encerrar sua sessão. Tente novamente.');
    }
  };

  if (carregandoAutenticacao) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5f6f2]">
        <div role="status" className="flex items-center gap-3 text-sm font-medium text-stone-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-800/20 border-t-emerald-800" />
          Verificando sessão...
        </div>
      </main>
    );
  }

  if (!usuario) {
    return <LoginView authStatusError={authError} />;
  }

  return (
    <AppProvider userId={usuario.uid}>
      <MainLayout onSignOut={handleSignOut} authError={authError} />
    </AppProvider>
  );
}
