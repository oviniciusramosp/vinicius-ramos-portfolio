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

export interface VisitInfo {
  /** Restaurants / cafés: typical spend per person (food + drink). */
  avgPricePerPerson?: MoneyInfo;
  /** Entrance / event ticket (adult full price when applicable). */
  ticket?: MoneyInfo;
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

function restaurantVisit(
  min: number,
  max: number,
  partial: Partial<VisitInfo> = {},
): VisitInfo {
  // No duration / bestTime for restaurants — not meaningful for a meal stop.
  return {
    avgPricePerPerson: money(min, max),
    bestDay: L('Weekdays, lunch', 'Dias de semana, almoço'),
    tips: L(
      'Weekday lunch is easier for a table. Book ahead for dinner; walk-ins work better at lunch.',
      'Almoço de semana é mais fácil para conseguir mesa. Reserve para jantar; no almoço costuma rolar sem reserva.',
    ),
    ...partial,
  };
}

function cafeVisit(
  min: number,
  max: number,
  partial: Partial<VisitInfo> = {},
): VisitInfo {
  // No duration — pastry / coffee stops are open-ended.
  return {
    avgPricePerPerson: money(min, max),
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
  partial: Partial<VisitInfo> = {},
): VisitInfo {
  const ticket: MoneyInfo =
    typeof price === 'number'
      ? money(price)
      : price.free
        ? free
        : money(price.min, price.max);

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
    ...partial,
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
 * Curated visit info keyed by place id.
 * Paris places are fully covered; other cities can be filled later.
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

  // —— Parks & walks ——
  'par-champ-mars': parkVisit({
    durationMin: 45,
    durationMax: 150,
    bestTime: L('Sunset picnic (1h before dusk)', 'Piquenique no pôr do sol (1h antes do escurecer)'),
    bestDay: L('Weekday evening', 'Noite de dia de semana'),
    tips: L(
      'Best lawn views of the Tower. Security checks on big event days.',
      'Melhor gramado com vista da Torre. Controle de segurança em dias de evento.',
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
    durationMin: 20,
    durationMax: 45,
    bestTime: L('Sunrise or dusk (tower lights)', 'Nascer do sol ou entardecer (luzes da torre)'),
    tips: L(
      'Classic Tower postcard angle. Watch for street scams and vendors.',
      'Ângulo clássico de cartão-postal da Torre. Cuidado com golpes e ambulantes.',
    ),
  }),
  'par-louvre': museumVisit(32, {
    ticketUrl: 'https://www.ticket.louvre.fr/en',
    durationMin: 150,
    durationMax: 300,
    duration: L('3–5 hours (or two short visits)', '3–5 horas (ou duas visitas curtas)'),
    bestTime: L('Wed/Fri evening opening; otherwise right at 09:00', 'Noite de qua/sex; senão logo às 09h'),
    bestDay: L(
      'Wednesday or Friday evening; free first Friday after 18:00 (not Jul/Aug)',
      'Quarta ou sexta à noite; grátis 1ª sexta após 18h (exceto jul/ago)',
    ),
    tips: L(
      'Closed Tuesdays. Book timed entry. Pick wings in advance — you will not see everything.',
      'Fecha terça. Reserve horário. Escolha alas antes — você não vê tudo.',
    ),
    osmRef: 'relation/7515426',
  }),
  'par-orsay': museumVisit(16, {
    ticketUrl: 'https://www.musee-orsay.fr/en/visit',
    durationMin: 120,
    durationMax: 210,
    bestTime: L('Opening or Thursday late opening', 'Abertura ou quinta com horário estendido'),
    bestDay: L(
      'Tuesday–Thursday; free first Sunday (crowded) — book even if free',
      'Ter–qui; grátis 1º domingo (lotado) — reserve mesmo se for grátis',
    ),
    osmRef: 'way/63178753',
    tips: L(
      'Closed Monday. Famous clock window for photos; Impressionists upstairs.',
      'Fecha segunda. Relógio famoso para fotos; impressionistas no andar de cima.',
    ),
  }),
  'par-orangerie': museumVisit(12.5, {
    ticketUrl: 'https://www.musee-orangerie.fr/en',
    durationMin: 60,
    durationMax: 100,
    bestTime: L('Opening hour', 'Horário de abertura'),
    bestDay: L(
      'Weekday; free first Sunday (book ahead)',
      'Dia de semana; grátis 1º domingo (reserve)',
    ),
    osmRef: 'way/54188996',
    tips: L(
      'Monet Water Lilies oval rooms are the highlight. Pair with Tuileries walk.',
      'Salas ovais dos Nenúfares do Monet são o destaque. Combine com as Tuileries.',
    ),
  }),
  'par-fondation-lv': museumVisit(
    { min: 16, max: 20 },
    {
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
    ticketUrl: 'https://www.chateau-de-vincennes.fr/en',
    durationMin: 75,
    durationMax: 120,
    bestTime: L('Morning after town stroll', 'Manhã depois de andar na cidade'),
    bestDay: L(
      'Weekday; free first Sundays Nov–Mar (check site)',
      'Dia de semana; grátis 1ºs domingos nov–mar (confira site)',
    ),
    tips: L(
      'Medieval keep + walls. Free under 18 / EU under 26 residents.',
      'Donjon medieval + muralhas. Grátis <18 / residentes UE <26.',
    ),
  }),
  'par-arc-triomphe': museumVisit(16, {
    ticketUrl: 'https://www.paris-arc-de-triomphe.fr/en/',
    durationMin: 45,
    durationMax: 75,
    bestTime: L('Sunset from the terrace', 'Pôr do sol no terraço'),
    bestDay: L('Weekday late afternoon', 'Fim de tarde em dia de semana'),
    osmRef: 'way/226413508',
    tips: L(
      'Use the underground passage — never cross the roundabout at street level.',
      'Use a passagem subterrânea — nunca atravesse a rotatória no nível da rua.',
    ),
  }),
  'par-sainte-chapelle': museumVisit(13, {
    ticketUrl: 'https://www.sainte-chapelle.fr/en/',
    durationMin: 45,
    durationMax: 75,
    bestTime: L('Bright daylight for the stained glass', 'Dia claro para os vitrais'),
    bestDay: L('Weekday morning', 'Manhã de dia de semana'),
    osmRef: 'relation/3344870',
    tips: L(
      'Upper chapel is the wow. Security queue can be long — book ahead.',
      'A capela superior é o show. Fila de segurança pode ser longa — reserve.',
    ),
  }),
  'par-pantheon': museumVisit(13, {
    ticketUrl: 'https://www.paris-pantheon.fr/en/',
    durationMin: 60,
    durationMax: 90,
    bestTime: L('Morning in the Latin Quarter loop', 'Manhã no circuito do Quartier Latin'),
    tips: L(
      'Dome climb when open is worth it for views. Crypt for great names of France.',
      'Subida à cúpula (quando aberta) vale pela vista. Cripta com nomes da França.',
    ),
  }),
  'par-invalides': museumVisit(16, {
    ticketUrl: 'https://www.musee-armee.fr/en/',
    durationMin: 90,
    durationMax: 150,
    tips: L(
      'Army museum + Napoleon’s tomb under the golden dome.',
      'Museu do Exército + túmulo de Napoleão sob a cúpula dourada.',
    ),
  }),
  'par-pompidou': museumVisit(15, {
    ticketUrl: 'https://www.centrepompidou.fr/en/',
    durationMin: 90,
    durationMax: 150,
    bestTime: L('Late afternoon; roof views near closing', 'Fim da tarde; vista do topo perto de fechar'),
    tips: L(
      'Modern art + exterior escalators. Check renovation / partial closure notices.',
      'Arte moderna + escadas externas. Confira avisos de reforma / fechamento parcial.',
    ),
  }),
  'par-montparnasse': museumVisit(22, {
    ticketUrl: 'https://www.tourmontparnasse.net/en/',
    durationMin: 45,
    durationMax: 75,
    bestTime: L('Sunset into early evening', 'Pôr do sol até o início da noite'),
    bestDay: L('Clear-sky days only', 'Só em dias de céu limpo'),
    tips: L(
      'Best classic view of the Eiffel Tower skyline. Go for weather, not just the clock.',
      'Melhor vista clássica da Torre no skyline. Vá pelo clima, não só pelo horário.',
    ),
  }),
  'par-opera': museumVisit(15, {
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
      'No menu stress: steak-frites + secret sauce. Expect a queue.',
      'Sem estresse de cardápio: steak-frites + molho secreto. Espere fila.',
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
    bestDay: L('Weekdays, afternoon', 'Dias de semana, tarde'),
    tips: L(
      'Paris terrace vibe for a drink watching the street and Line 6 — open square in front.',
      'Esplanada para tomar algo olhando a rua e a linha 6 — praça aberta na frente.',
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
      'Brunch spot — weekends fill up fast; weekday is easier for a table.',
      'Spot de brunch — fim de semana enche rápido; dia de semana é mais fácil para mesa.',
    ),
  }),
  'par-arnaud-nicolas': restaurantVisit(25, 50, {
    tips: L('Charcuterie craft — good for a refined snack plate.', 'Charcutaria de ofício — bom para petiscos refinados.'),
  }),

  // —— Cafés / pastry ——
  'par-bake-blend': cafeVisit(6, 14),
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
    tips: L('Croissant / bakery stop — morning best.', 'Parada de croissant — melhor de manhã.'),
  }),
  'par-maison-doucet': cafeVisit(4, 10, {
    tips: L('Butter-first croissant priorities.', 'Prioridade croissant de manteiga.'),
  }),
  'par-jeffrey-cagnes': cafeVisit(6, 14),
  'par-michalak': cafeVisit(8, 20),
  'par-amorino': cafeVisit(5, 12, {
    tips: L('Gelato flower scoops — touristy but fun on a warm day.', 'Gelato em flor — turístico, mas legal no calor.'),
  }),

  // —— Shopping (soft “visit”) ——
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
  | 'ticket'
  | 'duration'
  | 'bestTime'
  | 'bestDay'
  | 'tips';

export function visitFieldsForDisplay(
  visit: VisitInfo,
  locale: Locale = 'en',
): { key: VisitFieldKey; value: string; note?: string }[] {
  const out: { key: VisitFieldKey; value: string; note?: string }[] = [];

  if (visit.avgPricePerPerson) {
    out.push({
      key: 'avgPrice',
      value: formatMoney(visit.avgPricePerPerson, locale),
      note: visit.avgPricePerPerson.note
        ? visit.avgPricePerPerson.note[locale] ?? visit.avgPricePerPerson.note.en
        : undefined,
    });
  }
  if (visit.ticket) {
    out.push({
      key: 'ticket',
      value: formatMoney(visit.ticket, locale),
      note: visit.ticket.note
        ? visit.ticket.note[locale] ?? visit.ticket.note.en
        : undefined,
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
