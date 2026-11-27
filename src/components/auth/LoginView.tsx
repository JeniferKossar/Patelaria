import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Store } from 'lucide-react';
import { auth } from '../../firebase';

function getLoginErrorMessage(error: unknown) {
  const code = error instanceof Error && 'code' in error
    ? String(error.code)
    : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'O endereço de e-mail informado não é válido.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos. Confira suas credenciais e tente novamente.';
    case 'auth/user-disabled':
      return 'Este usuário está desativado. Fale com o administrador do sistema.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de acesso. Aguarde um pouco e tente novamente.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao Firebase. Verifique sua conexão com a internet.';
    case 'auth/operation-not-allowed':
      return 'O acesso por e-mail e senha não está habilitado no Firebase Authentication.';
    case 'auth/unauthorized-domain':
      return 'Este domínio não está autorizado nas configurações do Firebase Authentication.';
    default:
      return 'Não foi possível entrar. Verifique as credenciais e tente novamente.';
  }
}

export const LoginView: React.FC<{ authStatusError?: string | null }> = ({ authStatusError }) => {
  const [email, setEmail] = useState('adm@teste.com');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleEntrar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (error) {
      console.error('Não foi possível autenticar o usuário no Firebase.', error);
      setErro(getLoginErrorMessage(error));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5f6f2] p-4 text-stone-800 sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_-32px_rgba(28,45,34,0.28)] lg:min-h-[620px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-emerald-950 p-10 text-white lg:flex xl:p-14">
          <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border border-emerald-700/40" />
          <div className="absolute -right-10 -top-6 h-52 w-52 rounded-full border border-emerald-700/40" />
          <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-emerald-900/70" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">Pastelaria do Altamir</p>
              <p className="text-xs text-emerald-200/75">Gestão do estabelecimento</p>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <span className="mb-5 inline-flex rounded-full border border-emerald-700/80 bg-emerald-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              Acesso seguro
            </span>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Tudo pronto para um ótimo atendimento.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-100/75">
              Acesse os pedidos, acompanhe a cozinha e gerencie o dia a dia da pastelaria em um só lugar.
            </p>
          </div>

          <p className="relative z-10 text-xs text-emerald-200/60">
            Acesso destinado à equipe autorizada do estabelecimento.
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-10 xl:px-16">
          <div className="w-full max-w-sm">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-white">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-stone-900">Pastelaria do Altamir</p>
                <p className="text-xs text-stone-500">Gestão do estabelecimento</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-emerald-800">Bem-vindo(a)</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">Entrar na sua conta</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Use o e-mail e a senha cadastrados no Firebase Authentication.
              </p>
            </div>

            <form onSubmit={handleEntrar} className="space-y-5">
              <label className="block text-sm font-medium text-stone-700" htmlFor="login-email">
                E-mail
                <span className="relative mt-2 block">
                  <Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    required
                    autoFocus
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-xl border border-stone-300 bg-white py-3.5 pl-10 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-stone-700" htmlFor="login-senha">
                Senha
                <span className="relative mt-2 block">
                  <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="login-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full rounded-xl border border-stone-300 bg-white py-3.5 pl-10 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((mostrar) => !mostrar)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-400 transition hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
                  >
                    {mostrarSenha
                      ? <EyeOff aria-hidden="true" className="h-4 w-4" />
                      : <Eye aria-hidden="true" className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {(erro || authStatusError) && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800">
                  {erro || authStatusError}
                </p>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-700/20 disabled:cursor-wait disabled:opacity-70"
              >
                {carregando ? 'Verificando acesso...' : 'Entrar'}
                {!carregando && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-8 flex items-start gap-2.5 border-t border-stone-100 pt-5 text-xs leading-5 text-stone-500">
              <LockKeyhole aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <p>Sua sessão é autenticada pelo Firebase e permanece ativa neste dispositivo até você sair.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
