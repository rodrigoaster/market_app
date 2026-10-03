// Catálogo fixo de produtos de feira/mercado.
// Os ids são estáveis (usados como chave no localStorage); não renomeie.
// `emoji` só é informado quando emojiParaProduto() não acerta pelo nome.
export type ItemCatalogo = {
  id: string
  nome: string
  categoria: string
  emoji?: string
}

const POR_CATEGORIA: Record<string, Array<[id: string, nome: string, emoji?: string]>> = {
  Hortifrúti: [
    ['tomate', 'Tomate'],
    ['alface', 'Alface'],
    ['batata', 'Batata'],
    ['batata-doce', 'Batata-doce'],
    ['cenoura', 'Cenoura'],
    ['cebola', 'Cebola'],
    ['alho', 'Alho', '🧄'],
    ['pimentao', 'Pimentão', '🫑'],
    ['brocolis', 'Brócolis'],
    ['pepino', 'Pepino'],
    ['abobrinha', 'Abobrinha'],
    ['beterraba', 'Beterraba'],
    ['mandioca', 'Mandioca', '🍠'],
    ['couve', 'Couve'],
    ['cheiro-verde', 'Cheiro-verde', '🌿'],
    ['milho', 'Milho'],
  ],
  Frutas: [
    ['banana', 'Banana'],
    ['maca', 'Maçã'],
    ['laranja', 'Laranja'],
    ['limao', 'Limão'],
    ['uva', 'Uva'],
    ['morango', 'Morango'],
    ['mamao', 'Mamão'],
    ['melancia', 'Melancia'],
    ['melao', 'Melão'],
    ['abacaxi', 'Abacaxi'],
    ['manga', 'Manga'],
    ['abacate', 'Abacate'],
    ['pera', 'Pera'],
  ],
  Padaria: [
    ['pao-frances', 'Pão francês'],
    ['pao-de-forma', 'Pão de forma'],
    ['bolo', 'Bolo'],
    ['biscoito', 'Biscoito'],
  ],
  'Laticínios e ovos': [
    ['leite', 'Leite'],
    ['ovos', 'Ovos'],
    ['queijo-mussarela', 'Queijo mussarela'],
    ['requeijao', 'Requeijão', '🧀'],
    ['iogurte', 'Iogurte', '🥛'],
    ['manteiga', 'Manteiga'],
    ['margarina', 'Margarina', '🧈'],
    ['presunto', 'Presunto', '🥓'],
  ],
  'Carnes e peixes': [
    ['carne-moida', 'Carne moída'],
    ['alcatra', 'Alcatra'],
    ['frango', 'Frango'],
    ['peito-de-frango', 'Peito de frango'],
    ['linguica', 'Linguiça', '🌭'],
    ['bacon', 'Bacon'],
    ['tilapia', 'Tilápia'],
    ['camarao', 'Camarão'],
  ],
  Mercearia: [
    ['arroz', 'Arroz'],
    ['feijao', 'Feijão'],
    ['macarrao', 'Macarrão'],
    ['molho-de-tomate', 'Molho de tomate'],
    ['farinha-de-trigo', 'Farinha de trigo', '🌾'],
    ['acucar', 'Açúcar'],
    ['sal', 'Sal'],
    ['cafe', 'Café'],
    ['oleo', 'Óleo de soja'],
    ['azeite', 'Azeite'],
    ['chocolate', 'Chocolate'],
  ],
  Bebidas: [
    ['agua', 'Água mineral'],
    ['refrigerante', 'Refrigerante'],
    ['suco', 'Suco'],
    ['cerveja', 'Cerveja'],
    ['vinho', 'Vinho'],
  ],
  'Limpeza e higiene': [
    ['detergente', 'Detergente'],
    ['sabao-em-po', 'Sabão em pó'],
    ['amaciante', 'Amaciante'],
    ['agua-sanitaria', 'Água sanitária', '🧴'],
    ['esponja', 'Esponja', '🧽'],
    ['papel-higienico', 'Papel higiênico'],
    ['sabonete', 'Sabonete', '🧼'],
    ['creme-dental', 'Creme dental', '🪥'],
    ['shampoo', 'Shampoo', '🧴'],
  ],
}

export const CATALOGO: ItemCatalogo[] = Object.entries(POR_CATEGORIA).flatMap(
  ([categoria, itens]) =>
    itens.map(([id, nome, emoji]) => ({ id, nome, categoria, emoji })),
)

// Minúsculas e sem acentos, para a busca: "feijao" encontra "Feijão".
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
