# Moove — case brief (internal)

Documento de referência do case Moove no portfolio. Complementa o copy em `src/data/projects.ts`.

- **Slug:** `moove`
- **Título público:** Moove
- **Ano:** (não informado na sessão; campo `year` vazio até confirmar)
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
gallery triple: tee / towel / bottle
gallery pair: stanley / cup
section: facade paragraph
gallery single: facade
section: Communication system
gallery pair: poster / flyer
gallery social: 3 posts
section: brand book close
gallery single: brand book
```

---

## Assets (placeholders)

Pasta: `public/projects/moove/`

| Arquivo | Uso |
|---------|-----|
| `cover.svg` / `cover-front.svg` | Card home |
| `hero-identity.svg` | Bento 2×2 |
| `hero-signage.svg` | Bento 2×2 fachada |
| `logo.svg` / `icon.svg` / `palette.svg` | Identity |
| `apparel-tee.svg` / `apparel-towel.svg` / `apparel-bottle.svg` | Merch |
| `merch-stanley.svg` / `merch-cup.svg` | Drinkware |
| `facade-signage.svg` | Fachada |
| `collat-poster.svg` / `collat-flyer.svg` | Comunicação |
| `social-1..3.svg` | Social |
| `brand-book.svg` | Brand book |

Constante: `const MOOVE = '/projects/moove'`.

---

## Não publicado / gaps

- **Ano** do projeto
- Cores reais da marca (placeholders usam accent `#E8FF47` só como wire)
- Fotos reais de aplicação / fachada
- Quotes de cliente
- Link externo / brand book público
- Impacto mensurável (unidades, campanhas, etc.)

---

## Backlog

- [ ] Confirmar year
- [ ] Substituir placeholders por assets reais
- [ ] Ajustar cover para mock final forte (brand cases leem bem com merch + mark)
- [ ] Opcional: scroll-gallery social se quiser ritmo tipo SoulCycle
- [ ] Opcional: deck-slider do brand book se houver spreads
