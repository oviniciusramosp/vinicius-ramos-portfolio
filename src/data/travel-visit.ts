/**
 * Visit metadata for travel places: prices, duration, best times, tips.
 * Static curated data + hooks for client-side live signals (crowd, hours).
 *
 * Ticket figures are approximate adult full-price (2025–2026) and can change —
 * `ticketUrl` points to official booking when available.
 *
 * Note: locale types are defined here (not imported from travel.ts) to avoid
 * a circular dependency — travel.ts re-exports this module.
 */

export type Locale = 'en' | 'pt-BR';
export type LString = Record<Locale, string>;

export type MoneyCurrency = 'EUR' | 'USD' | 'BRL';

/** Crowd profile used by client-side “busy now” heuristic (Paris local time). */
export type CrowdProfile =
  | 'tourist-heavy'
  | 'museum'
  | 'park'
  | 'restaurant'
  | 'cafe'
  | 'nightlife'
  | 'local'
  | 'transit'
  | 'shop'
  | 'airport';

export interface MoneyInfo {
  currency: MoneyCurrency;
  /** Lower bound (or fixed amount when max omitted) */
  min?: number;
  /** Upper bound for a range */
  max?: number;
  free?: boolean;
  note?: LString;
}

/**
 * Structured free / reduced ticket deals (not the full adult price).
 * Day budget still uses the full `ticket` amount; promos are card tips only.
 */
export type TicketPromoKind =
  | 'first-sunday'
  | 'first-friday-evening'
  | 'eu-under-26'
  | 'under-18'
  | 'other';

/** Calendar month 1–12 */
export type MonthIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface TicketPromo {
  kind: TicketPromoKind;
  /** Short line shown under Ticket on the place card */
  label: LString;
  /** Months when it applies (1–12). Omit = all year */
  months?: MonthIndex[];
  /** Months excluded (e.g. Jul/Aug for Louvre free Friday) */
  excludeMonths?: MonthIndex[];
  /** Optional time window note (e.g. after 18:00) */
  timeNote?: LString;
  /** Free timed slot often required even when €0 */
  bookRequired?: boolean;
}

export interface VisitInfo {
  /** Restaurants / cafés: typical spend per person (food + drink). */
  avgPricePerPerson?: MoneyInfo;
  /**
   * Hotels / lodging: approximate room rate per night (often a range).
   * Use min–max for low/high season or room types; confirm on booking sites.
   */
  pricePerNight?: MoneyInfo;
  /** Entrance / event ticket (adult full price when applicable). */
  ticket?: MoneyInfo;
  /**
   * Free / reduced ticket deals (1st Sunday, EU &lt;26, etc.).
   * Display-only — budgets keep using full `ticket` price.
   */
  ticketPromos?: TicketPromo[];
  /** Official ticket page for live prices */
  ticketUrl?: string;
  /** Suggested duration in minutes */
  durationMin?: number;
  durationMax?: number;
  /** Override display string when minutes are awkward (e.g. “half day”) */
  duration?: LString;
  /** Specific hour or period of day */
  bestTime?: LString;
  /** Quietest / cheapest day guidance */
  bestDay?: LString;
  tips?: LString;
  /**
   * OSM element for live opening hours via Overpass
   * e.g. "relation/7515426", "way/123", "node/456"
   */
  osmRef?: string;
  /** Drives dynamic “likely busy” estimate on the card */
  crowdProfile?: CrowdProfile;
}

/** LString helpers */
const L = (en: string, pt: string): LString => ({ en, 'pt-BR': pt });

function money(
  min: number,
  max?: number,
  note?: LString,
  currency: MoneyCurrency = 'EUR',
): MoneyInfo {
  return max != null && max !== min
    ? { currency, min, max, note }
    : { currency, min, note };
}

const free: MoneyInfo = {
  currency: 'EUR',
  free: true,
};

// —— Recurring ticket promos (Paris national museums / CMN) ——

/** Winter free Sundays for many CMN monuments (Nov–Mar). */
const MONTHS_WINTER_FREE_SUNDAY: MonthIndex[] = [11, 12, 1, 2, 3];

const PROMO_UNDER_18: TicketPromo = {
  kind: 'under-18',
  label: L('Free under 18', 'Grátis <18'),
};

const PROMO_EU_UNDER_26: TicketPromo = {
  kind: 'eu-under-26',
  label: L(
    'Free for EU/EEA 18–25 (ID; free timed slot often required)',
    'Grátis UE/EEE 18–25 (ID; horário grátis costuma ser obrigatório)',
  ),
  bookRequired: true,
};

const PROMO_FIRST_SUNDAY_YEAR: TicketPromo = {
  kind: 'first-sunday',
  label: L(
    'Free first Sunday of the month (book ahead — crowded)',
    'Grátis no 1º domingo do mês (reserve — lotado)',
  ),
  bookRequired: true,
};

const PROMO_FIRST_SUNDAY_WINTER: TicketPromo = {
  kind: 'first-sunday',
  label: L(
    'Free first Sunday Nov–Mar (book when required)',
    'Grátis no 1º domingo nov–mar (reserve se pedir)',
  ),
  months: MONTHS_WINTER_FREE_SUNDAY,
  bookRequired: true,
};

const PROMO_LOUVRE_FIRST_FRIDAY: TicketPromo = {
  kind: 'first-friday-evening',
  label: L(
    'Free first Friday after 18:00 (not Jul/Aug; book ahead)',
    'Grátis 1ª sexta após 18h (exceto jul/ago; reserve)',
  ),
  excludeMonths: [7, 8],
  timeNote: L('After 18:00', 'Após 18h'),
  bookRequired: true,
};

type MuseumVisitOpts = Partial<VisitInfo> & {
  /**
   * National museum / CMN-style site: auto-attach under-18 + EU under-26 promos.
   * Private attractions (Montparnasse, Fondation LV, …) leave this false.
   */
  national?: boolean;
};

// —— Category-ish builders ——

function parkVisit(partial: Partial<VisitInfo> = {}): VisitInfo {
  return {
    ticket: free,
    durationMin: 45,
    durationMax: 120,
    bestTime: L('Morning or late afternoon', 'Manhã ou fim da tarde'),
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    crowdProfile: 'park',
    tips: L(
      'Bring water and a light layer — shade and wind change a lot.',
      'Leve água e um casaco leve — sombra e vento mudam bastante.',
    ),
    ...partial,
  };
}

/**
 * @param typical - average / typical spend per person (day budget uses this via min)
 * @param upper - upper bound — shown on place cards as part of the min–max range
 */
function restaurantVisit(
  typical: number,
  upper: number,
  partial: Partial<VisitInfo> = {},
): VisitInfo {
  // No duration / bestTime for restaurants — not meaningful for a meal stop.
  return {
    avgPricePerPerson: money(typical, upper),
    bestDay: L('Weekdays, lunch', 'Dias de semana, almoço'),
    tips: L(
      'Weekday lunch is easier for a table. Book ahead for dinner; walk-ins work better at lunch.',
      'Almoço de semana é mais fácil para conseguir mesa. Reserve para jantar; no almoço costuma rolar sem reserva.',
    ),
    ...partial,
  };
}

/**
 * @param typical - average / typical spend per person (day budget uses this via min)
 * @param upper - upper bound — shown on place cards as part of the min–max range
 */
function cafeVisit(
  typical: number,
  upper: number,
  partial: Partial<VisitInfo> = {},
): VisitInfo {
  // No duration — pastry / coffee stops are open-ended.
  return {
    avgPricePerPerson: money(typical, upper),
    bestDay: L('Any day — avoid peak brunch weekends', 'Qualquer dia — evite brunch de fim de semana'),
    tips: L(
      'Standing at the bar is often cheaper than sitting on the terrace.',
      'No balcão costuma ser mais barato que sentar na esplanada.',
    ),
    ...partial,
  };
}

function museumVisit(
  price: number | { min: number; max?: number; free?: boolean },
  partial: MuseumVisitOpts = {},
): VisitInfo {
  const { national = false, ticketPromos: extraPromos, ...rest } = partial;
  const ticket: MoneyInfo =
    typeof price === 'number'
      ? money(price)
      : price.free
        ? free
        : money(price.min, price.max);

  const basePromos: TicketPromo[] = national
    ? [PROMO_UNDER_18, PROMO_EU_UNDER_26]
    : [];
  const ticketPromos = [...basePromos, ...(extraPromos ?? [])];

  return {
    ticket,
    durationMin: 90,
    durationMax: 180,
    bestTime: L('Opening hour or late afternoon', 'Na abertura ou fim da tarde'),
    bestDay: L('Weekday (avoid free Sundays if you hate crowds)', 'Dia de semana (evite domingo grátis se odiar fila)'),
    crowdProfile: 'museum',
    tips: L(
      'Book a timed ticket online — same price, less queue.',
      'Reserve horário online — mesmo preço, menos fila.',
    ),
    ...rest,
    ...(ticketPromos.length ? { ticketPromos } : {}),
  };
}

function landmarkOutdoor(partial: Partial<VisitInfo> = {}): VisitInfo {
  return {
    ticket: free,
    durationMin: 30,
    durationMax: 90,
    bestTime: L('Golden hour / early morning', 'Golden hour / cedo de manhã'),
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Exterior views are free — pay only if you want the interior/top.',
      'Vista de fora é grátis — pague só se quiser o interior/topo.',
    ),
    ...partial,
  };
}

/**
 * Hotel / guest house stay.
 * @param minNight - lower bound per night (e.g. off-season double)
 * @param maxNight - upper bound per night (e.g. peak / larger room)
 */
function lodgingVisit(
  minNight: number,
  maxNight: number,
  partial: Partial<VisitInfo> = {},
): VisitInfo {
  return {
    pricePerNight: money(
      minNight,
      maxNight,
      L(
        'Approx. per night — varies by season & room',
        'Aprox. por noite — varia com temporada e quarto',
      ),
    ),
    crowdProfile: 'local',
    bestTime: L(
      'Check-in afternoon; book peak weekends early',
      'Check-in à tarde; em alta temporada reserve cedo',
    ),
    ...partial,
  };
}

/**
 * Curated visit info keyed by place id.
 * Paris and Rome are fully covered; other cities can be filled later.
 */
