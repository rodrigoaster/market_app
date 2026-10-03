const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type Props = {
  nome: string
  emoji: string
  quantidade: string
  valor: string
  subtotal: number | null // null = fora da lista ou sem valor
  ativo: boolean
  saindo: boolean
  onAjustar: (delta: number) => void
  onQuantidade: (texto: string) => void
  onValor: (texto: string) => void
  onRemover?: () => void // só itens avulsos podem ser removidos
}

export function ItemProduto({
  nome,
  emoji,
  quantidade,
  valor,
  subtotal,
  ativo,
  saindo,
  onAjustar,
  onQuantidade,
  onValor,
  onRemover,
}: Props) {
  const classes = ['item', ativo && 'item--ativo', saindo && 'item--saindo']
    .filter(Boolean)
    .join(' ')

  return (
    <li className={classes}>
      <span className="item__emoji" aria-hidden="true">
        {emoji}
      </span>

      <div className="item__info">
        <strong className="item__nome">{nome}</strong>
        {onRemover && <span className="item__detalhe">Avulso</span>}
      </div>

      <div className="item__fim">
        {subtotal !== null && (
          <span className="item__subtotal">{brl.format(subtotal)}</span>
        )}
        {onRemover && (
          <button
            type="button"
            className="item__remover"
            aria-label={`Remover ${nome}`}
            onClick={onRemover}
          >
            🗑️
          </button>
        )}
      </div>

      <div className="item__controles">
        <div className="stepper" role="group" aria-label={`Quantidade de ${nome}`}>
          <button
            type="button"
            onClick={() => onAjustar(-1)}
            aria-label="Diminuir"
            disabled={!ativo}
          >
            −
          </button>
          <input
            className="stepper__valor"
            type="text"
            inputMode="decimal"
            aria-label="Quantidade"
            placeholder="0"
            value={quantidade}
            onChange={(e) => onQuantidade(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
          <button type="button" onClick={() => onAjustar(1)} aria-label="Aumentar">
            +
          </button>
        </div>

        <label className="campo__moeda item__valor">
          <em>R$</em>
          <input
            type="text"
            inputMode="decimal"
            aria-label={`Valor unitário de ${nome}`}
            placeholder="0,00"
            value={valor}
            onChange={(e) => onValor(e.target.value)}
          />
          <span className="item__un">/un</span>
        </label>
      </div>
    </li>
  )
}
