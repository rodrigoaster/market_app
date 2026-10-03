import { useEffect, useState } from 'react'

// useState que sobrevive ao recarregar, salvo no localStorage.
// Falhas de leitura/escrita (modo privado, cota cheia) caem no valor inicial.
export function usePersistedState<T>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const salvo = localStorage.getItem(chave)
      return salvo ? (JSON.parse(salvo) as T) : inicial
    } catch {
      return inicial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor))
    } catch {
      // sem persistência: segue só em memória
    }
  }, [chave, valor])

  return [valor, setValor] as const
}