export const visitByPlaceId: Record<string, VisitInfo> = {
  // —— Air / logistics ——
  'par-ory': {
    ticket: free,
    durationMin: 60,
    durationMax: 120,
    bestTime: L('Off-peak flights when possible', 'Voos fora de pico quando possível'),
    bestDay: L('Mid-week arrivals are calmer', 'Chegadas no meio da semana são mais calmas'),
    crowdProfile: 'airport',
    tips: L(
      'Allow extra time for RER/Orlyval + security. Orly is often smoother than CDG for short-haul.',
      'Deixe folga para RER/Orlyval + segurança. Orly costuma ser mais tranquilo que CDG em voos curtos.',
    ),
  },
  'par-cdg': {
    ticket: free,
    durationMin: 60,
    durationMax: 150,
    bestTime: L('Off-peak flights when possible', 'Voos fora de pico quando possível'),
    bestDay: L('Mid-week arrivals are calmer', 'Chegadas no meio da semana são mais calmas'),
    crowdProfile: 'airport',
    tips: L(
      'RER B from Aéroport Charles de Gaulle 1 / 2 TGV into Paris (~45–60 min). Allow buffer for security, Terminal Link CDGVAL, and long walks between terminals. Magenta/Gare du Nord are common city exits.',
      'RER B a partir de Aéroport Charles de Gaulle 1 / 2 TGV até Paris (~45–60 min). Deixe folga para segurança, CDGVAL entre terminais e longas caminhadas. Magenta / Gare du Nord são saídas comuns no centro.',
    ),
  },
  'par-cdg-paul': cafeVisit(6, 12, {
    tips: L(
      'Breakfast on the walk toward CDG 2 TGV — keep it light before the long RER ride east.',
      'Café da manhã a caminho do CDG 2 TGV — leve antes do longo trajeto de RER para o leste.',
    ),
  }),
  'par-cdg-rer': {
    ticket: money(
      2,
      2,
      L(
        'Navigo Easy blank card (~€2). Load rides or a day pass after.',
        'Cartão Navigo Easy em branco (~€2). Carregue viagens ou passe diário depois.',
      ),
    ),
    durationMin: 15,
    durationMax: 40,
    bestTime: L('Right after coffee / baggage claim', 'Logo após o café / bagagem'),
    crowdProfile: 'transit',
    tips: L(
      'RATP machines sell Navigo Easy. Board RER B toward Paris; change at Magenta (or Gare du Nord → Magenta) for RER E to Noisy-le-Sec.',
      'Máquinas RATP vendem Navigo Easy. Pegue o RER B para Paris; troque em Magenta (ou Gare du Nord → Magenta) no RER E até Noisy-le-Sec.',
    ),
  },
  'par-orly-m14': {
    ticket: money(
      2,
      2,
      L(
        'Navigo Easy blank card (~€2). Load rides or a day pass after.',
        'Cartão Navigo Easy em branco (~€2). Carregue viagens ou passe diário depois.',
      ),
    ),
    durationMin: 15,
    durationMax: 40,
    bestTime: L('Right after baggage claim', 'Logo após a bagagem'),
    crowdProfile: 'transit',
    tips: L(
      'Machines sell Navigo Easy for the whole group. Then board Métro 14 toward Saint-Lazare / Paris.',
      'Máquinas vendem Navigo Easy para o grupo. Em seguida pegue a linha 14 rumo a Saint-Lazare / Paris.',
    ),
  },
  'par-orly-paul': cafeVisit(6, 12, {
    tips: L(
      'Breakfast after Navigo — keep it light before the ride to Noisy-le-Sec.',
      'Café da manhã depois do Navigo — leve antes do trajeto até Noisy-le-Sec.',
    ),
  }),
  'par-noisy-le-sec-rer': {
    ticket: free,
    durationMin: 10,
    durationMax: 20,
    crowdProfile: 'transit',
    tips: L(
      'RER E stop — 5–10 min walk to Casa do Gui on Rue des Bergeries.',
      'Parada do RER E — 5–10 min a pé até a Casa do Gui na Rue des Bergeries.',
    ),
  },
  'par-casa-do-gui': {
    durationMin: 20,
    durationMax: 40,
    crowdProfile: 'local',
    tips: L(
      'Drop bags on arrival; end the day back here. Auchan is ~5 min walk for basics.',
      'Deixe as malas na chegada; termine o dia de volta aqui. Auchan fica a ~5 min a pé para os básicos.',
    ),
  },
  'par-auchan-noisy': {
    avgPricePerPerson: money(
      15,
      25,
      L(
        'Groceries / person share (basics + snacks)',
        'Compras / pessoa (básicos + lanches)',
      ),
    ),
    durationMin: 45,
    durationMax: 45,
    duration: L('~45 min', '~45 min'),
    bestTime: L('Right after drop-off at home base', 'Logo após deixar as malas na base'),
    crowdProfile: 'shop',
    tips: L(
      'Full supermarket on Rue Jean Jaurès (~€15/person share) — water, breakfast staples, snacks, basics. ~5 min walk from Casa do Gui; drop bags back home before the Tower afternoon.',
      'Supermercado completo na Rue Jean Jaurès (~€15/pessoa) — água, café da manhã, lanches, básicos. ~5 min a pé da Casa do Gui; deixe as compras em casa antes da tarde na Torre.',
    ),
  },

  // —— Parks & walks ——
  'par-champ-mars': parkVisit({
    durationMin: 60,
    durationMax: 120,
    bestTime: L('Late afternoon picnic under the Tower', 'Fim de tarde em piquenique sob a Torre'),
    bestDay: L('Weekday afternoon / early evening', 'Tarde / início de noite em dia de semana'),
    tips: L(
      'Long lawn pause — eat what you grabbed at Bake & Blend, photos, first real outdoor breath. Security checks on big event days.',
      'Parada longa no gramado — coma o que pegou no Bake & Blend, fotos, primeiro respiro ao ar livre. Controle de segurança em dias de evento.',
    ),
  }),
  'par-tuileries': parkVisit({
    durationMin: 40,
    durationMax: 100,
    bestTime: L('Morning walk Louvre → Concorde', 'Caminhada de manhã Louvre → Concorde'),
    tips: L(
      'Free garden. Great connector between Louvre, Orangerie, and Concorde.',
      'Jardim gratuito. Conecta Louvre, Orangerie e Concorde.',
    ),
  }),
  'par-luxembourg': parkVisit({
    durationMin: 60,
    durationMax: 120,
    bestTime: L('Late morning for chairs and sun', 'Fim da manhã para cadeiras e sol'),
    tips: L(
      'Classic Paris chairs around the basin. Kids sail toy boats on weekends.',
      'Cadeiras clássicas em volta do lago. Fim de semana tem barquinhos de criança.',
    ),
  }),
  'par-monceau': parkVisit({
    durationMin: 40,
    durationMax: 90,
    tips: L(
      'Elegant 8th park with follies. Quieter than Luxembourg.',
      'Parque elegante do 8ème com fabriques. Mais calmo que o Luxembourg.',
    ),
  }),
  'par-andre-citroen': parkVisit({
    durationMin: 45,
    durationMax: 100,
    tips: L(
      'Modern lawns and themed gardens by the Seine. Good for a long sit.',
      'Gramados modernos e jardins temáticos à beira do Sena. Bom para ficar um tempo.',
    ),
  }),
  'par-buttes-chaumont': parkVisit({
    durationMin: 60,
    durationMax: 150,
    bestTime: L('Late afternoon for the temple viewpoint', 'Fim da tarde no mirante do templo'),
    tips: L(
      'Hills and lake — wear decent shoes. Belvedere is the photo stop.',
      'Tem subida e lago — use sapato bom. O belvedere é o ponto de foto.',
    ),
  }),
  'par-boulogne': parkVisit({
    durationMin: 120,
    durationMax: 300,
    duration: L('Half day (or full day with LV + Serres)', 'Meio dia (ou dia inteiro com LV + Serres)'),
    bestTime: L('Morning start if combining Fondation LV', 'Comece de manhã se for à Fondation LV'),
    tips: L(
      'Paris “forest”. Rent bikes or plan two anchors (LV + lakes / Serres).',
      '“Floresta” de Paris. Alugue bike ou planeje 2 âncoras (LV + lagos / Serres).',
    ),
  }),
  'par-serres-auteuil': parkVisit({
    ticket: free,
    durationMin: 45,
    durationMax: 90,
    tips: L(
      'Historic greenhouses on the edge of Bois de Boulogne. Check seasonal hours.',
      'Estufas históricas na beira do Bois de Boulogne. Confira horário sazonal.',
    ),
    ticketUrl: 'https://www.paris.fr/lieux/jardin-des-serres-d-auteuil-1802',
  }),
  'par-vincennes': parkVisit({
    durationMin: 90,
    durationMax: 240,
    tips: L(
      'East-side green lung. Pair with Vincennes town + castle.',
      'Pulmão verde do leste. Combine com o centro de Vincennes e o castelo.',
    ),
  }),
  'par-vincennes-town': parkVisit({
    durationMin: 90,
    durationMax: 180,
    bestTime: L('Late morning into lunch', 'Fim da manhã + almoço'),
    bestDay: L('Saturday morning market energy, Sunday calmer', 'Sábado de manhã tem movimento; domingo mais calmo'),
    crowdProfile: 'local',
    tips: L(
      'Stroll the pedestrian centre, then castle and/or Bois.',
      'Ande o centro peatonizado, depois castelo e/ou bosque.',
    ),
  }),
  'par-la-villette': parkVisit({
    durationMin: 90,
    durationMax: 240,
    tips: L(
      'Huge park with museums and Philharmonie. End of the canal walk.',
      'Parque enorme com museus e Philharmonie. Fim do passeio dos canais.',
    ),
  }),
  'par-canals': {
    ticket: free,
    durationMin: 90,
    durationMax: 180,
    duration: L('2–3 hours walk (République → Villette)', '2–3h a pé (République → Villette)'),
    bestTime: L('Late afternoon into golden hour', 'Fim da tarde / golden hour'),
    bestDay: L('Weekday afternoon or Sunday stroll', 'Tarde de semana ou domingo devagar'),
    crowdProfile: 'local',
    tips: L(
      'Stop by Jardin Villemin to eat. Paname Brewing at the Bassin. Return on Metro Line 2 for elevated views.',
      'Pare no Jardin Villemin para comer. Paname no Bassin. Volte na linha 2 (vista elevada).',
    ),
  },
  'par-bike': {
    ticket: money(5, 15, L('Vélib day / short pass (approx.)', 'Passe diário / curto Vélib (aprox.)')),
    durationMin: 90,
    durationMax: 240,
    bestTime: L('Morning or late afternoon (less traffic stress)', 'Manhã ou fim da tarde (menos estresse de trânsito)'),
    bestDay: L('Sunday (more open quays / lighter traffic)', 'Domingo (cais mais abertos / menos trânsito)'),
    crowdProfile: 'transit',
    tips: L(
      'Use dedicated bike lanes; Seine quays and parks are the fun stretches. Helmet optional but smart.',
      'Use ciclovias; cais do Sena e parques são os trechos bons. Capacete opcional, mas faz sentido.',
    ),
    ticketUrl: 'https://www.velib-metropole.fr/',
  },
  'par-vosges': parkVisit({
    durationMin: 30,
    durationMax: 60,
    tips: L(
      'Perfect Marais square — arcades for rain, lawn for sun.',
      'Praça perfeita do Marais — arcadas se chover, gramado se fizer sol.',
    ),
  }),
  'par-bastille': parkVisit({
    durationMin: 20,
    durationMax: 45,
    bestTime: L('Evening for nightlife energy', 'Noite para energia da região'),
    bestDay: L('Friday–Saturday night nearby', 'Sexta–sábado à noite nos arredores'),
    crowdProfile: 'nightlife',
    tips: L(
      'More crossroads than “sight” — good hub for Canal / Marais / 11th bars.',
      'Mais cruzamento que monumento — bom hub para Canal / Marais / bares do 11º.',
    ),
  }),
  'par-marais': parkVisit({
    durationMin: 120,
    durationMax: 240,
    bestTime: L('Afternoon into early evening', 'Tarde até início da noite'),
    bestDay: L('Sunday (shops open, lively streets)', 'Domingo (lojas abertas, ruas vivas)'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Wander without a rigid plan — vintage, falafel, Place des Vosges.',
      'Ande sem roteiro rígido — brechó, falafel, Place des Vosges.',
    ),
  }),
  'par-champs-elysees': parkVisit({
    durationMin: 45,
    durationMax: 90,
    bestTime: L('Evening lights, or early morning photos', 'Luzes à noite, ou foto cedo de manhã'),
    bestDay: L('Weekday morning (less retail crush)', 'Manhã de semana (menos multidão de lojas)'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Walk Concorde → Arc. The avenue is the experience; skip most chain shops.',
      'Ande Concorde → Arco. A avenida é a experiência; pule a maior parte das redes.',
    ),
  }),
  'par-montmartre': parkVisit({
    durationMin: 90,
    durationMax: 180,
    bestTime: L('Early morning or after 18:00', 'Cedo de manhã ou depois das 18h'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Climb from Abbesses, not only the funicular. Watch for pickpockets near Sacré-Cœur.',
      'Suba a pé de Abbesses, não só funicular. Cuidado com carteiristas perto do Sacré-Cœur.',
    ),
  }),
  'par-chatelet': landmarkOutdoor({
    durationMin: 15,
    durationMax: 40,
    bestTime: L('Daytime or evening lights', 'De dia ou à noite com as luzes'),
    crowdProfile: 'transit',
    tips: L(
      'Use it as a hub, not a long stop — metro links almost everywhere from here.',
      'Use como hub, não como parada longa — daqui o metrô liga quase tudo.',
    ),
  }),
  'par-saint-eustache': {
    ticket: free,
    durationMin: 20,
    durationMax: 45,
    bestTime: L('Daytime for the interior and organ', 'De dia para o interior e o órgão'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Free church next to Les Halles — quieter than Notre-Dame, still grand.',
      'Igreja grátis ao lado de Les Halles — mais quieta que Notre-Dame, ainda imponente.',
    ),
  },
  'par-montorgueil': parkVisit({
    durationMin: 45,
    durationMax: 90,
    bestTime: L('Morning food stroll or evening apéro', 'Manhã gastronômica ou apéro à noite'),
    crowdProfile: 'local',
    tips: L(
      'Pedestrian food street — bakeries, oysters, wine bars.',
      'Rua peatonizada de comida — padarias, ostras, wine bars.',
    ),
  }),
  'par-la-defense': parkVisit({
    durationMin: 45,
    durationMax: 90,
    bestTime: L('Weekday daytime for architecture energy', 'Dia de semana de dia (energia corporativa)'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'local',
    tips: L(
      'Grande Arche axis + modern skyline contrast with classic Paris.',
      'Eixo da Grande Arche + skyline moderno em contraste com o Paris clássico.',
    ),
  }),
  'par-paul-defense': cafeVisit(5, 12, {
    tips: L(
      'Solid croissant + coffee before the Arche. Open early for office traffic.',
      'Croissant + café sólido antes da Arche. Abre cedo pelo fluxo de escritórios.',
    ),
  }),
  'par-grande-arche': landmarkOutdoor({
    durationMin: 20,
    durationMax: 45,
    bestTime: L('Morning light on the parvis', 'Luz da manhã no parvis'),
    tips: L(
      'Photo stop from the steps and the axis — rooftop visit optional and timed.',
      'Parada de foto na escadaria e no eixo — terraço opcional e com horário.',
    ),
  }),
  'par-esplanade-de-gaulle': landmarkOutdoor({
    durationMin: 15,
    durationMax: 40,
    bestTime: L('Morning before office rush peaks', 'Manhã antes do pico corporativo'),
    tips: L(
      'Walk the esplanade toward the city — towers + open sky frames.',
      'Ande a esplanada em direção à cidade — torres + céu aberto no enquadramento.',
    ),
  }),
  'par-monoprix-rivoli': {
    avgPricePerPerson: money(6, 12, L('Picnic supplies / person', 'Suprimentos de piquenique / pessoa')),
    durationMin: 15,
    durationMax: 30,
    bestTime: L('Late morning before picnic', 'Fim da manhã antes do piquenique'),
    crowdProfile: 'shop',
    tips: L(
      '23 Av. de l’Opéra (open store). Grab sandwiches, fruit, drinks for Tuileries — ~€6/person. Food is usually at the back.',
      '23 Av. de l’Opéra (loja aberta). Pegue sanduíches, fruta e bebidas para as Tuileries — ~€6/pessoa. Comida costuma ficar no fundo.',
    ),
  },
  'par-palais-royal': parkVisit({
    durationMin: 30,
    durationMax: 60,
    tips: L(
      'Columns courtyard + garden arcades. Quiet pocket next to the Louvre.',
      'Pátio das colunas + arcadas do jardim. Bolso calmo ao lado do Louvre.',
    ),
  }),
  'par-cour-commerce': parkVisit({
    durationMin: 15,
    durationMax: 30,
    bestTime: L('Daytime for photos', 'De dia para fotos'),
    crowdProfile: 'local',
    tips: L(
      'Tiny historic passage — Procope is next door.',
      'Passagem histórica minúscula — Procope fica ao lado.',
    ),
  }),
  'par-saint-michel': parkVisit({
    durationMin: 20,
    durationMax: 45,
    bestTime: L('Evening lights', 'Luzes à noite'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Fountain plaza hub — touristy but useful orientation point.',
      'Praça da fonte — turística, mas bom ponto de orientação.',
    ),
  }),
  'par-sorbonne': {
    ticket: free,
    durationMin: 20,
    durationMax: 40,
    bestTime: L('Weekday daytime', 'Dia de semana de dia'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'local',
    tips: L(
      'Student quarter atmosphere more than a single “ticketed” stop.',
      'Mais clima de bairro estudantil do que um monumento com ingresso.',
    ),
  },

  // —— Major paid sights ——
  'par-eiffel': {
    ticket: money(
      23,
      35,
      L('Stairs vs lift / floor level (approx.)', 'Escada vs elevador / andares (aprox.)'),
    ),
    ticketUrl: 'https://www.toureiffel.paris/en/rates-opening-times',
    durationMin: 90,
    durationMax: 180,
    bestTime: L('First slot of the day or night lights', 'Primeiro horário do dia ou luzes noturnas'),
    bestDay: L('Weekday; book online always', 'Dia de semana; reserve online sempre'),
    crowdProfile: 'tourist-heavy',
    osmRef: 'way/5013364',
    tips: L(
      'Security lines are the time sink. Champ de Mars + Trocadéro photos can be enough.',
      'Fila de segurança come o tempo. Fotos no Champ de Mars + Trocadéro já valem muito.',
    ),
  },
  'par-trocadero': landmarkOutdoor({
    durationMin: 45,
    durationMax: 75,
    bestTime: L('Afternoon light or dusk (tower lights)', 'Luz da tarde ou entardecer (luzes da torre)'),
    tips: L(
      'Long postcard stop — steps, fountains, and the full Tower axis. Watch for street scams and vendors.',
      'Parada longa de cartão-postal — escadaria, fontes e o eixo inteiro da Torre. Cuidado com golpes e ambulantes.',
    ),
  }),
  'par-louvre': museumVisit(32, {
    national: true,
    ticketUrl: 'https://www.ticket.louvre.fr/en',
    durationMin: 150,
    durationMax: 300,
    duration: L('3–5 hours (or two short visits)', '3–5 horas (ou duas visitas curtas)'),
    bestTime: L('Wed/Fri evening opening; otherwise right at 09:00', 'Noite de qua/sex; senão logo às 09h'),
    bestDay: L(
      'Wednesday or Friday evening; free first Friday after 18:00 (not Jul/Aug)',
      'Quarta ou sexta à noite; grátis 1ª sexta após 18h (exceto jul/ago)',
    ),
    ticketPromos: [PROMO_LOUVRE_FIRST_FRIDAY],
    tips: L(
      'Closed Tuesdays. Book timed entry. Pick wings in advance — you will not see everything. No free first-Sunday (unlike Orsay).',
      'Fecha terça. Reserve horário. Escolha alas antes — você não vê tudo. Sem 1º domingo grátis (diferente do Orsay).',
    ),
    osmRef: 'relation/7515426',
  }),
  'par-orsay': museumVisit(16, {
    national: true,
    ticketUrl: 'https://www.musee-orsay.fr/en/visit',
    durationMin: 120,
    durationMax: 210,
    bestTime: L('Opening or Thursday late opening', 'Abertura ou quinta com horário estendido'),
    bestDay: L(
      'Tuesday–Thursday; free first Sunday all year (crowded) — book even if free',
      'Ter–qui; grátis 1º domingo o ano todo (lotado) — reserve mesmo se for grátis',
    ),
    ticketPromos: [PROMO_FIRST_SUNDAY_YEAR],
    osmRef: 'way/63178753',
    tips: L(
      'Closed Monday. Famous clock window for photos; Impressionists upstairs. Free Sunday requires online booking.',
      'Fecha segunda. Relógio famoso para fotos; impressionistas no andar de cima. Domingo grátis exige reserva online.',
    ),
  }),
  'par-orangerie': museumVisit(12.5, {
    national: true,
    ticketUrl: 'https://www.musee-orangerie.fr/en',
    durationMin: 60,
    durationMax: 100,
    bestTime: L('Opening hour', 'Horário de abertura'),
    bestDay: L(
      'Weekday; free first Sunday all year (book ahead)',
      'Dia de semana; grátis 1º domingo o ano todo (reserve)',
    ),
    ticketPromos: [PROMO_FIRST_SUNDAY_YEAR],
    osmRef: 'way/54188996',
    tips: L(
      'Monet Water Lilies oval rooms are the highlight. Pair with Tuileries walk. Free Sunday: online slot required.',
      'Salas ovais dos Nenúfares do Monet são o destaque. Combine com as Tuileries. Domingo grátis: horário online obrigatório.',
    ),
  }),
  'par-luxor-obelisk': {
    ticket: free,
    durationMin: 10,
    durationMax: 25,
    bestTime: L('Golden hour on the Concorde–Champs axis', 'Golden hour no eixo Concorde–Champs'),
    bestDay: L('Any day', 'Qualquer dia'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Best as a stop on the Tuileries → Concorde → Champs walk. Night lighting is strong.',
      'Melhor como parada no passeio Tuileries → Concorde → Champs. A iluminação noturna é forte.',
    ),
  },
  'par-fondation-lv': museumVisit(
    { min: 16, max: 20 },
    {
      // Private foundation — no national free-Sunday / EU-under-26 auto promos
      ticketUrl: 'https://www.fondationlouisvuitton.fr/en/tickets',
      durationMin: 90,
      durationMax: 150,
      bestTime: L('Morning slot after Bois walk', 'Horário de manhã após passeio no Bois'),
      bestDay: L('Weekday', 'Dia de semana'),
      tips: L(
        'Architecture is half the visit. Check shuttle from Étoile on some days.',
        'A arquitetura é metade da visita. Em alguns dias tem shuttle a partir da Étoile.',
      ),
    },
  ),
  'par-chateau-vincennes': museumVisit(13, {
    national: true,
    ticketUrl: 'https://www.chateau-de-vincennes.fr/en',
    durationMin: 75,
    durationMax: 120,
    bestTime: L('Morning after town stroll', 'Manhã depois de andar na cidade'),
    bestDay: L(
      'Weekday; free first Sundays Nov–Mar (check site)',
      'Dia de semana; grátis 1ºs domingos nov–mar (confira site)',
    ),
    ticketPromos: [PROMO_FIRST_SUNDAY_WINTER],
    tips: L(
      'Medieval keep + walls. CMN monument — free under 18 / EU under 26 with ID.',
      'Donjon medieval + muralhas. Monumento CMN — grátis <18 / UE <26 com ID.',
    ),
  }),
  'par-arc-triomphe': museumVisit(16, {
    national: true,
    ticketUrl: 'https://www.paris-arc-de-triomphe.fr/en/',
    durationMin: 45,
    durationMax: 75,
    bestTime: L('Sunset from the terrace', 'Pôr do sol no terraço'),
    bestDay: L(
      'Weekday late afternoon; free first Sunday Nov–Mar (crowded)',
      'Fim de tarde em dia de semana; grátis 1º domingo nov–mar (lotado)',
    ),
    ticketPromos: [PROMO_FIRST_SUNDAY_WINTER],
    osmRef: 'way/226413508',
    tips: L(
      'Use the underground passage — never cross the roundabout at street level. Tomb of the Unknown Soldier is free at street level.',
      'Use a passagem subterrânea — nunca atravesse a rotatória no nível da rua. Túmulo do Soldado Desconhecido é grátis no nível da rua.',
    ),
  }),
  'par-sainte-chapelle': museumVisit(13, {
    national: true,
    ticketUrl: 'https://www.sainte-chapelle.fr/en/',
    durationMin: 45,
    durationMax: 75,
    bestTime: L('Bright daylight for the stained glass', 'Dia claro para os vitrais'),
    bestDay: L(
      'Weekday morning; free first Sunday Nov–Mar (security queue still long)',
      'Manhã de dia de semana; grátis 1º domingo nov–mar (fila de segurança ainda longa)',
    ),
    ticketPromos: [PROMO_FIRST_SUNDAY_WINTER],
    osmRef: 'relation/3344870',
    tips: L(
      'Upper chapel is the wow. Security queue can be long — book ahead even on free Sundays.',
      'A capela superior é o show. Fila de segurança pode ser longa — reserve mesmo no domingo grátis.',
    ),
  }),
  'par-pantheon': museumVisit(13, {
    national: true,
    ticketUrl: 'https://www.paris-pantheon.fr/en/',
    durationMin: 60,
    durationMax: 90,
    bestTime: L('Morning in the Latin Quarter loop', 'Manhã no circuito do Quartier Latin'),
    bestDay: L(
      'Weekday; free first Sunday Nov–Mar',
      'Dia de semana; grátis 1º domingo nov–mar',
    ),
    ticketPromos: [PROMO_FIRST_SUNDAY_WINTER],
    tips: L(
      'Dome climb when open is worth it for views. Crypt for great names of France.',
      'Subida à cúpula (quando aberta) vale pela vista. Cripta com nomes da França.',
    ),
  }),
  'par-invalides': museumVisit(16, {
    national: true,
    ticketUrl: 'https://www.musee-armee.fr/en/',
    durationMin: 90,
    durationMax: 150,
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    tips: L(
      'Army museum + Napoleon’s tomb under the golden dome. EU under 26 free with ID.',
      'Museu do Exército + túmulo de Napoleão sob a cúpula dourada. UE <26 grátis com ID.',
    ),
  }),
  'par-pompidou': museumVisit(15, {
    national: true,
    ticketUrl: 'https://www.centrepompidou.fr/en/',
    durationMin: 90,
    durationMax: 150,
    bestTime: L('Late afternoon; roof views near closing', 'Fim da tarde; vista do topo perto de fechar'),
    tips: L(
      'Modern art + exterior escalators. Major renovation / long closure through ~2030 — confirm before you go.',
      'Arte moderna + escadas externas. Reforma grande / fechamento longo até ~2030 — confira antes de ir.',
    ),
  }),
  'par-montparnasse': museumVisit(22, {
    // Private tower — no national free days
    ticketUrl: 'https://www.tourmontparnasse.net/en/',
    durationMin: 45,
    durationMax: 75,
    bestTime: L('Sunset into early evening', 'Pôr do sol até o início da noite'),
    bestDay: L('Clear-sky days only', 'Só em dias de céu limpo'),
    tips: L(
      'Best classic view of the Eiffel Tower skyline. Go for weather, not just the clock. No free first-Sunday.',
      'Melhor vista clássica da Torre no skyline. Vá pelo clima, não só pelo horário. Sem 1º domingo grátis.',
    ),
  }),
  'par-opera': museumVisit(15, {
    // Self-guided palace tour — not a standard CMN free-Sunday monument
    ticketUrl: 'https://www.operadeparis.fr/en/visits/palais-garnier',
    durationMin: 60,
    durationMax: 100,
    bestTime: L('Morning self-guided visit', 'Visita guiada por conta própria de manhã'),
    tips: L(
      'Self-guided tour of the palace (not a show). Book performance tickets separately.',
      'Visita ao palácio (não é espetáculo). Ingresso de ópera/ballet é separado.',
    ),
  }),
  'par-notre-dame': {
    ticket: free,
    ticketUrl: 'https://www.notredamedeparis.fr/en/',
    durationMin: 45,
    durationMax: 90,
    bestTime: L('Early morning entry slot', 'Horário de entrada cedo'),
    bestDay: L('Weekday; book free timed entry when required', 'Dia de semana; reserve entrada gratuita se pedir'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Exterior + Île always free. Interior access rules change — check official site for booking.',
      'Exterior + ilha sempre grátis. Regras do interior mudam — confira o site oficial.',
    ),
  },
  'par-sacre-coeur': {
    ticket: {
      currency: 'EUR',
      free: true,
      note: L(
        'Basilica free; dome climb ~€7 (approx.)',
        'Basílica grátis; cúpula ~€7 (aprox.)',
      ),
    },
    durationMin: 45,
    durationMax: 90,
    bestTime: L('Early morning or evening from the steps', 'Cedo de manhã ou noite nas escadarias'),
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Basilica free; dome has a fee and stairs. Pickpockets on the square.',
      'Basílica grátis; cúpula tem taxa e escadas. Carteiristas na praça.',
    ),
  },
  'par-moulin-rouge': {
    ticket: money(
      100,
      250,
      L('Show only vs dinner show (approx.)', 'Só show vs jantar + show (aprox.)'),
    ),
    ticketUrl: 'https://www.moulinrouge.fr/en/',
    durationMin: 120,
    durationMax: 210,
    bestTime: L('Evening show (dress smart-casual)', 'Show noturno (visual smart-casual)'),
    bestDay: L('Weeknight if available — slightly calmer', 'Noite de semana se houver — um pouco mais calmo'),
    crowdProfile: 'nightlife',
    tips: L(
      'Book official site only. Photo stop on the boulevard is free anytime.',
      'Reserve só no site oficial. Foto na avenida é grátis a qualquer hora.',
    ),
  },
  'par-bateaux-mouches': {
    ticket: money(15, 25, L('Cruise only, seasonal (approx.)', 'Só passeio de barco, sazonal (aprox.)')),
    ticketUrl: 'https://www.bateaux-mouches.fr/',
    durationMin: 60,
    durationMax: 80,
    bestTime: L('Sunset cruise', 'Passeio no pôr do sol'),
    bestDay: L('Clear evening', 'Noite de céu limpo'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Touristy but effective orientation of the river monuments.',
      'Turístico, mas ótimo para se orientar nos monumentos do rio.',
    ),
  },
  'par-alexandre-iii': landmarkOutdoor({
    durationMin: 15,
    durationMax: 30,
    bestTime: L('Dusk, when the bridge lights turn on', 'Entardecer, quando as luzes da ponte acendem'),
    tips: L(
      'Most ornate bridge — pair with Invalides / Grand Palais photos.',
      'Ponte mais ornamentada — combine com fotos dos Invalides / Grand Palais.',
    ),
  }),
  'par-palais': {
    ticket: money(0, 16, L('Exterior free; exhibitions vary', 'Exterior grátis; exposições variam')),
    durationMin: 30,
    durationMax: 90,
    bestTime: L('Daytime for architecture photos', 'De dia para fotos da arquitetura'),
    bestDay: L('Depends on exhibition', 'Depende da exposição'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Petit Palais permanent collections are often free. Grand Palais depends on show.',
      'Coleções permanentes do Petit Palais costumam ser grátis. Grand Palais depende da mostra.',
    ),
  },
  'par-vendome': landmarkOutdoor({
    durationMin: 15,
    durationMax: 30,
    tips: L(
      'Luxury square — architecture and window shopping more than a long stop.',
      'Praça de luxo — arquitetura e vitrines mais do que parada longa.',
    ),
  }),
  'par-madeleine': {
    ticket: free,
    durationMin: 20,
    durationMax: 40,
    bestTime: L('Daytime interior if open', 'Interior de dia, se aberto'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Neoclassical temple-church. Gourmet shops around the square.',
      'Igreja-templo neoclássica. Empórios gourmet em volta da praça.',
    ),
  },
  'par-hotel-ville': landmarkOutdoor({
    durationMin: 15,
    durationMax: 40,
    tips: L(
      'City hall plaza — free exhibitions sometimes; ice rink in winter.',
      'Praça da prefeitura — às vezes exposição grátis; pista de gelo no inverno.',
    ),
  }),
  'par-horloge': landmarkOutdoor({
    durationMin: 10,
    durationMax: 20,
    tips: L(
      'Look up on the Conciergerie tower — one of Paris’s oldest public clocks.',
      'Olhe a torre da Conciergerie — um dos relógios públicos mais antigos de Paris.',
    ),
  }),
  'par-maison-balzac': {
    ticket: free,
    durationMin: 45,
    durationMax: 75,
    bestTime: L('Afternoon in Passy', 'Tarde em Passy'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'museum',
    tips: L(
      'Small literary museum in Passy with a garden. Confirm free days/hours.',
      'Museu literário pequeno em Passy com jardim. Confirme dias/horários grátis.',
    ),
  },
  'par-bnf': {
    ticket: money(0, 10, L('Exterior / plaza free; exhibitions vary', 'Exterior grátis; exposições variam')),
    durationMin: 30,
    durationMax: 90,
    bestTime: L('Daytime for the riverside towers', 'De dia para as torres à beira do rio'),
    crowdProfile: 'local',
    tips: L(
      'François-Mitterrand site is an architecture stop; exhibitions are optional.',
      'Sítio François-Mitterrand é parada de arquitetura; exposição é opcional.',
    ),
  },

  // —— Photo / metro ——
  'par-metro-6': {
    ticket: money(2.5, 2.5, L('Single t+ ticket / Navigo (approx.)', 'Bilhete t+ / Navigo (aprox.)')),
    durationMin: 20,
    durationMax: 45,
    bestTime: L('Daylight for Tower views from Bir-Hakeim', 'Luz do dia para a Torre em Bir-Hakeim'),
    bestDay: L('Any day — windows on the elevated stretch', 'Qualquer dia — janela no trecho elevado'),
    crowdProfile: 'transit',
    tips: L(
      'Ride between Passy / Bir-Hakeim / Trocadéro for the views. Valid metro ticket required.',
      'Pegue entre Passy / Bir-Hakeim / Trocadéro pela vista. Precisa de bilhete válido.',
    ),
  },
  'par-metro-2': {
    ticket: money(2.5, 2.5, L('Single t+ ticket / Navigo (approx.)', 'Bilhete t+ / Navigo (aprox.)')),
    durationMin: 25,
    durationMax: 50,
    bestTime: L('Daylight on elevated east stretch', 'Luz do dia no trecho elevado leste'),
    bestDay: L('After canal / Villette walk as return', 'Na volta do passeio dos canais / Villette'),
    crowdProfile: 'transit',
    tips: L(
      'Elevated panoramic stretches toward Nation. Great after Bassin de la Villette.',
      'Trechos elevados panorâmicos rumo a Nation. Ótimo depois do Bassin de la Villette.',
    ),
  },

  // —— Restaurants ——
  'par-felicita': restaurantVisit(20, 40, {
    tips: L(
      'Huge food hall — share several counters. Go hungry.',
      'Food hall enorme — divida vários boxes. Vá com fome.',
    ),
  }),
  'par-franklin-passy': restaurantVisit(25, 45, {
    tips: L('Passy classic near Trocadéro — book for dinner.', 'Clássico de Passy perto do Trocadéro — reserve à noite.'),
  }),
  'par-francette': restaurantVisit(30, 55, {
    tips: L(
      'Seine barge vibe — check weather for the terrace; nice with river light.',
      'Clima de barcaça no Sena — confira o tempo para a esplanada; bonito com luz no rio.',
    ),
  }),
  'par-creperie-arts': restaurantVisit(12, 22, {
    tips: L('Solid crêpe stop in Saint-Germain.', 'Boa parada de crêpe em Saint-Germain.'),
  }),
  'par-auptitgrec': restaurantVisit(8, 16, {
    tips: L('Fast crêpe / street-food energy. Cash sometimes handy.', 'Crêpe rápido. Dinheiro às vezes ajuda.'),
  }),
  'par-procope': restaurantVisit(35, 60, {
    tips: L(
      'Historic café-restaurant — atmosphere is the product. Book.',
      'Café-restaurante histórico — o ambiente é o produto. Reserve.',
    ),
  }),
  'par-brasserie-pres': restaurantVisit(30, 50),
  'par-chez-janou': restaurantVisit(35, 55, {
    tips: L(
      'Provençal vibes; chocolate mousse is the legend. Reserve.',
      'Clima provençal; mousse de chocolate é a lenda. Reserve.',
    ),
  }),
  'par-chez-elo': restaurantVisit(25, 45),
  'par-entrecote': restaurantVisit(30, 45, {
    tips: L(
      'Reserve ahead or arrive early to skip the queue — especially at dinner. Generous steak-frites + secret sauce.',
      'Recomendado reservar ou chegar cedo para evitar fila, principalmente no jantar. Steak-frites generoso + molho secreto.',
    ),
  }),
  'par-train-bleu': restaurantVisit(55, 90, {
    tips: L(
      'Book for the dining room — the gilded hall is the show.',
      'Reserve o salão — o ambiente dourado é o espetáculo.',
    ),
  }),
  'par-bouillon': restaurantVisit(15, 28, {
    tips: L(
      'Classic French, fair prices. Book for dine-in or takeaway in ~5 min — eat at a park/canal.',
      'Francês clássico, preço justo. Reserve para comer lá ou leve em ~5 min — coma em parque/canal.',
    ),
  }),
  'par-royal-cambronne': restaurantVisit(18, 35, {
    durationMin: 75,
    durationMax: 100,
    bestDay: L('Weekdays, evening', 'Dias de semana, noite'),
    tips: L(
      'Paris terrace vibe for dinner watching the street and Line 6 — open square in front. Afterward RER home via Cambronne / Montparnasse.',
      'Esplanada para jantar olhando a rua e a linha 6 — praça aberta na frente. Depois RER para casa via Cambronne / Montparnasse.',
    ),
  }),
  'par-paname-brewing': restaurantVisit(15, 30, {
    avgPricePerPerson: money(15, 30, L('Beers + snack/meal', 'Cervejas + petisco/refeição')),
    bestDay: L('Weekdays, sunny terrace', 'Dias de semana, esplanada no sol'),
    tips: L(
      'House beer on the water — perfect canal-walk pause, especially late afternoon.',
      'Cerveja própria na água — pausa perfeita do passeio nos canais, sobretudo no fim da tarde.',
    ),
  }),
  'par-fric-frac': restaurantVisit(12, 22, {
    tips: L('Croque specialist — quick and filling.', 'Especialista em croque — rápido e enche.'),
  }),
  'par-bien-eleve': restaurantVisit(20, 40),
  'par-bohemia': restaurantVisit(18, 35, {
    bestDay: L('Weekdays, brunch', 'Dias de semana, brunch'),
    tips: L(
      'Order the club sandwich or Club Loco de Blueberries. Weekends fill up — weekday is easier for a table.',
      'Peça o club sandwich ou o Club Loco de Blueberries. Fim de semana enche — dia de semana é mais fácil para mesa.',
    ),
  }),
  'par-arnaud-nicolas': restaurantVisit(25, 50, {
    tips: L('Charcuterie craft — good for a refined snack plate.', 'Charcutaria de ofício — bom para petiscos refinados.'),
  }),

  // —— Cafés / pastry ——
  'par-bake-blend': cafeVisit(6, 14, {
    durationMin: 20,
    durationMax: 30,
    tips: L(
      'Grab bakery + coffee to go — eat while walking to the Champ de Mars.',
      'Pegue padaria + café para levar — coma andando até o Champ de Mars.',
    ),
  }),
  'par-bakery-gaite': cafeVisit(5, 12),
  'par-pierre-herme': cafeVisit(8, 20, {
    tips: L(
      'Macaron / pastry temple. Queue for bestsellers; boxes travel well.',
      'Templo de macaron / pâtisserie. Fila nos hits; caixas viajam bem.',
    ),
  }),
  'par-cedric-grolet': cafeVisit(10, 25, {
    tips: L(
      'Sculptural fruit pastries. Go early — sells out.',
      'Doces esculturais de fruta. Vá cedo — esgota.',
    ),
  }),
  'par-eclair-genie': cafeVisit(6, 15),
  'par-maison-isabelle': cafeVisit(4, 10, {
    tips: L(
      'Often a queue — go early if you can. Award-winning croissants.',
      'Costuma formar fila — vá cedo se puder. Croissants premiados.',
    ),
  }),
  'par-jeffrey-cagnes': cafeVisit(6, 14),
  'par-michalak': cafeVisit(8, 20),
  'par-michalak-etienne': cafeVisit(6, 15, {
    tips: L(
      'Etienne Marcel counter near Montorgueil — go early for the best selection.',
      'Balcão na Etienne Marcel perto de Montorgueil — vá cedo para a melhor seleção.',
    ),
  }),
  'par-artizans': restaurantVisit(25, 45, {
    tips: L(
      'Montorgueil bistro — good stop while walking the food street.',
      'Bistrô em Montorgueil — boa parada no passeio da rua gastronômica.',
    ),
  }),
  'par-amorino': cafeVisit(5, 12, {
    tips: L('Gelato flower scoops — touristy but fun on a warm day.', 'Gelato em flor — turístico, mas legal no calor.'),
  }),

  // —— Shopping ——
  'par-galeries-lafayette': {
    ticket: free,
    durationMin: 45,
    durationMax: 120,
    bestTime: L('Opening hour for dome photos; evening lights', 'Abertura para foto da cúpula; luzes à noite'),
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    crowdProfile: 'shop',
    tips: L(
      'Free rooftop viewpoint (check access). Dome interior is the wow.',
      'Terraço com vista grátis (confirme acesso). A cúpula por dentro é o show.',
    ),
  },
  'par-printemps': {
    ticket: free,
    durationMin: 40,
    durationMax: 100,
    bestTime: L('Daytime rooftop if open', 'Terraço de dia, se aberto'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'shop',
    tips: L(
      'Haussmann department store — rooftop café/views when available.',
      'Grand magasin Haussmann — terraço/café com vista quando aberto.',
    ),
  },
  'par-bon-marche': {
    ticket: free,
    durationMin: 40,
    durationMax: 120,
    bestTime: L('Morning for the Grande Épicerie', 'Manhã na Grande Épicerie'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'shop',
    tips: L(
      'Left-bank elegance — food hall downstairs is half the visit.',
      'Elegância da margem esquerda — a épicerie embaixo é metade da visita.',
    ),
  },
  'par-forum-halles': {
    ticket: free,
    durationMin: 30,
    durationMax: 90,
    bestTime: L('Daytime', 'De dia'),
    crowdProfile: 'shop',
    tips: L('Underground mall + Canopée park above — useful, not romantic.', 'Shopping subterrâneo + parque da Canopée em cima — útil, não romântico.'),
  },
  'par-bhv-marais': {
    ticket: free,
    durationMin: 40,
    durationMax: 100,
    bestTime: L('Weekday afternoon', 'Tarde de dia de semana'),
    crowdProfile: 'shop',
    tips: L('Rooftop café when open — good Hôtel de Ville views.', 'Café no terraço quando aberto — boa vista do Hôtel de Ville.'),
  },
  'par-shakespeare': {
    ticket: free,
    durationMin: 20,
    durationMax: 60,
    bestTime: L('Opening hour — queues grow fast', 'Abertura — a fila cresce rápido'),
    crowdProfile: 'cafe',
    tips: L(
      'Café + English bookshop by the Seine — browse shelves, then coffee; expect a line.',
      'Café + livraria em inglês no Sena — percorra as prateleiras e depois o café; espere fila.',
    ),
  },

  // —— Commons (chains) ——
  'par-mcdonalds-champs': {
    avgPricePerPerson: money(8, 16),
    durationMin: 20,
    durationMax: 45,
    bestTime: L('Late night when little else is open', 'Madrugada quando pouco está aberto'),
    crowdProfile: 'local',
    tips: L('Tourist McDo — useful, not a food destination.', 'McDo turístico — útil, não é destino gastronômico.'),
  },
  'par-mcdonalds-disney': {
    avgPricePerPerson: money(8, 16),
    durationMin: 20,
    durationMax: 45,
    bestTime: L('After park close / late evening', 'Depois do parque fechar / noite'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'In Disney Village — outside the paid park gates, next to the RER / hotels strip.\nNo park ticket needed. Open later than most in-park restaurants.\nNearby Village options: Five Guys, Starbucks. Park re-entry works for fireworks later.',
      'Na Disney Village — fora dos portões pagos, na faixa RER / hotéis.\nNão precisa de ingresso do parque. Abre mais tarde que a maioria dos restaurantes de dentro.\nOpções perto no Village: Five Guys, Starbucks. Dá para reentrar no parque para os fogos.',
    ),
  },
  'par-bella-notte': {
    avgPricePerPerson: money(11, 18),
    durationMin: 30,
    durationMax: 60,
    bestTime: L('Lunch 12:00–14:00', 'Almoço 12h–14h'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Inside Disneyland Park (Fantasyland) — Mickey-shaped individual pizza ~€11.\nCounter service; queues peak at lunch. Park ticket required.',
      'Dentro do Disneyland Park (Fantasyland) — pizza individual em formato do Mickey ~€11.\nSelf-service; fila no horário de almoço. Precisa de ingresso do parque.',
    ),
  },
  'par-burger-king-opera': {
    avgPricePerPerson: money(8, 15),
    durationMin: 15,
    durationMax: 40,
    crowdProfile: 'local',
  },
  'par-starbucks-opera': {
    avgPricePerPerson: money(5, 12),
    durationMin: 20,
    durationMax: 60,
    crowdProfile: 'cafe',
    tips: L('Wi‑Fi + AC between department stores.', 'Wi‑Fi + ar entre grands magasins.'),
  },
  'par-five-guys-rivoli': {
    avgPricePerPerson: money(12, 22),
    durationMin: 25,
    durationMax: 50,
    crowdProfile: 'restaurant',
  },
  'par-kfc-les-halles': {
    avgPricePerPerson: money(8, 16),
    durationMin: 15,
    durationMax: 40,
    crowdProfile: 'local',
  },

  // —— Markets ——
  'par-marche-enfants-rouges': {
    avgPricePerPerson: money(10, 25),
    durationMin: 45,
    durationMax: 90,
    bestTime: L('Lunch 11:00–14:00', 'Almoço 11h–14h'),
    bestDay: L('Tue–Sun (closed Monday)', 'Ter–dom (fecha segunda)'),
    crowdProfile: 'local',
    tips: L(
      'Oldest covered market — pick a stall, share plates, sit outside if warm.',
      'Mercado coberto mais antigo — escolha uma barraca, divida pratos, sente fora se fizer calor.',
    ),
  },
  'par-marche-aligre': {
    avgPricePerPerson: money(5, 15),
    durationMin: 40,
    durationMax: 90,
    bestTime: L('Morning until ~13:00–14:00', 'Manhã até ~13h–14h'),
    bestDay: L('Tue–Sun morning', 'Manhã de ter–dom'),
    crowdProfile: 'local',
    tips: L('Pair with Le Baron Rouge for wine after.', 'Combine com o Le Baron Rouge para vinho depois.'),
  },
  'par-marche-bastille': {
    avgPricePerPerson: money(5, 20),
    durationMin: 40,
    durationMax: 90,
    bestTime: L('Morning', 'Manhã'),
    bestDay: L('Thursday & Sunday mornings', 'Manhãs de quinta e domingo'),
    crowdProfile: 'local',
  },
  'par-rue-cler': {
    avgPricePerPerson: money(8, 25),
    durationMin: 30,
    durationMax: 75,
    bestTime: L('Morning market hours', 'Horário de manhã do mercado'),
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    crowdProfile: 'local',
    tips: L('Near the Tower — great picnic shopping street.', 'Perto da Torre — ótima rua para montar piquenique.'),
  },

  // —— Roteiro CSV (≤ €40) additions ——
  'par-place-dauphine': parkVisit({
    durationMin: 30,
    durationMax: 90,
    bestTime: L('Late afternoon / early evening 17:00–20:00', 'Final de tarde / início da noite 17h–20h'),
    tips: L('Quiet square — wine bars around the edges.', 'Praça calma — bares de vinho nas bordas.'),
  }),
  'par-cafe-flore': cafeVisit(15, 40, {
    bestTime: L('Early morning 7:30–10:00 or late afternoon', 'Manhã cedo 7h30–10h ou final da tarde'),
    bestDay: L('Weekday', 'Dia de semana'),
    tips: L('Iconic and pricey — coffee/pastry is enough.', 'Icônico e caro — café/pâtisserie basta.'),
  }),
  'par-rosa-bonheur': {
    avgPricePerPerson: money(15, 30),
    durationMin: 60,
    durationMax: 150,
    bestTime: L('Late afternoon into evening', 'Final de tarde até a noite'),
    bestDay: L('Wed–Sun from noon; weekends arrive early', 'Qua–dom a partir do meio-dia; fim de semana chegue cedo'),
    crowdProfile: 'nightlife',
    tips: L(
      'Inside Buttes-Chaumont — guinguette vibe, very local.',
      'Dentro do Buttes-Chaumont — clima de guinguette, bem local.',
    ),
  },
  'par-belleville': parkVisit({
    durationMin: 45,
    durationMax: 120,
    bestTime: L('Sunset', 'Pôr do sol'),
    tips: L('Best free panoramic view of the city skyline.', 'Melhor vista panorâmica grátis do skyline.'),
  }),
  'par-disneyland': {
    ticket: money(
      56,
      120,
      L(
        '1-day 1-park from ~€56; 2-park from ~€81+ (dynamic by date)',
        '1 dia 1 parque a partir de ~€56; 2 parques a partir de ~€81+ (dinâmico por data)',
      ),
    ),
    ticketUrl: 'https://tickets.disneylandparis.com/',
    durationMin: 480,
    durationMax: 720,
    duration: L('Full day (plan 8–12 h)', 'Dia inteiro (planeje 8–12 h)'),
    bestTime: L('Rope drop / first entry', 'Abertura / primeiros horários'),
    bestDay: L('Weekday outside school holidays', 'Dia de semana fora de férias escolares'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'RER A → Marne-la-Vallée–Chessy (~40 min from Châtelet / Gare de Lyon) + ~2 min walk to the gates.\n~€5/person round trip (Metro-Train-RER flat fare × 2).\nBuy a dated 1-day 2-park ticket online (official Disney site or GetYourGuide) — not sold at the gate on most days.\nOpens 09:30 — arrive ~30 min early. Start at Disney Adventure World (ex-Studios): Nemo + Ratatouille first, then Disneyland Park.\nFireworks ~22:30 (end ~23:30); leave ~10 min before the end for the RER. Last train toward Paris ~00:00.\nDisney Village (McDonald’s / Five Guys / Starbucks) is outside the gates — exit/re-entry OK.',
      'RER A → Marne-la-Vallée–Chessy (~40 min de Châtelet / Gare de Lyon) + ~2 min a pé até os portões.\n~€5/pessoa ida e volta (tarifa plana Metro-Train-RER × 2).\nCompre ingresso datado de 1 dia / 2 parques online (site oficial ou GetYourGuide) — na maioria dos dias não vende na porta.\nAbre 09h30 — chegue ~30 min antes. Comece no Disney Adventure World (ex-Studios): Nemo + Ratatouille primeiro, depois Disneyland Park.\nFogos ~22h30 (terminam ~23h30); saia ~10 min antes do fim para o RER. Último trem para Paris ~00h.\nDisney Village (McDonald’s / Five Guys / Starbucks) fica fora dos portões — dá pra sair e voltar.',
    ),
  },
  'par-versailles': {
    ticket: money(
      32,
      35,
      L(
        'Passport timed entry (estate); from 15:00 often cheaper',
        'Passport com horário (domínio); a partir das 15h costuma ser mais barato',
      ),
    ),
    ticketPromos: [
      PROMO_UNDER_18,
      PROMO_EU_UNDER_26,
      {
        kind: 'other',
        label: L(
          'Gardens free most days (fountain-show days may charge)',
          'Jardins grátis na maioria dos dias (dias de fontes podem cobrar)',
        ),
      },
    ],
    ticketUrl: 'https://en.chateauversailles.fr/plan-your-visit/tickets-and-prices',
    durationMin: 240,
    durationMax: 480,
    duration: L('Full day (Palace + gardens ± Trianon)', 'Dia inteiro (Palácio + jardins ± Trianon)'),
    bestTime: L('Arrive for opening (~9:00)', 'Chegue na abertura (~9h)'),
    bestDay: L('Tue–Fri; closed Monday', 'Ter–sex; fecha segunda'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Best: RER C → Versailles Château–Rive Gauche + ~10 min walk to Place d’Armes.\nAlternatives: SNCF N/U → Versailles Chantiers (~18 min walk) or L → Rive Droite (~17 min walk).\nBook Passport timed slot online (Palace + Trianon + gardens; shows on fountain days).\nGardens free most days; free under 18 / EU under 26 (still need a free timed slot).\nClosed Mon + 1 Jan / 1 May / 25 Dec.',
      'Melhor: RER C → Versailles Château–Rive Gauche + ~10 min a pé até a Place d’Armes.\nAlternativas: SNCF N/U → Versailles Chantiers (~18 min a pé) ou L → Rive Droite (~17 min a pé).\nReserve Passport com horário online (Palácio + Trianon + jardins; shows nos dias de fontes).\nJardins grátis na maioria dos dias; grátis <18 / UE <26 (ainda precisa de horário gratuito).\nFecha seg + 1 jan / 1 mai / 25 dez.',
    ),
  },
  'par-baron-rouge': {
    avgPricePerPerson: money(10, 25),
    durationMin: 30,
    durationMax: 90,
    bestTime: L('Sat–Sun morning for oysters; weekday evenings too', 'Sáb–dom de manhã para ostras; noites em dias de semana também'),
    crowdProfile: 'local',
    tips: L(
      'Wine from the barrel + market next door (Aligre).',
      'Vinho do barril + mercado ao lado (Aligre).',
    ),
  },
  'par-promenade-plantee': parkVisit({
    durationMin: 45,
    durationMax: 120,
    bestTime: L('Morning or late afternoon', 'Manhã ou final da tarde'),
    tips: L(
      'Elevated park walk from Bastille — cooler alternative to the Tuileries crowds.',
      'Passeio elevado a partir da Bastille — alternativa mais fresca à multidão das Tuileries.',
    ),
  }),

  // —— Rome ——
  'rom-fco': {
    ticket: free,
    durationMin: 60,
    durationMax: 120,
    bestTime: L('Off-peak flights when possible', 'Voos fora de pico quando possível'),
    bestDay: L('Mid-week arrivals are calmer', 'Chegadas no meio da semana são mais calmas'),
    crowdProfile: 'airport',
    tips: L(
      'Leonardo Express to Roma Termini ~€14, ~32 min (non-stop). FL1 regional is cheaper but slower / more stops. Buy tickets before boarding — validate if paper. Taxis use fixed fares into the city center.',
      'Leonardo Express até Roma Termini ~€14, ~32 min (direto). FL1 regional é mais barato, mas mais lento / com paradas. Compre o bilhete antes de embarcar — valide se for papel. Táxi tem tarifa fixa para o centro.',
    ),
  },
  'rom-termini': {
    ticket: free,
    durationMin: 15,
    durationMax: 40,
    bestTime: L('Anytime — watch pickpockets in the hall', 'Qualquer hora — atenção a carteiristas no saguão'),
    crowdProfile: 'transit',
    tips: L(
      'Metro A (orange) and B/B1 (blue) under the station. High-speed (Frecciarossa/Italo) and Leonardo Express from FCO. Keep bags close — busy tourist station.',
      'Metrô A (laranja) e B/B1 (azul) sob a estação. Alta velocidade (Frecciarossa/Italo) e Leonardo Express de FCO. Cuide das malas — estação turística e movimentada.',
    ),
  },
  'rom-gallina-bianca': restaurantVisit(14, 22, {
    tips: L(
      'Go for the carbonara (~€14). Truffle carbonara was ~€18. Book or arrive early — tourist-heavy near Termini.',
      'Vá de carbonara (~€14). A trufada saiu ~€18. Reserve ou chegue cedo — zona turística perto da Termini.',
    ),
  }),
  'rom-alfredo-ada': restaurantVisit(12, 18, {
    tips: L(
      'Homey pastas and lasagna. Small room — lunch is easier than dinner without a booking.',
      'Massas e lasanha de casa. Sala pequena — almoço é mais fácil que jantar sem reserva.',
    ),
  }),
  'rom-antico-vinaio': restaurantVisit(12, 15, {
    tips: L(
      'Schiacciata sandwiches ~€12. Lines move; delivery exists. Near the Pantheon (Piazza della Maddalena).',
      'Sanduíches de schiacciata ~€12. Fila anda; tem delivery. Perto do Panteão (Piazza della Maddalena).',
    ),
  }),
  'rom-baffetto': restaurantVisit(12, 18, {
    tips: L(
      'Individual pizzas ~€8–15. Expect a queue at peak; thin Roman-style crust.',
      'Pizza individual ~€8–15. Espere fila no pico; massa fina à romana.',
    ),
  }),
  'rom-suppli': restaurantVisit(4, 8, {
    avgPricePerPerson: money(4, 8),
    tips: L(
      'Rice balls ~€2 each — try cacio e pepe, carbonara, or plain cheese. Perfect walk-and-eat stop in Trastevere.',
      'Bolinhos ~€2 cada — experimente cacio e pepe, carbonara ou queijo. Ótimo para comer andando em Trastevere.',
    ),
  }),
  'rom-norcineria': restaurantVisit(6, 12, {
    tips: L(
      'Porchetta sandwich is the move. Classic norcineria hours (often closed mid-afternoon).',
      'O sanduíche de porchetta é o pedido. Horário de norcineria (muitas vezes fecha no meio da tarde).',
    ),
  }),
  'rom-said': cafeVisit(4, 8, {
    tips: L(
      'Gelato / chocolate scoops ~€2.40–3.40. Historic brand since 1923 — also a full chocolate café concept.',
      'Sorvete / chocolate ~€2,40–3,40 a unidade. Marca histórica desde 1923 — também café de chocolate completo.',
    ),
  }),
  'rom-forno-trevi': cafeVisit(3, 6, {
    tips: L(
      'Stand at the counter facing Trevi: plain croissant €1.50, chocolate €2.30, pistachio €3; americano €1.60. Sitting costs more.',
      'Coma na bancada em pé de frente para a Trevi: croissant €1,50, chocolate €2,30, pistache €3; americano €1,60. Sentar custa mais.',
    ),
  }),
  'rom-colosseum': {
    ticket: money(
      16,
      24,
      L(
        '~€16–18 Colosseum + Forum + Palatine; ~€22–24 with arena floor',
        '~€16–18 Coliseu + Fórum + Palatino; ~€22–24 com acesso à arena',
      ),
    ),
    ticketUrl: 'https://colosseo.it/en/ticket/',
    durationMin: 90,
    durationMax: 180,
    bestTime: L('First entry slot of the day', 'Primeiro horário do dia'),
    bestDay: L('Weekday; book timed entry always', 'Dia de semana; reserve horário sempre'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Same ticket usually covers Forum & Palatine. Arena upgrade is the ~€22–24 band. Security is the time sink.',
      'O mesmo ingresso costuma incluir Fórum e Palatino. Upgrade da arena fica na faixa ~€22–24. A segurança come o tempo.',
    ),
  },
  'rom-forum': {
    ticket: money(
      16,
      18,
      L(
        'Usually included with Colosseum combo (~€16–18)',
        'Em geral no combo do Coliseu (~€16–18)',
      ),
    ),
    ticketUrl: 'https://colosseo.it/en/ticket/',
    durationMin: 75,
    durationMax: 150,
    bestTime: L('Morning with Colosseum loop', 'Manhã no circuito do Coliseu'),
    bestDay: L('Weekday', 'Dia de semana'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Wear shoes for uneven stones. Pair with Colosseum the same day — one timed ticket.',
      'Use sapato bom para pedras irregulares. Combine com o Coliseu no mesmo dia — um ingresso com horário.',
    ),
  },
  'rom-pantheon': museumVisit(5, {
    ticketUrl: 'https://www.pantheonroma.com/',
    durationMin: 30,
    durationMax: 60,
    bestTime: L('Opening hour or late afternoon', 'Na abertura ou fim da tarde'),
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    tips: L(
      'Adult ~€5. Look up for the oculus — free rain on wet days. Modest dress not required like churches, but still a basilica.',
      'Adulto ~€5. Olhe o óculo no teto — chuva entra em dias molhados. Ainda é basílica; respeito no interior.',
    ),
  }),
  'rom-piazza-venezia': landmarkOutdoor({
    durationMin: 15,
    durationMax: 30,
    bestTime: L('Anytime as orientation hub', 'Qualquer hora como ponto de orientação'),
    tips: L(
      'Traffic square under the Vittoriano — good photo + metro orientation, not a long stay.',
      'Praça de trânsito sob o Vittoriano — boa foto e orientação de metrô, não é parada longa.',
    ),
  }),
  'rom-trevi': landmarkOutdoor({
    durationMin: 20,
    durationMax: 45,
    bestTime: L('Before 8:00 or late night', 'Antes das 8h ou de madrugada'),
    bestDay: L('Weekday early morning', 'Manhã cedo em dia de semana'),
    tips: L(
      'Viewing the fountain is free. A closer controlled access can cost ~€2 — optional. Pair with the Forno croissants across the square.',
      'Ver a fonte é grátis. Acesso controlado mais perto pode custar ~€2 — opcional. Combine com croissants do Forno na praça.',
    ),
  }),
  'rom-vatican': museumVisit(
    { min: 20, max: 30 },
    {
      ticketUrl: 'https://tickets.museivaticani.va/',
      durationMin: 150,
      durationMax: 300,
      duration: L('3–5 hours (museums + Sistine)', '3–5 horas (museus + Sistina)'),
      bestTime: L('First morning slot', 'Primeiro horário da manhã'),
      bestDay: L('Weekday; skip free last-Sunday if you hate crowds', 'Dia de semana; evite domingo grátis se odiar fila'),
      tips: L(
        'St. Peter’s Square is free; museums are paid and include the route to the Sistine Chapel. Book online, dress code (shoulders/knees).',
        'A praça de São Pedro é grátis; museus são pagos e incluem o caminho da Capela Sistina. Reserve online, dress code (ombros/joelhos).',
      ),
    },
  ),
  'rom-sistine': museumVisit(
    { min: 20, max: 30 },
    {
      ticketUrl: 'https://tickets.museivaticani.va/',
      durationMin: 30,
      durationMax: 60,
      bestTime: L('Right after museum opening (before the crush)', 'Logo na abertura do museu (antes da multidão)'),
      bestDay: L('Weekday morning', 'Manhã de dia de semana'),
      tips: L(
        'Not a separate ticket from the Vatican Museums. No photos inside. Exit may dump you near St. Peter’s — perfect order: museums → Sistine → Basilica.',
        'Não é ingresso separado dos Museus do Vaticano. Sem fotos no interior. A saída pode te deixar perto de São Pedro — ordem ideal: museus → Sistina → Basílica.',
      ),
    },
  ),
  'rom-st-peter': {
    ticket: {
      currency: 'EUR',
      free: true,
      note: L(
        'Basilica free; dome climb paid (stairs cheaper than lift)',
        'Basílica grátis; cúpula paga (escada mais barata que elevador)',
      ),
    },
    ticketUrl: 'https://www.basilicasanpietro.va/',
    durationMin: 45,
    durationMax: 120,
    bestTime: L('Early morning before security peaks', 'Cedo de manhã antes do pico da segurança'),
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    crowdProfile: 'tourist-heavy',
    tips: L(
      'Entry free with security screening. Dome (cupola) is a separate fee. Strict dress code — cover shoulders and knees.',
      'Entrada grátis com segurança. Cúpula é taxa à parte. Dress code rígido — cubra ombros e joelhos.',
    ),
  },
  'rom-vittoriano': landmarkOutdoor({
    durationMin: 30,
    durationMax: 75,
    bestTime: L('Late afternoon light on the façade', 'Luz de fim de tarde na fachada'),
    tips: L(
      'Monument and terraces are free. Great panorama over the Forum side and Piazza Venezia. Elevator to higher terrace may have a small fee — check on site.',
      'Monumento e terraços são gratuitos. Ótima vista para o Fórum e a Piazza Venezia. Elevador do terraço alto pode ter taxa — confira no local.',
    ),
  }),
  'rom-window-on-rome': lodgingVisit(100, 180, {
    bestTime: L(
      'Check-in afternoon; evenings out in Trastevere',
      'Check-in à tarde; noites saindo em Trastevere',
    ),
    tips: L(
      'Guest house on Piazza Sonnino in Trastevere (Canal dos Caçadores tip). Strong nightlife / dinner neighborhood — walkable bars and restaurants after dark. Cross the Tiber for Centro Storico. Confirm nightly rate on booking sites.',
      'Hospedagem na Piazza Sonnino, em Trastevere (indicação do Canal dos Caçadores). Bairro bom pra sair a noitinha — bares e restaurantes a pé. Cruza o Tibre pro Centro Histórico. Confirme o valor da diária no site de reserva.',
    ),
  }),
};

/** Merge curated visit onto a place (place.visit wins). */
export function resolveVisit(placeId: string, inline?: VisitInfo): VisitInfo | undefined {
  if (inline) return inline;
  return visitByPlaceId[placeId];
}

export function formatMoney(m: MoneyInfo, locale: Locale = 'en'): string {
  if (m.free) return locale === 'pt-BR' ? 'Grátis' : 'Free';

  const sym =
    m.currency === 'EUR' ? '€' : m.currency === 'BRL' ? 'R$' : '$';

  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.00$/, '');

  if (m.min != null && m.max != null && m.min !== m.max) {
    return `${sym}${fmt(m.min)}–${fmt(m.max)}`;
  }
  if (m.min != null) return `${sym}${fmt(m.min)}`;
  if (m.max != null) return `${sym}${fmt(m.max)}`;
  return '—';
}

/**
 * Typical / average price only (single figure) — for day-budget math.
 * Place cards use `formatMoney` (full min–max range) instead.
 * Curated food ranges store min = typical, max = upper bound.
 */
export function formatMoneyTypical(
  m: MoneyInfo,
  locale: Locale = 'en',
): string {
  if (m.free) return locale === 'pt-BR' ? 'Grátis' : 'Free';

  const sym =
    m.currency === 'EUR' ? '€' : m.currency === 'BRL' ? 'R$' : '$';

  const n = m.min ?? m.max;
  if (n == null || !Number.isFinite(n)) return '—';

  const fmt = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.00$/, '');
  return `${sym}${fmt}`;
}

/**
 * Price-per-person affordability level for the $ $ $ chip (0–3).
 * - 0 free (all icons light gray)
 * - 1 €1–15 green
 * - 2 €16–39 yellow
 * - 3 €40+ red
 * Uses typical spend (`min`, same as formatMoneyTypical).
 */
export type PriceLevel = 0 | 1 | 2 | 3;

export function priceLevelFromMoney(m: MoneyInfo): PriceLevel {
  if (m.free) return 0;
  const n = m.min ?? m.max;
  if (n == null || !Number.isFinite(n) || n <= 0) return 0;
  if (n <= 15) return 1;
  if (n <= 39) return 2;
  return 3;
}

export function formatDuration(
  visit: VisitInfo,
  locale: Locale = 'en',
): string | null {
  if (visit.duration) return visit.duration[locale] ?? visit.duration.en;

  const { durationMin: min, durationMax: max } = visit;
  if (min == null && max == null) return null;

  const h = (mins: number) => {
    if (mins < 60) {
      return locale === 'pt-BR' ? `${mins} min` : `${mins} min`;
    }
    const hours = mins / 60;
    if (Number.isInteger(hours)) {
      return locale === 'pt-BR'
        ? `${hours} h`
        : `${hours}h`;
    }
    const whole = Math.floor(hours);
    const rem = mins % 60;
    return locale === 'pt-BR'
      ? `${whole} h ${rem} min`
      : `${whole}h ${rem}m`;
  };

  if (min != null && max != null && min !== max) {
    // compact for common ranges
    if (min >= 60 && max >= 60) {
      const a = min / 60;
      const b = max / 60;
      const fa = Number.isInteger(a) ? String(a) : a.toFixed(1).replace(/\.0$/, '');
      const fb = Number.isInteger(b) ? String(b) : b.toFixed(1).replace(/\.0$/, '');
      return locale === 'pt-BR' ? `${fa}–${fb} h` : `${fa}–${fb}h`;
    }
    return `${h(min)} – ${h(max)}`;
  }
  return h(min ?? max!);
}

/** Fields shown on the place card (only non-empty). */
export type VisitFieldKey =
  | 'avgPrice'
  | 'pricePerNight'
  | 'ticket'
  | 'ticketPromo'
  | 'duration'
  | 'bestTime'
  | 'bestDay'
  | 'tips';

/** One display line for a structured ticket promo. */
export function formatTicketPromo(
  promo: TicketPromo,
  locale: Locale = 'en',
): string {
  return promo.label[locale] ?? promo.label.en;
}

export function visitFieldsForDisplay(
  visit: VisitInfo,
  locale: Locale = 'en',
): { key: VisitFieldKey; value: string; note?: string }[] {
  const out: { key: VisitFieldKey; value: string; note?: string }[] = [];

  if (visit.avgPricePerPerson) {
    out.push({
      key: 'avgPrice',
      // Place card: full range. Day budget uses moneyTypicalEur (min) separately.
      value: formatMoney(visit.avgPricePerPerson, locale),
      note: visit.avgPricePerPerson.note
        ? visit.avgPricePerPerson.note[locale] ?? visit.avgPricePerPerson.note.en
        : undefined,
    });
  }
  if (visit.pricePerNight) {
    out.push({
      key: 'pricePerNight',
      // Full min–max range (hotels show a band, not a single typical plate price)
      value: formatMoney(visit.pricePerNight, locale),
      note: visit.pricePerNight.note
        ? visit.pricePerNight.note[locale] ?? visit.pricePerNight.note.en
        : undefined,
    });
  }
  if (visit.ticket) {
    const promoNote =
      visit.ticketPromos && visit.ticketPromos.length > 0
        ? visit.ticketPromos.map((p) => formatTicketPromo(p, locale)).join(' · ')
        : undefined;
    const moneyNote = visit.ticket.note
      ? visit.ticket.note[locale] ?? visit.ticket.note.en
      : undefined;
    out.push({
      key: 'ticket',
      value: formatMoney(visit.ticket, locale),
      note: [moneyNote, promoNote].filter(Boolean).join(' · ') || undefined,
    });
  }
  const dur = formatDuration(visit, locale);
  if (dur) out.push({ key: 'duration', value: dur });
  if (visit.bestTime) {
    out.push({
      key: 'bestTime',
      value: visit.bestTime[locale] ?? visit.bestTime.en,
    });
  }
  if (visit.bestDay) {
    out.push({
      key: 'bestDay',
      value: visit.bestDay[locale] ?? visit.bestDay.en,
    });
  }
  if (visit.tips) {
    out.push({
      key: 'tips',
      value: visit.tips[locale] ?? visit.tips.en,
    });
  }
  return out;
}
