# Sete — Design

**Data:** 2026-06-08
**Status:** Aprovado (design) — aguardando revisão do spec

## Visão geral

**Sete** é um rebuild do jogo 7a0 (*Sete a Zero*): role o dado, receba uma seleção nacional + uma Copa do Mundo, monte os 11 titulares com jogadores que realmente jogaram ali, e simule os **7 jogos** do mata-mata tentando ser campeão (idealmente vencendo todos — o "sete a zero").

O diferencial do Sete em relação ao original é a **lógica de decisão das partidas**: troca o modelo de média+trava por um modelo **exponencial** com fatores de **poder de estrela** e **elo mais fraco**, mais uma **variância de estrela** ("dia de gênio"). Esses valores foram calibrados por simulação de Monte Carlo (ver "Calibração").

Tudo roda **100% no cliente** e é **determinístico pela semente** (mesma semente + mesmo time = mesmo resultado), inclusive a variância.

## Decisões de escopo

| Tema | Decisão |
|---|---|
| Nome | **Sete** |
| Stack | Vite + React + TypeScript (SPA, sem servidor) |
| Adversários | Escada abstrata fixa 68→91 (sem chaveamento real — parkeado p/ futuro) |
| Dados | Reusar os 250 elencos do 7a0 (5.668 jogadores) |
| Idioma | PT apenas |
| Fora de escopo | Encurtador de links, botão de compartilhar, anúncios, i18n EN/ES, chaveamento real |
| Dentro de escopo | Loop completo, rerolls, formações, estilos, modos clássico/almanaque, badges, temas claro+escuro |

## Arquitetura

Núcleo de lógica puro (sem React) separado da UI. Regra de ouro: **`engine/` nunca importa React** — é testável isoladamente (roda os mesmos Monte Carlo da calibração).

```
sete/
├─ public/squads/*.json          # 250 elencos (copiados do 7a0)
├─ src/
│  ├─ engine/                     # LÓGICA PURA, testável
│  │  ├─ rng.ts                   # mulberry32 + hash de seed (murmur-like)
│  │  ├─ types.ts                 # Player, Squad, Lineup, MatchResult, Campaign...
│  │  ├─ catalog.ts               # catálogo {sel,copa,slug} + loader de elenco
│  │  ├─ roll.ts                  # sorteio ponderado, rerolls, anti-repetição
│  │  ├─ formations.ts            # layout de slots por formação/estilo
│  │  ├─ rating.ts                # ataque/defesa + estrela + elo fraco (NOVO)
│  │  ├─ match.ts                 # λ exponencial + variância + Poisson (NOVO)
│  │  ├─ campaign.ts              # 7 jogos, grupos/mata-mata, pênaltis, badges
│  │  └─ config.ts                # TODAS as constantes
│  ├─ state/
│  │  └─ gameReducer.ts           # fluxo roll→build→simulate
│  ├─ ui/                         # componentes React (campo, box score, etc.)
│  ├─ theme.css                   # variáveis dos temas paper/CRT
│  └─ main.tsx
├─ tests/                         # testes do engine (determinismo, Monte Carlo)
└─ (configs Vite/TS/etc.)
```

## Camada de dados

- Os 250 JSONs de elenco vão para `public/squads/` (copiados dos já baixados).
- Estrutura de um elenco: `{ sel, copa, squad: [{ playerId, name, positions[], number, force, legend }] }`.
- O catálogo (250 × `{sel, copa, slug}`) fica embutido em `catalog.ts` (gerado a partir dos arquivos).
- Carregamento **sob demanda**: o elenco só é buscado (`fetch` do `public/`) quando aquele time é sorteado. Cache em memória (Map) por slug.

## Motor — a lógica (o coração)

Todas as constantes vivem em `config.ts`. Aleatoriedade sempre via RNG semeado (mulberry32), nunca `Math.random`, para garantir determinismo.

### Pesos de posição (iguais ao 7a0)
```
ataque: GOL 0, LD 0, ZAG 0, LE 0, MD .5, ME .5, VOL .2, MC .5, MEI .8, PD 1, CA 1, PE 1
defesa: GOL 1, LD 1, ZAG 1, LE 1, MD .5, ME .5, VOL .8, MC .5, MEI .2, PD 0, CA 0, PE 0
```

### Força do time (`rating.ts`) — NOVO
```
média_ponderada_ataque  = Σ(force × peso_ataque) / Σ(peso_ataque)
média_ponderada_defesa  = Σ(force × peso_defesa) / Σ(peso_defesa)
bônus_estrela           = max(0, média(top3 forças) − média(time))
elo_fraco               = min(4, max(0, média(time) − pior_titular))

Qataque = média_ponderada_ataque + 0.18×bônus_estrela − 0.30×elo_fraco
Qdefesa = média_ponderada_defesa + 0.18×bônus_estrela − 0.30×elo_fraco
overall = média simples das forças (só exibição)
```

### Partida (`match.ts`) — NOVO (exponencial, no lugar da soma+trava)
```
λ_base      = 1.35 × exp( 1.2 × (Qataque_seu − Qdefesa_adv) / 12 )
σ           = 0.12 + 0.03 × bônus_estrela
fator_forma = exp( σ × Z − σ²/2 )      # Z ~ Normal(0,1) via RNG semeado; média do fator = 1
λ_efetivo   = λ_base × fator_forma
gols        = Poisson(λ_efetivo)       # amostragem de Knuth com RNG semeado
```
Adversário simétrico: `λ_adv = 1.35 × exp(1.2 × (overall_adv − Qdefesa_seu)/12)`, sem variância (o "dia de gênio" é só do time do jogador).

