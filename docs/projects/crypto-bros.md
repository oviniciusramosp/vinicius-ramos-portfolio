# Crypto Bros — case brief (internal)

Documento de referência da sessão de criação do case no portfolio. Serve para agentes e humanos no futuro: **não depende só do copy publicado** em `src/data/projects.ts`.

- **Slug:** `crypto-bros`
- **Título público:** Crypto Bros
- **Ano:** 2024
- **Rota:** `/projects/crypto-bros`
- **Status:** case publicado no data model; imagens ainda em placeholder
- **Idioma do portfolio:** inglês (como Staircase / HP Printables)
- **Última atualização desta nota:** 2026-07-27

---

## O que é o projeto (fonte do fundador)

Crypto Bros é uma **comunidade** criada para **brasileiros** aprenderem mais sobre o universo de criptoativos. Vinicius compartilha análises de mercado, materiais de estudo e (em segundo plano) movimentações da carteira pessoal.

### Origem e evolução

1. Começou como **grupo de Telegram**.
2. Virou produto: **app iOS** + **Web**.
3. Depois entrou **Apple Watch (watchOS)**.
4. O app está preparado para **iOS 27**, **Apple Intelligence** (on-device) e integração com **Siri**, para o usuário interagir com ferramentas e dados do app.

### Produto (app / web)

Onde usuários podem:

- Acompanhar **notícias** do mercado
- Aprender com um **curso gratuito**
- Acompanhar **oportunidades** de compra e venda
- Ver **indicadores** e **gráficos de preço em tempo real**
- (Suporte) contexto de **carteira** / trades — **feature secundária**, não o foco do case

### Dashboard interno (ops + IA)

Para alimentar o app, Vinicius desenvolveu um **dashboard** que:

- Identifica notícias em alta e, com IA, gera **posts em inglês e português**
- Cruza indicadores e análise de dados para oportunidades de **compra/venda de Bitcoin**
- Gera análises com base em **mercados preditivos** e **ciclos do Bitcoin**
- Gera imagens para **Stories do Instagram** do Crypto Bros
- Faz análise recorrente de trades/sinais recebidos, filtrando e aprendendo com eles (análise de dados avançada)

### Design / craft

- **Toda a linguagem visual** foi criada por Vinicius
- Gráficos de preço **animam entre períodos** para o usuário **não perder a referência** do preço no tempo
- Materiais de estudo escritos por ele para **simplificar cripto para leigos**

### Conquistas / impacto (narrativa de carreira)

- **Primeiro app** criado 100% e exclusivamente por ele e **lançado na App Store**
- Convite / visita à **sede Apple Brasil** em evento de desenvolvedores; trabalho **aprovado e reconhecido** pelo time da Apple
- Abriu caminho para entrada no time da **Paradigma Education** (primeira research de Bitcoin do Brasil / referência nacional)

### Stack e execução (contexto interno; pouco ou nada no case público)

- **Tudo feito por ele**, com uso de **Claude Code**
- Mobile: **React Native** (pouco relevante no portfolio de designer; **não destacar** no case)
- Não faz sentido seção **Role** no case: ele é tudo no projeto

---

## Decisões de produto editorial do case

| Decisão | Detalhe |
|--------|---------|
| Tom | **Educação e comunidade** primeiro; não “sinais de trade garantidos” |
| Carteira / trades | Mencionar **por cima**, como feature de suporte |
| Métricas do CB | Números do Crypto Bros em si **não são o forte** do case; não forçar vanity metrics |
| Comunidade CB | **50+ membros**, incluindo não brasileiros |
| Paradigma | **9.000+ membros** alcançados via Paradigma Education (usar como ponte de impacto maior) |
| Role | **Sem seção Role** — narrativa própria, não espelhar Staircase/HP à risca |
| Quotes | Não há depoimentos definidos nesta sessão |
| Note de rodapé | **Nenhuma** |
| Tech no case | Não vender React Native / eng; foco design + produto + impacto |
| Travessão | **Não usar o caractere `—` (em dash)** em textos do portfolio |
| Tag CRYPTO | **Removida**; tags finais: `AI`, `MOBILE`, `WEB` |

---

## Meta do case no portfolio

| Campo | Valor |
|-------|--------|
| `slug` | `crypto-bros` |
| `title` | Crypto Bros |
| `year` | 2024 |
| `tags` | `AI`, `MOBILE`, `WEB` |
| `size` | `lg` (card grande) |
| `priority` | `105` (acima de Staircase `100`; entre os primeiros no bento) |
| `href` | `/projects/crypto-bros` |
| `nextSlug` | `staircase` |
| Cadeia next | Booking → Crypto Bros → Staircase → HP Printables → … |
| `quotes` | (nenhum) |
| `note` | (nenhum) |
| `imageFit` | `contain` (cover dual-layer com placeholders) |

### Summary publicado (EN)

> Grew a Brazilian crypto education community from Telegram into an iOS, web, and Apple Watch product with free courses, market news, and real-time charts, powered by an AI operations dashboard I designed and shipped end to end.

---

