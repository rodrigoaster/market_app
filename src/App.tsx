import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { CATALOGO, normalizar } from './catalogo'
import { emojiParaProduto } from './emoji'
import { ItemProduto } from './ItemProduto'
import { useAnimatedNumber } from './useAnimatedNumber'
import { usePersistedState } from './usePersistedState'
import { usePwaInstall } from './usePwaInstall'

// Texto livre nos campos (aceita "1,5" e "4,99"); convertido só no cálculo.
type Entrada = { quantidade: string; valor: string }

type Avulso = { id: string; nome: string }

type Estado = {
  entradas: Record<string, Entrada> // por id de produto
  avulsos: Avulso[] // produtos fora do catálogo
}

type Produto = {
  id: string
  nome: string
  categoria: string
  emoji: string
  avulso: boolean
}

const ESTADO_INICIAL: Estado = { entradas: {}, avulsos: [] }
const ENTRADA_VAZIA: Entrada = { quantidade: '', valor: '' }

const PRODUTOS_CATALOGO: Produto[] = CATALOGO.map((p) => ({
  ...p,
  emoji: p.emoji ?? emojiParaProduto(p.nome),
  avulso: false,
}))

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function paraNumero(texto: string): number {
  const n = Number(texto.replace(',', '.'))
  return texto.trim() && Number.isFinite(n) && n >= 0 ? n : 0
}

function formatarQtd(n: number): string {
  return String(Math.round(n * 1000) / 1000).replace('.', ',')
}

