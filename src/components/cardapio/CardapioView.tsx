import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Produto, FichaTecnicaItem, UnidadeMedida } from '../../types';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  Percent,
  Pencil,
  Tags,
} from 'lucide-react';
import { RenameItemDialog } from '../common/RenameItemDialog';

export const CardapioView: React.FC = () => {
  const {
    produtos,
    insumos,
    categoriasProduto,
    salvarProdutoComFichaTecnica,
    adicionarCategoriaProduto,
    renomearCategoriaProduto,
    excluirCategoriaProduto,
    renomearProduto,
    excluirProduto,
    alternarStatusProduto,
  } = useApp();

  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string | null>(
    produtos[0]?.id || null
  );

  const [isCriandoNovo, setIsCriandoNovo] = useState(false);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);
  const [produtoParaRenomear, setProdutoParaRenomear] = useState<Produto | null>(null);
  const [erroRenomearProduto, setErroRenomearProduto] = useState<string | null>(null);
  const [mostrarGerenciadorCategorias, setMostrarGerenciadorCategorias] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<string | null>(null);
  const [nomeCategoriaEditando, setNomeCategoriaEditando] = useState('');
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<string | null>(null);
  const [categoriaSubstituta, setCategoriaSubstituta] = useState('');
  const [erroCategorias, setErroCategorias] = useState<string | null>(null);
  const [mensagemCategorias, setMensagemCategorias] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [categoria, setCategoria] = useState('Pastéis Salgados');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tempoPreparoMinutos, setTempoPreparoMinutos] = useState('8');
  const [fichaTecnica, setFichaTecnica] = useState<FichaTecnicaItem[]>([]);
  // Carrega produto para edição
  useEffect(() => {
    if (isCriandoNovo) {
      setNome('');
      setCodigo(`PAS-${Math.floor(100 + Math.random() * 900)}`);
      setCategoria('Pastéis Salgados');
      setPreco('');
      setDescricao('');
      setTempoPreparoMinutos('8');
      setFichaTecnica([]);
    } else {
      const prod = produtos.find((p) => p.id === produtoSelecionadoId) || produtos[0];
      if (prod) {
        setNome(prod.nome);
        setCodigo(prod.codigo || '');
        setCategoria(prod.categoria);
        setPreco(prod.preco.toString());
        setDescricao(prod.descricao);
        setTempoPreparoMinutos(prod.tempoPreparoMinutos.toString());
        setFichaTecnica(prod.fichaTecnica.map((ft) => ({ ...ft })));
      }
    }
  }, [produtoSelecionadoId, isCriandoNovo]);

  const precoVendaNum = parseFloat(preco) || 0;

  const handleAdicionarIngrediente = () => {
    const novoItem: FichaTecnicaItem = {
      ingredienteId: '',
      nome: '',
      quantidade: 0.050,
      unidade: 'kg',
      custoUnitarioEstimado: 0,
    };
    setFichaTecnica((prev) => [...prev, novoItem]);
  };

  const handleRemoverIngrediente = (index: number) => {
    setFichaTecnica(fichaTecnica.filter((_, idx) => idx !== index));
  };

  const handleAlterarInsumoNaLinha = (index: number, insumoId: string) => {
    if (!insumoId) {
      setFichaTecnica((prev) =>
        prev.map((item, idx) => idx === index
          ? { ...item, ingredienteId: '', nome: '', unidade: 'kg', custoUnitarioEstimado: 0 }
          : item)
      );
      return;
    }

    const insumoExistente = insumos.find((i) => i.id === insumoId);
    if (!insumoExistente) return;

    setFichaTecnica((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          ingredienteId: insumoExistente.id,
          nome: insumoExistente.nome,
          unidade: insumoExistente.unidade,
          custoUnitarioEstimado: insumoExistente.custoUnitario,
        };
      })
    );
  };

  const handleAlterarQuantidadeLinha = (index: number, qtd: number) => {
    setFichaTecnica((prev) =>
      prev.map((item, idx) => (idx === index
        ? { ...item, quantidade: item.unidade === 'kg' ? qtd / 1000 : qtd }
        : item))
    );
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || precoVendaNum <= 0) {
      alert('Preencha o nome e o preço de venda do produto.');
      return;
    }

    if (fichaTecnica.length === 0) {
      alert('A ficha técnica é obrigatória para controle de estoque!');
      return;
    }
    if (fichaTecnica.some((item) =>
      !insumos.some((insumo) => insumo.id === item.ingredienteId) ||
      !item.nome?.trim() ||
      item.quantidade <= 0
    )) {
      alert('Cadastre ou selecione um insumo do Estoque e indique uma quantidade maior que zero em cada linha da ficha técnica.');
      return;
    }

    salvarProdutoComFichaTecnica({
      id: isCriandoNovo ? undefined : (produtoSelecionadoId || undefined),
      nome: nome.trim(),
      codigo: codigo.trim(),
      categoria,
      preco: precoVendaNum,
      descricao: descricao.trim(),
      ativo: true,
      tempoPreparoMinutos: parseInt(tempoPreparoMinutos, 10) || 8,
      fichaTecnica,
    });

    setIsCriandoNovo(false);
    setFeedbackSucesso('Produto e ficha técnica salvos com sucesso.');
    setTimeout(() => setFeedbackSucesso(null), 5000);
  };

  const handleRenomearProduto = (novoNome: string) => {
    if (!produtoParaRenomear) return;
    const resultado = renomearProduto(produtoParaRenomear.id, novoNome);
    if (!resultado.sucesso) {
      setErroRenomearProduto(resultado.mensagem);
      return;
    }

    setFeedbackSucesso(resultado.mensagem);
    setErroRenomearProduto(null);
    setProdutoParaRenomear(null);
  };

  const handleAdicionarCategoria = (event: React.FormEvent) => {
    event.preventDefault();
    const nomeCategoria = novaCategoriaNome.trim();
    const resultado = adicionarCategoriaProduto(nomeCategoria);
    if (!resultado.sucesso) {
      setErroCategorias(resultado.mensagem);
      setMensagemCategorias(null);
      return;
    }

    setCategoria(nomeCategoria);
    setNovaCategoriaNome('');
    setErroCategorias(null);
    setMensagemCategorias(resultado.mensagem);
  };

  const handleSalvarNomeCategoria = (nomeAtual: string) => {
    const resultado = renomearCategoriaProduto(nomeAtual, nomeCategoriaEditando);
    if (!resultado.sucesso) {
      setErroCategorias(resultado.mensagem);
      setMensagemCategorias(null);
      return;
    }

    if (categoria === nomeAtual) setCategoria(nomeCategoriaEditando.trim());
    setCategoriaEmEdicao(null);
    setErroCategorias(null);
    setMensagemCategorias(resultado.mensagem);
  };

  const handleExcluirCategoria = () => {
    if (!categoriaParaExcluir) return;
    const resultado = excluirCategoriaProduto(categoriaParaExcluir, categoriaSubstituta || undefined);
    if (!resultado.sucesso) {
      setErroCategorias(resultado.mensagem);
      setMensagemCategorias(null);
      return;
    }

    if (categoria === categoriaParaExcluir) {
      setCategoria(categoriaSubstituta || categoriasProduto.find((item) => item !== categoriaParaExcluir) || '');
    }
    setCategoriaParaExcluir(null);
    setCategoriaSubstituta('');
    setErroCategorias(null);
    setMensagemCategorias(resultado.mensagem);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 pb-20 md:pb-6 bg-stone-50/60 overflow-y-auto">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              O seu sabor, bem organizado.
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              Ficha Técnica Obrigatória
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Cadastre produtos com ficha técnica e calcule cada venda em consumo real e CMV automático.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCriandoNovo(true);
            setProdutoSelecionadoId(null);
          }}
          className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Novo Produto</span>
        </button>
      </div>

      {feedbackSucesso && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedbackSucesso}</span>
          </div>
          <button
            onClick={() => setFeedbackSucesso(null)}
            className="text-stone-400 hover:text-stone-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* CONTAINER DUPLO: LISTA À ESQUERDA + EDITOR À DIREITA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        {/* COLUNA ESQUERDA: LISTA DE PRODUTOS */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-stone-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Produtos Cadastrados ({produtos.length})
            </span>
            <span className="text-[11px] text-stone-400">
              {produtos.filter((p) => p.ativo).length} ativos
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {produtos.map((p) => {
              const isSelected = !isCriandoNovo && p.id === produtoSelecionadoId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setIsCriandoNovo(false);
                    setProdutoSelecionadoId(p.id);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-2xs'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{p.nome}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                      <span>{p.categoria}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{p.fichaTecnica.length} insumos</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Editar nome de ${p.nome}`}
                      title={`Editar nome de ${p.nome}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setErroRenomearProduto(null);
                        setProdutoParaRenomear(p);
                      }}
                      className="rounded p-1.5 text-stone-400 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <div className="text-right">
                      <span className="block text-xs font-mono font-bold tabular-nums text-stone-900">
                        R$ {p.preco.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          alternarStatusProduto(p.id);
                        }}
                        className={`mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          p.ativo
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {p.ativo ? 'Ativo' : 'Pausado'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DO PRODUTO & FICHA TÉCNICA */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
          <form onSubmit={handleSalvar} className="space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {isCriandoNovo ? 'Cadastrar Novo Produto' : `Editando: ${nome || 'Produto'}`}
                </h3>
                <p className="text-xs text-stone-500">
                  A Ficha Técnica é o gatilho que vincula ingredientes ao Estoque.
                </p>
              </div>

              {!isCriandoNovo && produtoSelecionadoId && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este produto do cardápio?')) {
                      excluirProduto(produtoSelecionadoId);
                      setProdutoSelecionadoId(produtos[0]?.id || null);
                    }
                  }}
                  className="text-xs text-stone-400 hover:text-red-600 transition-colors"
                >
                  Excluir produto
                </button>
              )}
            </div>

            {/* DADOS GERAIS DO PRODUTO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-stone-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pastel Especial de Carne com Queijo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Código Interno</label>
                <input
                  type="text"
                  placeholder="Ex: PAS-001"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Categoria *</label>
                <div className="flex gap-2">
                  <select
                    required
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 focus:border-emerald-700 focus:outline-none"
                  >
                    {categoriasProduto.map((categoriaDisponivel) => (
                      <option key={categoriaDisponivel} value={categoriaDisponivel}>
                        {categoriaDisponivel}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setErroCategorias(null);
                      setMensagemCategorias(null);
                      setMostrarGerenciadorCategorias(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <Tags className="h-3.5 w-3.5" />
                    Gerenciar
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Preço de Venda (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono font-bold text-stone-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Tempo Médio Preparo</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={tempoPreparoMinutos}
                    onChange={(e) => setTempoPreparoMinutos(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:border-emerald-700 focus:outline-none"
                  />
                  <span className="text-stone-500 text-xs">min</span>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-medium text-stone-700 mb-1">Descrição no Cardápio</label>
                <textarea
                  rows={2}
                  placeholder="Descrição apetitosa com os ingredientes que compõem o sabor..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            {/* SEÇÃO DA FICHA TÉCNICA (OBRIGATÓRIA) */}
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      Ficha Técnica
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">
                      Obrigatória · Completa
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Selecione insumos já cadastrados no Estoque e informe as quantidades por porção.
                    Para insumos cadastrados em kg, informe a quantidade em gramas.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={insumos.length === 0}
                  onClick={handleAdicionarIngrediente}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 border border-stone-200 rounded text-xs font-medium text-stone-800 flex items-center gap-1 transition-colors self-start"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Adicionar ingrediente</span>
                </button>
              </div>

              {/* Tabela de Ingredientes da Ficha */}
              <div className="space-y-2 mb-3">
                {fichaTecnica.map((item, index) => {
                  const custoTotalItem = item.quantidade * item.custoUnitarioEstimado;
                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded-lg border border-stone-200 text-xs"
                    >
                      <div className="w-full sm:flex-1">
                        <select
                          required
                          value={insumos.some((insumo) => insumo.id === item.ingredienteId) ? item.ingredienteId : ''}
                          onChange={(e) => handleAlterarInsumoNaLinha(index, e.target.value)}
                          className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 font-medium text-stone-900"
                        >
                          <option value="">Selecione um insumo do Estoque...</option>
                          {insumos.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nome} ({i.unidade}) - R$ {i.custoUnitario.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1 w-full sm:w-36">
                        <input
                          type="number"
                          step={item.unidade === 'kg' ? '0.1' : '0.001'}
                          placeholder={item.unidade === 'kg' ? 'Qtd em g' : 'Qtd'}
                          value={item.unidade === 'kg' ? item.quantidade * 1000 : item.quantidade}
                          onChange={(e) =>
                            handleAlterarQuantidadeLinha(index, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 border border-stone-200 rounded font-mono font-medium text-stone-900"
                        />
                        <span className="px-1 font-mono text-xs text-stone-500">{item.unidade === 'kg' ? 'g' : item.unidade}</span>
                      </div>

                      <div className="w-full sm:w-28 text-right font-mono text-stone-600 text-xs tabular-nums">
                        R$ {custoTotalItem.toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoverIngrediente(index)}
                        className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                        title="Remover da ficha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Orientação de cadastro de insumos */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>O ingrediente não aparece na lista?</strong> Cadastre-o primeiro no módulo Estoque. Depois, volte à ficha técnica para selecioná-lo. A ficha técnica só permite usar insumos já cadastrados.
                </div>
              </div>

            </div>

            {/* BOTÕES DE SALVAMENTO */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsCriandoNovo(false);
                  setProdutoSelecionadoId(produtos[0]?.id || null);
                }}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-medium transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Produto & Sincronizar Estoque</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      {mostrarGerenciadorCategorias && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <section role="dialog" aria-modal="true" aria-labelledby="categorias-cardapio-titulo" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="categorias-cardapio-titulo" className="text-base font-bold text-stone-900">Categorias do cardápio</h3>
                <p className="mt-1 text-xs text-stone-500">Crie, renomeie ou exclua categorias. As categorias cadastradas ficam disponíveis no cardápio e nos pedidos.</p>
              </div>
              <button type="button" aria-label="Fechar categorias" onClick={() => setMostrarGerenciadorCategorias(false)} className="rounded px-2 py-1 text-stone-500 hover:bg-stone-100">✕</button>
            </div>

            <form onSubmit={handleAdicionarCategoria} className="mb-4 flex gap-2">
              <input
                required
                maxLength={50}
                value={novaCategoriaNome}
                onChange={(event) => setNovaCategoriaNome(event.target.value)}
                placeholder="Nova categoria (ex.: Sopas)"
                aria-label="Nome da nova categoria"
                className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              />
              <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900">
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </form>

            {erroCategorias && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{erroCategorias}</p>}
            {mensagemCategorias && <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{mensagemCategorias}</p>}

            <div className="space-y-2">
              {categoriasProduto.map((categoriaExistente) => {
                const quantidadeProdutos = produtos.filter((produto) => produto.categoria === categoriaExistente).length;
                return (
                  <div key={categoriaExistente} className="rounded-lg border border-stone-200 p-3">
                    <div className="flex items-center gap-2">
                      {categoriaEmEdicao === categoriaExistente ? (
                        <>
                          <input
                            autoFocus
                            required
                            maxLength={50}
                            value={nomeCategoriaEditando}
                            onChange={(event) => setNomeCategoriaEditando(event.target.value)}
                            aria-label={`Novo nome para ${categoriaExistente}`}
                            className="min-w-0 flex-1 rounded-md border border-stone-200 px-2 py-1.5 text-sm focus:border-emerald-700 focus:outline-none"
                          />
                          <button type="button" onClick={() => handleSalvarNomeCategoria(categoriaExistente)} className="rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800">Salvar</button>
                          <button type="button" onClick={() => setCategoriaEmEdicao(null)} className="rounded-md px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{categoriaExistente}</span>
                          <span className="text-[10px] text-stone-500">{quantidadeProdutos} produto(s)</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoriaEmEdicao(categoriaExistente);
                              setNomeCategoriaEditando(categoriaExistente);
                              setErroCategorias(null);
                            }}
                            aria-label={`Renomear ${categoriaExistente}`}
                            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoriaParaExcluir(categoriaExistente);
                              setCategoriaSubstituta('');
                              setErroCategorias(null);
                            }}
                            disabled={categoriasProduto.length <= 1}
                            aria-label={`Excluir ${categoriaExistente}`}
                            className="rounded-md p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    {categoriaParaExcluir === categoriaExistente && (
                      <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                        <p className="text-xs text-stone-700">
                          Excluir “{categoriaExistente}”?
                          {quantidadeProdutos > 0 && ` ${quantidadeProdutos} produto(s) serão movidos para a categoria selecionada.`}
                        </p>
                        {quantidadeProdutos > 0 && (
                          <select
                            value={categoriaSubstituta}
                            onChange={(event) => setCategoriaSubstituta(event.target.value)}
                            aria-label="Categoria de destino dos produtos"
                            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                          >
                            <option value="">Selecione a categoria de destino...</option>
                            {categoriasProduto.filter((item) => item !== categoriaExistente).map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        )}
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setCategoriaParaExcluir(null)} className="rounded-md px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100">Cancelar</button>
                          <button type="button" onClick={handleExcluirCategoria} disabled={quantidadeProdutos > 0 && !categoriaSubstituta} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">Confirmar exclusão</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end border-t border-stone-100 pt-3">
              <button type="button" onClick={() => setMostrarGerenciadorCategorias(false)} className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800">Concluir</button>
            </div>
          </section>
        </div>
      )}
      {produtoParaRenomear && (
        <RenameItemDialog
          itemType="produto do cardápio"
          currentName={produtoParaRenomear.nome}
          onCancel={() => {
            setProdutoParaRenomear(null);
            setErroRenomearProduto(null);
          }}
          onConfirm={handleRenomearProduto}
          error={erroRenomearProduto}
        />
      )}
    </div>
  );
};