## Narrativa do case (estrutura publicada)

Inspirada em Staircase/HP, mas **sem Role**, com arco próprio:

1. **From a group chat to a product**  
   Telegram → necessidade de produto calmo → iOS + web + Watch; educação primeiro.

2. **Learning in the loop**  
   Três hábitos: notícias, curso grátis, preço com contexto. Oportunidades/carteira como suporte.

3. **The engine behind the feed**  
   Dashboard solo: posts bilíngues, sinais/indicadores BTC, ciclos/preditivos, Stories, learning loop de trades.

4. **Craft and continuity**  
   Visual language própria; charts animados entre time ranges; Watch + Siri + Apple Intelligence + base para iOS 27.

5. **Impact**  
   App Store solo; Apple Brasil HQ; porta para Paradigma (9k+); CB pequeno e pessoal (50+).

6. **Social (sem seção-ensaio)**  
   - Hero bento: célula `social-fan` com posts 1–6 (fan Lando-style + hover).  
   - Após “engine behind the feed”: `scroll-gallery` theme dark (`incentive-gallery-dark`) com 10 posts (`kind: 'social'`), paddlenav.  
   - Sem parágrafo longo dedicado a social media (voz education-first já cobre).

Arquivo canônico de copy: `src/data/projects.ts` (entrada `crypto-bros`, `sections` + `blocks`).

---

## Assets / placeholders

Pasta: `public/projects/crypto-bros/`

Hoje são **SVGs placeholder** (fundo escuro + label). Substituir pelos finais mantendo os nomes (ou atualizar paths no data).

| Arquivo | Uso no case |
|---------|-------------|
| `cover.svg` | Card home (camada back) |
| `cover-front.svg` | Card home (camada front / parallax) |
| `hero-phones.svg` | Bento 2×2 — app em iPhones |
| `app-icon.svg` | Bento 1×1 — ícone (padded) |
| `hero-dashboard.svg` | (legado) Bento 2×2 dashboard — substituído por `social-fan` no hero |
| `watch-app.svg` | Bento 2×1 + gallery pair Watch |
| `app-news.png` | Gallery triple — news (Learning in the loop) |
| `app-course.png` | Gallery triple — curso |
| `app-charts.png` | Gallery triple — chart (hide on mobile) |
| `dash-news.svg` | Gallery triple dashboard — posts IA |
| `dash-signals.svg` | Gallery triple dashboard — sinais/indicadores |
| `dash-stories.svg` | Gallery triple dashboard — Stories |
| `craft-charts.svg` | Gallery single — chart animado / continuidade |
| `app-siri.svg` | Gallery pair — Siri / Apple Intelligence |
| `story-1.svg` … `story-3.svg` | (legado) Stories Instagram placeholders |
| `post-01.png` … `post-06.*` | Bento social-fan (hero) + scroll-gallery |
| `post-07.jpg` … `post-10.jpg` | scroll-gallery only |

Constante no data: `const CB = '/projects/crypto-bros'`.

### Sugestão de shots (para produção real)

- App em 1–2 iPhones (home, news, curso, chart com transição de período)
- Dashboard no Mac/laptop (news pipeline, sinais, gerador de stories)
- Apple Watch
- Ícone / brand mark
- 3 Stories Instagram gerados pelo dashboard
- (Opcional) foto Apple Brasil — **não está no case atual**

---

## O que NÃO entrou no case (mas existe no brief)

Útil se o case for expandido depois:

- Detalhe de stack (React Native, Claude Code)
- Números “fracos” de downloads/DAU do app CB (evitar destacar)
- Depoimentos / quotes (ainda não definidos)
- Link App Store / site público (não fornecidos nesta sessão)
- Foto do evento Apple Brasil
- Seção Role / process tipo HP Discovery
- Tag `CRYPTO` (descartada de propósito)
- Ênfase em trading / carteira como hero feature

---

## Preferências de escrita (portfolio)

- Copy em **inglês**
- **Sem em dash `—`** nos textos visíveis
- Ênfase em **educação, comunidade, craft, Apple, Paradigma**
- Bold com `**...**` nos `blocks` (render via `inlineHtml` no case page)
- Tom de case study em primeira pessoa, como Staircase/HP

---

## Arquivos relacionados

| Path | Papel |
|------|--------|
| `src/data/projects.ts` | Fonte de verdade do case publicado |
| `public/projects/crypto-bros/*` | Imagens (placeholders → finais) |
| `src/pages/projects/[slug].astro` | Template de case study |
| `docs/projects/crypto-bros.md` | Este brief interno |

---

## Backlog / próximos passos (se retomar)

- [ ] Produzir e trocar assets reais (lista acima)
- [ ] Revisar tom do Impact se quiser menos ênfase nos 50+ membros
- [ ] Adicionar quotes se surgirem (comunidade, Paradigma, Apple)
- [ ] Links App Store / web se quiser CTA
- [ ] Opcional: vídeo do chart animando entre períodos
- [ ] Opcional: entrada no resume / DESIGN-MAP se quiser documentação de site alinhada
