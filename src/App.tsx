import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import { emojiParaProduto } from './emoji'
import { useAnimatedNumber } from './useAnimatedNumber'
import { usePwaInstall } from './usePwaInstall'

type Product = {
  id: string
  nome: string
  emoji: string
  valor: number // preço unitário
  quantidade: number
}

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function App() {
  const [produtos, setProdutos] = useState<Product[]>([])
  const [saindo, setSaindo] = useState<Set<string>>(new Set())
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false)
  const [mostrarPwa, setMostrarPwa] = useState(false)

  const pwa = usePwaInstall()

  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [quantidade, setQuantidade] = useState('1')

  const total = useMemo(
    () => produtos.reduce((soma, p) => soma + p.valor * p.quantidade, 0),
    [produtos],
  )
  const qtdTotal = useMemo(
    () => produtos.reduce((soma, p) => soma + p.quantidade, 0),
    [produtos],
  )
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const valorNum = Number(valor.replace(',', '.'))
    const qtdNum = Number(quantidade.replace(',', '.'))
    if (!nome.trim() || !Number.isFinite(valorNum) || valorNum < 0) return
    if (!Number.isFinite(qtdNum) || qtdNum <= 0) return

    setProdutos((atual) => [
      {
        id: crypto.randomUUID(),
        nome: nome.trim(),
        emoji: emojiParaProduto(nome.trim()),
        valor: valorNum,
        quantidade: qtdNum,
      },
      ...atual,
    ])
    setNome('')
    setValor('')
    setQuantidade('1')
  }

  function ajustarQtd(id: string, delta: number) {
    setProdutos((atual) =>
      atual.map((p) =>
        p.id === id
          ? { ...p, quantidade: Math.max(1, p.quantidade + delta) }
          : p,
      ),
    )
  }

  function removerProduto(id: string) {
    // marca para animar a saída e remove de fato após a transição
    setSaindo((s) => new Set(s).add(id))
    window.setTimeout(() => {
      setProdutos((atual) => atual.filter((p) => p.id !== id))
      setSaindo((s) => {
        const novo = new Set(s)
        novo.delete(id)
        return novo
      })
    }, 280)
  }

  function limparTudo() {
    setConfirmandoLimpar(false)
    setSaindo(new Set(produtos.map((p) => p.id)))
    window.setTimeout(() => {
      setProdutos([])
      setSaindo(new Set())
    }, 280)
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
            <p>Monte sua lista e acompanhe o total da compra</p>
          </div>
        </div>
      </header>

      <form className="formulario" onSubmit={handleSubmit}>
        <label className="campo campo--nome">
          <span>Produto</span>
          <input
            type="text"
            placeholder="Ex.: Tomate"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>

        <label className="campo">
          <span>Valor unitário</span>
          <div className="campo__moeda">
            <em>R$</em>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </label>

        <label className="campo">
          <span>Quantidade</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </label>

        <button type="submit" className="botao-criar">
          <span aria-hidden="true">＋</span> Adicionar à lista
        </button>
      </form>

      <main className="lista">
        {produtos.length === 0 ? (
          <div className="vazio">
            <span className="vazio__icone" aria-hidden="true">
              🧺
            </span>
            <p className="vazio__titulo">Sua cesta está vazia</p>
            <p className="vazio__dica">
              Adicione o primeiro produto acima para começar.
            </p>
          </div>
        ) : (
          <>
            <div className="lista__cabecalho">
              <span className="lista__titulo">Sua lista</span>
              <button
                type="button"
                className="botao-limpar"
                onClick={() => setConfirmandoLimpar(true)}
              >
                🗑️ Limpar tudo
              </button>
            </div>
            <ul>
              {produtos.map((p) => (
              <li
                key={p.id}
                className={`item${saindo.has(p.id) ? ' item--saindo' : ''}`}
              >
                <span className="item__emoji" aria-hidden="true">
                  {p.emoji}
                </span>

                <div className="item__info">
                  <strong className="item__nome">{p.nome}</strong>
                  <span className="item__detalhe">
                    {brl.format(p.valor)} / un
                  </span>
                </div>

                <div className="stepper" role="group" aria-label="Quantidade">
                  <button
                    type="button"
                    onClick={() => ajustarQtd(p.id, -1)}
                    aria-label="Diminuir"
                    disabled={p.quantidade <= 1}
                  >
                    −
                  </button>
                  <span className="stepper__valor">{p.quantidade}</span>
                  <button
                    type="button"
                    onClick={() => ajustarQtd(p.id, 1)}
                    aria-label="Aumentar"
                  >
                    +
                  </button>
                </div>

                <span className="item__subtotal">
                  {brl.format(p.valor * p.quantidade)}
                </span>

                <button
                  type="button"
                  className="item__remover"
                  aria-label={`Remover ${p.nome}`}
                  onClick={() => removerProduto(p.id)}
                >
                  🗑️
                </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <footer className="total">
        <div className="total__info">
          <span className="total__rotulo">Total da compra</span>
          <span className="total__itens">
            {qtdTotal} {qtdTotal === 1 ? 'item' : 'itens'}
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
              Isso vai remover {produtos.length}{' '}
              {produtos.length === 1 ? 'produto' : 'produtos'} da sua lista. Essa
              ação não pode ser desfeita.
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
