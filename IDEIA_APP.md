# 🛒 Minha Feira — Documento da Ideia

> Ponto de partida para orquestrar a próxima fase do app. Resume visão, estado atual,
> decisões técnicas e caminhos de evolução. Última atualização: 2026-06-13.

---

## 1. Visão geral

App de **lista de compras de feira/mercado**: o usuário cadastra produtos (com valor
unitário e quantidade) e acompanha em tempo real o **total da compra**. Foco em
**simplicidade, performance e cara de app de compras**.

- **Plataforma:** Web + **PWA** (instalável no celular via "Adicionar à tela inicial",
  sem loja e sem custo). Funciona em Android e iOS pelo navegador.
- **Por que PWA:** não há contas de desenvolvedor Android/iOS; PWA elimina lojas e taxas.
- **Persistência atual:** nenhuma — estado só em memória (some ao recarregar).

---

## 2. Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Build/dev | **Vite** | Dev server instantâneo, build leve |
| UI | **React + TypeScript** | Estado simples com `useState`, tipos seguros |
| PWA | **vite-plugin-pwa** | Manifest + service worker com pouca config |
| Estilo | **CSS puro** | Sem dependências; animações performáticas |
| Estado | `useState` (em memória) | Sem backend, sem libs de estado |

Sem backend, sem banco, sem libs extras de UI/estado. Tudo client-side.

---

## 3. Estado atual (o que já está implementado)

- ✅ Tela única com formulário (produto, valor unitário, quantidade) e botão **"Adicionar à lista"**.
- ✅ Lista de produtos em **cards**, cada um com:
  - **Emoji automático** conforme o nome (`src/emoji.ts`, ~50 itens mapeados, fallback 🛍️).
  - **Stepper +/−** para ajustar quantidade na hora.
  - Subtotal (`valor × quantidade`) e botão de remover (com animação de saída).
- ✅ **Total da compra** em barra flutuante fixa, com **contagem animada** (count-up) e contador de itens.
- ✅ Botão **"Limpar tudo"** com **modal de confirmação** (overlay com blur, animações,
  acessível — `role="dialog"`, `aria-modal`, fecha no Esc / clique fora / Cancelar).
- ✅ Visual moderno: header em gradiente, paleta verde/laranja, sombras, glassmorphism leve.
- ✅ Animações em CSS puro (entrada/saída de itens, header, modal) + respeito a `prefers-reduced-motion`.
- ✅ Ícones PWA 192/512 gerados (`scripts/gen-icons.mjs`, sem dependências externas).

### Decisão de cálculo
Subtotal por linha = `valor unitário × quantidade`. Total = soma dos subtotais.

---

## 4. Estrutura de arquivos

```
app_feira_mercado/
├── index.html              # meta viewport, theme-color, apple-touch-icon
├── vite.config.ts          # VitePWA (manifest, ícones, autoUpdate)
├── public/
│   ├── favicon.svg
│   └── icons/              # icon-192.png, icon-512.png
├── scripts/
│   └── gen-icons.mjs       # gera os PNGs do PWA via zlib (sem deps)
└── src/
    ├── main.tsx            # bootstrap React
    ├── App.tsx             # tela única + lógica (estado em memória)
    ├── App.css             # todo o estilo + animações
    ├── index.css           # reset/base
    ├── emoji.ts            # nome do produto → emoji
    └── useAnimatedNumber.ts # hook do total animado (count-up)
```

### Pontos de atenção no código
- `src/useAnimatedNumber.ts`: tem **rede de segurança** (setTimeout) que garante o valor
  final no alvo mesmo se o `requestAnimationFrame` não completar (corrigido depois de bugs
  de total negativo / preso em valor antigo sob timing ruim). `t` é clampado em [0,1].
- `src/App.tsx`: modelo `Product = { id, nome, emoji, valor, quantidade }`. IDs via `crypto.randomUUID()`.

---

## 5. Como rodar

```bash
npm install
npm run dev              # http://localhost:5173
npm run dev -- --host    # testar no celular na mesma rede (usa o IP exibido)
npm run build            # gera dist/ (PWA: manifest.webmanifest + sw.js)
```

**Instalar no celular (sem loja):** publicar `dist/` em host grátis com HTTPS
(Vercel/Netlify/GitHub Pages) → abrir no celular → "Adicionar à tela inicial".

---

## 6. Caminhos de monetização (resumo)

Ordem recomendada para o estágio atual (priorizar uso/retenção antes de cobrar):

1. **Retenção primeiro** — persistência local (`localStorage`) + **múltiplas listas**
   (feira, farmácia, etc.). Base para quase tudo abaixo.
2. **Afiliados de supermercado** — modelo mais alinhado ao nicho: lista → "Comprar online"
   → comissão; comparação de preços entre mercados; cupons patrocinados.
3. **Freemium com sync** — login + sincronizar listas entre dispositivos, histórico de
   gastos, gráficos. Backend via **Supabase**. Cobrança via Stripe/Mercado Pago (~R$ 4,90–9,90/mês).
4. **Versão Pro / doação** — pagamento único p/ remover anúncios ou desbloquear recursos; botão PIX.
5. **Anúncios (AdSense/AdMob)** — só com volume; usar discreto p/ não poluir.
6. **B2B / White-label** — app com a marca de um mercado/rede (ticket maior, esforço maior).

---

## 7. Próximos passos candidatos (backlog)

- [ ] **Persistência local** (`localStorage`) — lista sobrevive ao recarregar.
- [ ] **Múltiplas listas** (criar/renomear/trocar entre listas).
- [ ] **Editar** um produto já cadastrado.
- [ ] **Compartilhar lista** (texto/WhatsApp ou link).
- [ ] **Histórico de compras** + total por mês.
- [ ] Botão **"Comprar online"** preparado para links de afiliados.
- [ ] (Futuro) **Sync com backend** (Supabase) + auth.
- [ ] (Futuro) **Comparação de preços** entre mercados.

---

## 8. Insight novo (a preencher na próxima sessão)

> _Espaço reservado para o insight que motivou a nova sessão. Descreva aqui o que mudou
> na visão do produto, para orientar a orquestração a partir deste documento._
```
(descreva o insight aqui)
```