function App() {
  const [estado, setEstado] = usePersistedState<Estado>(
    'minha-feira:v1',
    ESTADO_INICIAL,
  )
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'lista'>('todos')
  const [saindo, setSaindo] = useState<Set<string>>(new Set())
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false)
  const [mostrarPwa, setMostrarPwa] = useState(false)

  const pwa = usePwaInstall()

  const { entradas, avulsos } = estado
  const entrada = (id: string) => entradas[id] ?? ENTRADA_VAZIA

  const produtos = useMemo<Produto[]>(
    () => [
      ...PRODUTOS_CATALOGO,
      ...avulsos.map((a) => ({
        ...a,
        categoria: 'Outros',
        emoji: emojiParaProduto(a.nome),
        avulso: true,
      })),
    ],
    [avulsos],
  )

  const termo = normalizar(busca)
  const visiveis = useMemo(
    () =>
      produtos.filter(
        (p) =>
          normalizar(p.nome).includes(termo) &&
          (filtro === 'todos' ||
            paraNumero(entradas[p.id]?.quantidade ?? '') > 0),
      ),
    [produtos, entradas, termo, filtro],
  )

  // Sem busca, em "Todos": agrupa por categoria. Caso contrário, lista plana.
  const grupos = useMemo(() => {
    if (termo || filtro === 'lista') return [{ categoria: '', itens: visiveis }]
    const mapa = new Map<string, Produto[]>()
    for (const p of visiveis) {
      mapa.set(p.categoria, [...(mapa.get(p.categoria) ?? []), p])
    }
    return [...mapa].map(([categoria, itens]) => ({ categoria, itens }))
  }, [visiveis, termo, filtro])

  const { total, qtdProdutos } = useMemo(() => {
    let total = 0
    let qtdProdutos = 0
    for (const p of produtos) {
      const e = entradas[p.id]
      if (!e) continue
      const qtd = paraNumero(e.quantidade)
      if (qtd <= 0) continue
      total += qtd * paraNumero(e.valor)
      qtdProdutos++
    }
    return { total, qtdProdutos }
  }, [produtos, entradas])
  const totalAnimado = useAnimatedNumber(total)

  useEffect(() => {
    if (!confirmandoLimpar) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmandoLimpar(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmandoLimpar])

  // Convida a instalar o PWA: só fora do app instalado, se instalável (Android)
  // ou no iOS (instruções manuais), e se ainda não foi dispensado.
  useEffect(() => {
    if (pwa.standalone || pwa.jaDispensou()) return
    if (!pwa.podeInstalar && !pwa.isIOS) return
    const t = window.setTimeout(() => setMostrarPwa(true), 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwa.standalone, pwa.podeInstalar, pwa.isIOS])

  function fecharPwa() {
    pwa.dispensar()
    setMostrarPwa(false)
  }

  useEffect(() => {
    if (!mostrarPwa) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharPwa()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarPwa])

  async function instalarPwa() {
    await pwa.instalar()
    fecharPwa()
  }

  function atualizarEntrada(id: string, mudanca: Partial<Entrada>) {
    setEstado((atual) => ({
      ...atual,
      entradas: {
        ...atual.entradas,
        [id]: { ...(atual.entradas[id] ?? ENTRADA_VAZIA), ...mudanca },
      },
    }))
  }

  function ajustarQtd(id: string, delta: number) {
    const nova = Math.max(0, paraNumero(entrada(id).quantidade) + delta)
    atualizarEntrada(id, { quantidade: nova > 0 ? formatarQtd(nova) : '' })
  }

  function adicionarAvulso() {
    const nome = busca.trim()
    if (!nome) return
    const id = crypto.randomUUID()
    setEstado((atual) => ({
      avulsos: [...atual.avulsos, { id, nome }],
      entradas: { ...atual.entradas, [id]: { quantidade: '1', valor: '' } },
    }))
  }

  function removerAvulso(id: string) {
    // marca para animar a saída e remove de fato após a transição
    setSaindo((s) => new Set(s).add(id))
    window.setTimeout(() => {
      setEstado((atual) => {
        const entradas = { ...atual.entradas }
        delete entradas[id]
        return {
          avulsos: atual.avulsos.filter((a) => a.id !== id),
          entradas,
        }
      })
      setSaindo((s) => {
        const novo = new Set(s)
        novo.delete(id)
        return novo
      })
    }, 280)
  }

  // Zera as quantidades e remove os avulsos, mas guarda os valores do
  // catálogo como memória de preço para a próxima compra.
  function limparTudo() {
    setConfirmandoLimpar(false)
    setEstado((atual) => {
      const ids = new Set(atual.avulsos.map((a) => a.id))
      const entradas: Record<string, Entrada> = {}
      for (const [id, e] of Object.entries(atual.entradas)) {
        if (!ids.has(id) && e.valor) entradas[id] = { quantidade: '', valor: e.valor }
      }
      return { avulsos: [], entradas }
    })
    setFiltro('todos')
  }

  return (
    <div className="app">
      <header className="cabecalho">
        <div className="cabecalho__topo">
          <span className="cabecalho__icone" aria-hidden="true">
            🛒
          </span>
          <div>
            <h1>Minha Feira</h1>
            <p>Escolha os produtos, informe quantidade e valor</p>
          </div>
        </div>
      </header>

      <div className="busca">
        <label className="busca__campo">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button
              type="button"
              className="busca__limpar"
              aria-label="Limpar busca"
              onClick={() => setBusca('')}
            >
              ✕
            </button>
          )}
        </label>

        <div className="filtros" role="group" aria-label="Filtrar produtos">
          <button
            type="button"
            className={`filtro${filtro === 'todos' ? ' filtro--ativo' : ''}`}
            aria-pressed={filtro === 'todos'}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
          <button
            type="button"
            className={`filtro${filtro === 'lista' ? ' filtro--ativo' : ''}`}
            aria-pressed={filtro === 'lista'}
            onClick={() => setFiltro('lista')}
          >
            Na minha lista ({qtdProdutos})
          </button>
          {qtdProdutos > 0 && (
            <button
              type="button"
              className="botao-limpar"
              onClick={() => setConfirmandoLimpar(true)}
            >
              🗑️ Limpar
            </button>
          )}
        </div>
      </div>

      <main className="lista">
        {visiveis.length === 0 ? (
          termo ? (
            <div className="vazio">
              <span className="vazio__icone" aria-hidden="true">
                🔎
              </span>
              <p className="vazio__titulo">Nenhum produto encontrado</p>
              <p className="vazio__dica">
                Não achou “{busca.trim()}”? Adicione como produto avulso.
              </p>
              <button
                type="button"
                className="botao-avulso"
                onClick={adicionarAvulso}
              >
                <span aria-hidden="true">＋</span> Adicionar “{busca.trim()}”
              </button>
            </div>
          ) : (
            <div className="vazio">
              <span className="vazio__icone" aria-hidden="true">
                🧺
              </span>
              <p className="vazio__titulo">Sua cesta está vazia</p>
              <p className="vazio__dica">
                Toque em + em algum produto do catálogo para começar.
              </p>
            </div>
          )
        ) : (
          grupos.map((g) => (
            <section key={g.categoria || 'resultado'} className="categoria">
              {g.categoria && (
                <h2 className="lista__titulo categoria__titulo">{g.categoria}</h2>
              )}
              <ul>
                {g.itens.map((p) => {
                  const e = entrada(p.id)
                  const qtd = paraNumero(e.quantidade)
                  const temValor = e.valor.trim() !== ''
                  return (
                    <ItemProduto
                      key={p.id}
                      nome={p.nome}
                      emoji={p.emoji}
                      quantidade={e.quantidade}
                      valor={e.valor}
                      subtotal={
                        qtd > 0 && temValor ? qtd * paraNumero(e.valor) : null
                      }
                      ativo={qtd > 0}
                      saindo={saindo.has(p.id)}
                      onAjustar={(delta) => ajustarQtd(p.id, delta)}
                      onQuantidade={(quantidade) =>
                        atualizarEntrada(p.id, { quantidade })
                      }
                      onValor={(valor) => atualizarEntrada(p.id, { valor })}
                      onRemover={p.avulso ? () => removerAvulso(p.id) : undefined}
                    />
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </main>

      <footer className="total">
        <div className="total__info">
          <span className="total__rotulo">Total da compra</span>
          <span className="total__itens">
            {qtdProdutos} {qtdProdutos === 1 ? 'produto' : 'produtos'}
          </span>
        </div>
        <strong className="total__valor">{brl.format(totalAnimado)}</strong>
      </footer>

      {confirmandoLimpar && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmandoLimpar(false)}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="modal__icone" aria-hidden="true">
              🗑️
            </span>
            <h2 id="modal-titulo" className="modal__titulo">
              Limpar a lista?
            </h2>
            <p className="modal__texto">
              Isso vai zerar as quantidades de {qtdProdutos}{' '}
              {qtdProdutos === 1 ? 'produto' : 'produtos'} e remover os itens
              avulsos. Os valores do catálogo ficam salvos para a próxima compra.
            </p>
            <div className="modal__acoes">
              <button
                type="button"
                className="modal__botao modal__botao--cancelar"
                onClick={() => setConfirmandoLimpar(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal__botao modal__botao--confirmar"
                onClick={limparTudo}
              >
                Limpar tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarPwa && (
        <div
          className="modal-overlay"
          onClick={fecharPwa}
          role="presentation"
        >
          <div
            className="modal modal--pwa"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              className="modal__app-icone"
              src="/icons/icon-192.png"
              alt=""
              width={64}
              height={64}
            />
            <h2 id="pwa-titulo" className="modal__titulo">
              Instale a Minha Feira
            </h2>
            <p className="modal__texto">
              Adicione à tela inicial e use como um aplicativo: abre em tela
              cheia, mais rápido e funciona offline.
            </p>

            {pwa.podeInstalar ? (
              <div className="modal__acoes">
                <button
                  type="button"
                  className="modal__botao modal__botao--cancelar"
                  onClick={fecharPwa}
                >
                  Agora não
                </button>
                <button
                  type="button"
                  className="modal__botao modal__botao--instalar"
                  onClick={instalarPwa}
                >
                  📲 Instalar
                </button>
              </div>
            ) : (
              <>
                <ol className="pwa-passos">
                  <li>
                    Toque em <strong>Compartilhar</strong>
                    <span className="pwa-passos__icone" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                          fill="currentColor"
                          d="M12 2l4 4-1.4 1.4L13 5.8V15h-2V5.8L9.4 7.4 8 6l4-4zm-7 9h4v2H7v7h10v-7h-2v-2h4v11H5V11z"
                        />
                      </svg>
                    </span>
                  </li>
                  <li>
                    Escolha <strong>“Adicionar à Tela de Início”</strong>
                  </li>
                </ol>
                <div className="modal__acoes modal__acoes--unica">
                  <button
                    type="button"
                    className="modal__botao modal__botao--cancelar"
                    onClick={fecharPwa}
                  >
                    Entendi
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
