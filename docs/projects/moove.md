# Moove — case brief (internal)

Documento de referência do case Moove no portfolio. Complementa o copy em `src/data/projects.ts`.

- **Slug:** `moove`
- **Título público:** Moove
- **Ano:** `2023` (metadata dos PDFs de entrega, fev/2023)
- **Rota:** `/projects/moove`
- **Status:** **Coming Soon** na homepage até imagens finais. Sem `href` (não gera `/projects/moove`, não aparece em Next Project). Copy/blocks já escritos no data model.
- **Idioma do portfolio:** inglês
- **Última atualização desta nota:** 2026-07-27

---

## O que é o projeto (fonte do fundador)

Case de **branding** em que Vinicius desenvolveu a **marca**, as **aplicações** e o **brand book** da rede de academias brasileira **Moove Wellness Club**.

### Entregáveis

- Logo
- Ícone
- Paleta de cores
- Modelos de camiseta
- Modelos de toalhas
- Modelos de garrafas de água e copos Stanley
- Letreiro / fachada da academia
- Materiais de comunicação e divulgação
- Modelos de posts de redes sociais
- Brand book (sistema documentado)

### Referências de apresentação (inspiração de estrutura/tom visual do case)

Pedidas pelo usuário para inspirar como o case é contado (não copiar conteúdo):

- https://www.mrsandmr.com/soulcycle (SoulCycle: identity + campanha + space + apparel)
- https://www.christopherayres.com/work/barrysbootcamp (Barry’s: reboot de identidade fitness)
- https://wearecollins.com/ (Collins: apresentação de brand systems premium)

Implicações para o case:

- Identidade primeiro, depois o **mundo** da marca (espaço, merch, comunicação)
- Menos “Role / Discovery / Deliverables” de produto; mais **brand lived in the real world**
- Grid de aplicações denso, com hero de identidade + fachada

---

## Decisões editoriais

| Decisão | Detalhe |
|--------|---------|
| Tom | Brand system premium fitness: confiança, clube, applications reais |
| Role | Sem seção Role (narrativa de brand system) |
| Tags | `BRAND` (já existia no stub) |
| Métricas | Nenhuma fornecida; não inventar |
| Quotes | Nenhum |
| Note | Nenhuma |
| Em dash | Não usar `—` no copy público |
| Imagens | Placeholders em `public/projects/moove/` |
| Ano | Em aberto; confirmar com o usuário |
| Card home | `size: wide`, `priority: 50`, **Coming Soon** até imagens finais |

---

## Meta publicada

| Campo | Valor |
|-------|--------|
| `slug` | `moove` |
| `tags` | `BRAND` |
| `size` | `wide` |
| `priority` | `50` |
| `href` | *(omitido até publicar)* |
| `soon` | `true` |
| `nextSlug` | `booking` (só vale quando publicar) |
| `imageFit` | `contain` |
| `cover` | `logo-mark.svg` + `coverAnimate: 'draw-lines'` |

### Summary (EN)

> Designed the brand system and real-world applications for Moove Wellness Club, a Brazilian fitness network: identity, brand book, apparel, signage, and everyday club touchpoints that carry the brand from locker room to facade.

---

## Narrativa publicada

1. **A brand built to be lived in** — mais que logo; brand book operacional  
2. **Identity system** — logo, ícone, paleta  
3. **In the club** — tee, towel, bottle, Stanley, cups + fachada  
4. **Communication system** — collaterals + social + brand book as system  

### Block map

```
bento (identity + caption + icon + signage + logo)
section: A brand built to be lived in
section: Identity system
gallery triple: logo / icon / palette
section: In the club
gallery pair: colored + B&W lockups
gallery single: paper-work system
section: In the club
gallery triple: tshirts + hoodie
gallery pair: bottles + bags
section: Modalities, one system
deck-slider presentation: yoga / jiu / pilates / wellness
section: Print and promotion
gallery pair: infinite posters
gallery single: wave poster
section: brand book close
```

---

## Assets (reais, zip 2026-07-28)

Pasta: `public/projects/moove/`

| Arquivo | Uso no case |
|---------|-------------|
| `logo-mark.svg` | Card home + bento 2×1 animate |
| `colored-full-logo.svg` | Hero bento 2×2 + identity pair |
| `paper-work.jpg` | Hero bento 2×2 + full-width system |
| `bw-full-logo.jpg` | Bento 1×1 light + identity pair |
| `tshirt-01.jpg` / `tshirt-02.jpg` / `moletom.jpg` | Apparel triple |
| `bottles.png` / `bags.png` | Merch pair |
| `icon-yoga.jpg` / `icon-jiu.jpg` / `icon-pilates.jpg` / `icon-wellness-poster.jpg` | Deck presentation modalidades |
| `poster-infinite-01.jpg` / `poster-infinite-02.jpg` | Print pair |
| `wave-poster.jpg` | Print single |

Placeholders SVG antigos (`hero-*`, `apparel-*`, etc.) ainda na pasta mas **não referenciados** no data model.

Constante: `const MOOVE = '/projects/moove'`.

---

## Não publicado / gaps

- **Ano** do projeto
- Quotes de cliente
- Link externo / brand book público
- Impacto mensurável
- Fachada real (não veio no zip)

---

## Backlog

- [ ] Confirmar year
- [ ] Tirar `soon` quando o case estiver pronto para home
- [ ] Opcional: limpar placeholders SVG não usados
- [ ] Ajustar cover home se quiser merch em vez do logo-mark
- [ ] Opcional: scroll-gallery social se quiser ritmo tipo SoulCycle
- [ ] Opcional: deck-slider do brand book se houver spreads