### Campeonato (`campaign.ts`)
- **7 fases:** GRUPOS (3 jogos, overall 68/72/76) → OITAVAS(79) → QUARTAS(83) → SEMI(87) → FINAL(91).
- **Grupos:** vitória 3 pts, empate 1, derrota 0. Avança o **top-2** da tabela.
- **Mata-mata:** precisa vencer; empate → **pênaltis** `clamp(0.5 + (overall_efetivo_seu − overall_adv) × 0.012, 0.1, 0.9)`, onde `overall_efetivo_seu = (Qataque + Qdefesa) / 2` (não confundir com o overall de exibição = média simples das forças).
- **Campeão:** nunca eliminado (top-2 no grupo + vencer os 4 mata-matas).
- **Perfeito "7 a 0":** 7 vitórias, 0 empates, 0 derrotas.
- **Badges:** **Muralha** (campeão sem sofrer gol) · **Esmagador** (perfeito + saldo de gols ≥ 18).
- Também gera minuto e autor dos gols (artilheiros), via RNG semeado, para a tela de resultado.

### Sorteio (`roll.ts`)
- **Roll inicial:** entre as 250 combinações, **ponderado por força** (peso = 0.25 + 0.75 × força_normalizada do elenco), excluindo os **últimos 6** sorteados (anti-repetição). Semeado por `seed:roll:index`.
- **Trocar seleção (rerollSel):** mantém a Copa, troca o país — sorteio **uniforme** entre os países daquela Copa.
- **Trocar Copa (rerollCopa):** mantém o país, troca a Copa — **ponderado por força**.
- Orçamento de trocas conforme o modo.

### Modos e formações (`config.ts` / `formations.ts`)
- **Modos:** `clássico` (3 trocas, notas visíveis) · `almanaque` (1 troca, notas escondidas).
- **Formações:** 4-3-3, 4-4-2, 4-2-3-1, 4-2-4, 3-5-2, 5-3-2, 4-5-1, 3-4-3 (layouts de slot extraídos do original).
- **Estilos:** defensivo / equilibrado / ofensivo (ajustam o split de slots ataque/defesa).

## Estado e UI

`gameReducer.ts` espelha o fluxo do original: estados `roll → build → simulate`; ações `roll`, `rerollSel`, `rerollCopa`, `selectPlayer`, `setFormation`, `setStyle`, `setMode`, `simulate`, `restart`.

Componentes (`ui/`):
- Cabeçalho com o logo/numeral "7–:0".
- Controles: formação, estilo, modo.
- Painel de sorteio (botão Roll + trocas).
- Campo de futebol com os 11 slots posicionais (clicáveis para escolher jogador).
- Box score: ataque / defesa / overall + lista titular.
- Tela de resultado: os 7 jogos com placar, artilheiros, e badge final.

PT apenas. Sem compartilhar/encurtador.

## Visual

Replica a estética do 7a0, com **dois temas** alternáveis:

**Tema claro (paper):**
```
surface #F3ECD8 · ink #1B1A17 · accent #E8462B · pitch #2F7D4F · line #D8CFB4
fontes: display Anton · body Hanken Grotesk · numeral Archivo (900)
sombras duras 3px, bordas de card brancas, cara de jornal antigo
```
**Tema escuro (CRT/Stream):**
```
surface #0B1A12 · ink #EDE7D6 · accent #E2342B · pitch #0E2417 · line #1D4A2E
fontes: display Oswald · body Space Grotesk · numeral Share Tech Mono
vibe de monitor CRT esverdeado
```
Layout fiel: campo central com posições, box score lateral, faixa superior "7–:0", toggle de tema.

## Calibração (por que esses números)

Definidos por simulação de Monte Carlo (scripts em `.firecrawl/` da análise):
- **Exploit corrigido:** um time de média 87 com 2 craques (96) + resto fraco saía de **47% de título** (estrela pura) para **~10–13%** (justo) com `estrela 0.18` + `elo_fraco 0.30 (cap 4)`.
- **Variância de estrela** (σ ≈ 0.12 + 0.03×bônus) aproxima o desequilibrado do equilibrado e dá o sabor "boom/bust", sem alterar a média.
- **Carry-job realista:** times genuinamente medianos (ex.: Argentina 1986, Maradona 99 + resto fraco) seguem azarões (~0–2%) — comportamento correto pela estrutura "vencer 7 a fio". Tornar isso provável seria decisão de fantasia (mudança estrutural), não de peso — fora de escopo.

## Testes

- **Determinismo:** mesma semente + mesmo time → mesmo resultado (roll, partida, campanha).
- **Monte Carlo de regressão:** reproduzir os números da calibração (exploit ~10–13%, ARG86 azarão).
- **Unidade:** pesos de posição, bônus_estrela, elo_fraco, λ, Poisson, pênaltis, regra de avanço.

## Fora de escopo (futuro)

Chaveamento real com seleções; i18n EN/ES; compartilhar/encurtador; carry-job viável como modo "fantasia".
