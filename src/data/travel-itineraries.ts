/**
 * Day-by-day city itineraries (suggested routes).
 * Stops reference place ids from travel.ts — resolve at render time.
 *
 * When generating or revising itineraries (LLM or hand-edit), prefer places
 * with `favorite: true` and high personal `rating` from travel.ts.
 */

import type { LString, TravelPlace } from './travel';
import {
  resolveVisit,
  type MoneyInfo,
  type VisitInfo,
} from './travel-visit';

export type ItinerarySlot = 'morning' | 'afternoon' | 'evening';

export type ItineraryStop = {
  /** Place id in the city places list */
  placeId: string;
  /** Clock time "HH:mm" (24h), optional */
  time?: string;
  slot?: ItinerarySlot;
  /** Soft alternative / optional stop */
  optional?: boolean;
  note?: LString;
  /**
   * Include place ticket in day budget (default true).
   * Set false for exterior-only visits (e.g. Eiffel base, no summit).
   */
  countTicket?: boolean;
  /** Include food price in day budget (default true). */
  countFood?: boolean;
};

/**
 * Alternate full-day stop list (e.g. Day 1 ORY vs CDG arrival).
 * When present on a day, the day card shows a segment control.
 */
export type ItineraryArrivalOption = {
  /** Stable id — also used as legs key suffix (`dayId:arrivalId`) when not default */
  id: string;
  label: LString;
  title: LString;
  summary?: LString;
  stops: ItineraryStop[];
  /** When true, legs live at `day.id` (no suffix). Default: first option. */
  default?: boolean;
};

export type ItineraryDay = {
  id: string;
  /** 1-based day index within the itinerary */
  day: number;
  title: LString;
  summary?: LString;
  /**
   * Default / primary stops. When `arrivals` is set, this matches the default
   * arrival option (usually ORY) so helpers/tests keep working unchanged.
   */
  stops: ItineraryStop[];
  /** Segment-control options that swap the full day route (arrival variants). */
  arrivals?: ItineraryArrivalOption[];
};

export type TravelItinerary = {
  id: string;
  title: LString;
  subtitle?: LString;
  days: ItineraryDay[];
};

/**
 * Shared Day 1 after first bags at Casa do Gui:
 * market → back home → Tower loop → dinner → home.
 */
const parisD1AfterBase: ItineraryStop[] = [
  {
    placeId: 'par-auchan-noisy',
    time: '12:25',
    slot: 'morning',
    note: {
      en: '~45 min full supermarket (~€15/person) — water, breakfast, snacks, basics. Then walk back home to drop bags.',
      'pt-BR':
        '~45 min no supermercado completo (~€15/pessoa) — água, café, lanches, básicos. Depois volta a pé para casa com as compras.',
    },
  },
  {
    placeId: 'par-casa-do-gui',
    time: '13:20',
    slot: 'morning',
    note: {
      en: 'Drop groceries, light reset at home (~30–40 min). Afternoon leaves from here toward Trocadéro.',
      'pt-BR':
        'Guardar compras e reset leve em casa (~30–40 min). A tarde sai daqui rumo ao Trocadéro.',
    },
  },
  {
    placeId: 'par-trocadero',
    time: '14:45',
    slot: 'afternoon',
    note: {
      en: 'Leave home base for the Tower area (RER E + M9). Long first view (~50–60 min) — steps, fountains, classic postcard panorama.',
      'pt-BR':
        'Saída da base para a região da Torre (RER E + M9). Primeira vista longa (~50–60 min) — escadaria, fontes, panorama clássico de cartão-postal.',
    },
  },
  {
    placeId: 'par-eiffel',
    time: '15:50',
    slot: 'afternoon',
    countTicket: false,
    note: {
      en: 'Walk down from Trocadéro with the Tower in view. Exterior only (~30–40 min) — no summit tickets today.',
      'pt-BR':
        'Desça o Trocadéro ainda vendo a Torre. Só por fora (~30–40 min) — sem ingresso do topo hoje.',
    },
  },
  {
    placeId: 'par-bake-blend',
    time: '16:35',
    slot: 'afternoon',
    note: {
      en: 'Grab bakery + coffee to go (~20–25 min) — eat while walking to the Champ de Mars.',
      'pt-BR':
        'Pegue padaria + café para levar (~20–25 min) — coma andando até o Champ de Mars.',
    },
  },
  {
    placeId: 'par-champ-mars',
    time: '17:05',
    slot: 'afternoon',
    note: {
      en: 'Long lawn pause (~60–75 min) under the Tower — picnic what you grabbed, photos, first outdoor Paris breath.',
      'pt-BR':
        'Parada longa no gramado (~60–75 min) sob a Torre — piquenique do que pegou, fotos, primeiro respiro ao ar livre.',
    },
  },
  {
    placeId: 'par-rue-cler',
    time: '18:20',
    slot: 'afternoon',
    optional: true,
    note: {
      en: 'Optional food street stroll if energy remains (~30 min).',
      'pt-BR': 'Opcional: rua de comida se ainda tiver energia (~30 min).',
    },
  },
  {
    placeId: 'par-royal-cambronne',
    time: '19:15',
    slot: 'evening',
    note: {
      en: 'Dinner near the 15th / Tower area (~75–90 min, ~€18/person). Stay under the €50 food day cap.',
      'pt-BR':
        'Jantar perto do 15ème / Torre (~75–90 min, ~€18/pessoa). Manter o dia de comida sob €50.',
    },
  },
  {
    placeId: 'par-casa-do-gui',
    time: '21:15',
    slot: 'evening',
    note: {
      en: 'Back to home base — M6 + M13 + RER E from Cambronne (~50–60 min).',
      'pt-BR':
        'Volta para a base — M6 + M13 + RER E a partir de Cambronne (~50–60 min).',
    },
  },
];

const parisD1OryStops: ItineraryStop[] = [
  {
    placeId: 'par-ory',
    time: '09:00',
    slot: 'morning',
    note: {
      en: 'Friday morning landing — bags + exit to Métro 14.',
      'pt-BR': 'Sexta de manhã — bagagem e saída para o Metrô 14.',
    },
  },
  {
    placeId: 'par-orly-m14',
    time: '09:45',
    slot: 'morning',
    note: {
      en: 'Buy Navigo Easy for everyone here (closest RATP after landing). Load rides / day fare.',
      'pt-BR':
        'Compre Navigo Easy para todos aqui (RATP mais perto após o desembarque). Carregue viagens / dia.',
    },
  },
  {
    placeId: 'par-orly-paul',
    time: '10:15',
    slot: 'morning',
    note: {
      en: 'Breakfast at the airport (~€6–10/person) before the long ride east.',
      'pt-BR':
        'Café da manhã no aeroporto (~€6–10/pessoa) antes do trajeto para o leste.',
    },
  },
  {
    placeId: 'par-noisy-le-sec-rer',
    time: '11:30',
    slot: 'morning',
    note: {
      en: 'M14 → Saint-Lazare, then RER E to Noisy-le-Sec.',
      'pt-BR': 'M14 → Saint-Lazare, depois RER E até Noisy-le-Sec.',
    },
  },
  {
    placeId: 'par-casa-do-gui',
    time: '11:50',
    slot: 'morning',
    note: {
      en: 'Drop bags / quick reset at home base (~20–30 min), then short walk to Auchan.',
      'pt-BR':
        'Deixar malas / reset rápido na base (~20–30 min), depois caminhada curta até o Auchan.',
    },
  },
  ...parisD1AfterBase,
];

const parisD1CdgStops: ItineraryStop[] = [
  {
    placeId: 'par-cdg',
    time: '09:00',
    slot: 'morning',
    note: {
      en: 'Friday morning landing — Terminal 2 toward PAUL + RER B.',
      'pt-BR': 'Sexta de manhã — Terminal 2 rumo ao PAUL + RER B.',
    },
  },
  {
    placeId: 'par-cdg-paul',
    time: '09:40',
    slot: 'morning',
    note: {
      en: 'Breakfast on the way to the RER (~€6–10/person).',
      'pt-BR': 'Café da manhã a caminho do RER (~€6–10/pessoa).',
    },
  },
  {
    placeId: 'par-cdg-rer',
    time: '10:15',
    slot: 'morning',
    note: {
      en: 'Buy Navigo Easy at CDG 2 TGV machines, then board RER B toward Paris.',
      'pt-BR':
        'Compre Navigo Easy nas máquinas do CDG 2 TGV e pegue o RER B para Paris.',
    },
  },
  {
    placeId: 'par-noisy-le-sec-rer',
    time: '11:45',
    slot: 'morning',
    note: {
      en: 'RER B → Magenta, then RER E east to Noisy-le-Sec (~50–70 min total).',
      'pt-BR':
        'RER B → Magenta, depois RER E leste até Noisy-le-Sec (~50–70 min no total).',
    },
  },
  {
    placeId: 'par-casa-do-gui',
    time: '12:05',
    slot: 'morning',
    note: {
      en: 'Drop bags / quick reset at home base (~15–20 min), then short walk to Auchan.',
      'pt-BR':
        'Deixar malas / reset rápido na base (~15–20 min), depois caminhada curta até o Auchan.',
    },
  },
  ...parisD1AfterBase,
];

/**
 * Paris — 6-day suggestion (arrival Friday + 5 full days; calendar dates ignored).
 * Food target ~€50/person/day; Day 1 tickets = transport (Navigo) only.
 * Day 1 supports ORY vs CDG arrival via segment control.
 */
export const parisItinerary: TravelItinerary = {
  id: 'paris-6-days',
  title: {
    en: '6-day Paris route',
    'pt-BR': 'Roteiro de 6 dias em Paris',
  },
  subtitle: {
    en: 'Friday arrival (Orly or CDG → home → market → home → Eiffel area → home) then classic loops — west axis, left bank, Versailles, right bank, east parks.',
    'pt-BR':
      'Chegada sexta (Orly ou CDG → casa → mercado → casa → Torre → casa) e depois loops clássicos — eixo oeste, margem esquerda, Versalhes, margem direita, parques a leste.',
  },
  days: [
    {
      id: 'paris-d1',
      day: 1,
      title: {
        en: 'Arrival · Orly → market · home · Eiffel area',
        'pt-BR': 'Chegada · Orly → mercado · casa · região da Torre',
      },
      summary: {
        en: 'Land Orly, Navigo Easy, breakfast, drop bags at Casa do Gui, Auchan groceries (~45 min, ~€15/person food), back home, then leave for a soft Tower afternoon (Trocadéro → exterior → Bake & Blend → Champ de Mars) and dinner at Royal Cambronne before heading home. Food ≤ ~€50/person.',
        'pt-BR':
          'Chegada Orly, Navigo Easy, café, malas na Casa do Gui, compras no Auchan (~45 min, ~€15/pessoa em comida), volta para casa, saída à tarde para a Torre (Trocadéro → exterior → Bake & Blend → Champ de Mars) e jantar no Royal Cambronne antes de voltar. Comida ≤ ~€50/pessoa.',
      },
      stops: parisD1OryStops,
      arrivals: [
        {
          id: 'ory',
          default: true,
          label: { en: 'ORY', 'pt-BR': 'ORY' },
          title: {
            en: 'Arrival · Orly → market · home · Eiffel area',
            'pt-BR': 'Chegada · Orly → mercado · casa · região da Torre',
          },
          summary: {
            en: 'Land Orly, Navigo Easy, breakfast, drop bags at Casa do Gui, Auchan groceries (~45 min, ~€15/person food), back home, then leave for a soft Tower afternoon (Trocadéro → exterior → Bake & Blend → Champ de Mars) and dinner at Royal Cambronne before heading home. Food ≤ ~€50/person.',
            'pt-BR':
              'Chegada Orly, Navigo Easy, café, malas na Casa do Gui, compras no Auchan (~45 min, ~€15/pessoa em comida), volta para casa, saída à tarde para a Torre (Trocadéro → exterior → Bake & Blend → Champ de Mars) e jantar no Royal Cambronne antes de voltar. Comida ≤ ~€50/pessoa.',
          },
          stops: parisD1OryStops,
        },
        {
          id: 'cdg',
          label: { en: 'CDG', 'pt-BR': 'CDG' },
          title: {
            en: 'Arrival · CDG → market · home · Eiffel area',
            'pt-BR': 'Chegada · CDG → mercado · casa · região da Torre',
          },
          summary: {
            en: 'Land CDG, coffee at PAUL, Navigo Easy at RER B, drop bags at Casa do Gui, Auchan groceries (~45 min, ~€15/person food), back home, then leave for a soft Tower afternoon (Trocadéro → exterior → Bake & Blend → Champ de Mars) and dinner at Royal Cambronne before heading home. Food ≤ ~€50/person.',
            'pt-BR':
              'Chegada CDG, café no PAUL, Navigo Easy no RER B, malas na Casa do Gui, compras no Auchan (~45 min, ~€15/pessoa em comida), volta para casa, saída à tarde para a Torre (Trocadéro → exterior → Bake & Blend → Champ de Mars) e jantar no Royal Cambronne antes de voltar. Comida ≤ ~€50/pessoa.',
          },
          stops: parisD1CdgStops,
        },
      ],
    },
    {
      id: 'paris-d2',
      day: 2,
      title: {
        en: 'La Défense · West axis · Opéra',
        'pt-BR': 'La Défense · Eixo oeste · Ópera',
      },
      summary: {
        en: 'Defense morning → picnic at Tuileries → Champs / Arc → Invalides → Opéra night (Bouillon).',
        'pt-BR':
          'Manhã em La Défense → piquenique nas Tuileries → Champs / Arco → Invalides → noite na Ópera (Bouillon).',
      },
      stops: [
        {
          placeId: 'par-paul-defense',
          time: '09:00',
          slot: 'morning',
          note: {
            en: 'Breakfast near La Défense — croissant + coffee.',
            'pt-BR': 'Café da manhã perto de La Défense — croissant + café.',
          },
        },
        {
          placeId: 'par-grande-arche',
          time: '09:45',
          slot: 'morning',
          note: {
            en: 'Photo stop on the parvis / steps.',
            'pt-BR': 'Parada de foto no parvis / escadaria.',
          },
        },
        {
          placeId: 'par-esplanade-de-gaulle',
          time: '10:15',
          slot: 'morning',
          note: {
            en: 'Photo walk along the esplanade toward the city axis.',
            'pt-BR': 'Caminhada de foto na esplanada em direção ao eixo da cidade.',
          },
        },
        {
          placeId: 'par-la-defense',
          time: '10:40',
          slot: 'morning',
          note: {
            en: 'Short neighborhood / skyline loop, then M1 into central Paris.',
            'pt-BR': 'Volta curta no bairro / skyline e M1 para o centro.',
          },
        },
        {
          placeId: 'par-monoprix-rivoli',
          time: '11:45',
          slot: 'afternoon',
          note: {
            en: 'Monoprix Opéra (23 Av. de l’Opéra) — picnic supplies for Tuileries (~€6/person).',
            'pt-BR': 'Monoprix Opéra (23 Av. de l’Opéra) — compras pro piquenique nas Tuileries (~€6/pessoa).',
          },
        },
        {
          placeId: 'par-tuileries',
          time: '12:15',
          slot: 'afternoon',
          note: {
            en: 'Picnic / lunch in the garden.',
            'pt-BR': 'Piquenique / almoço no jardim.',
          },
        },
        {
          placeId: 'par-louvre',
          time: '13:00',
          slot: 'afternoon',
          note: {
            en: 'Outside / courtyard — full museum visit is Day 4.',
            'pt-BR': 'Por fora / pátio — visita completa do museu é no Dia 4.',
          },
        },
        {
          placeId: 'par-vendome',
          time: '13:30',
          slot: 'afternoon',
          note: {
            en: 'Quick luxury square walk before the Champs axis.',
            'pt-BR': 'Volta rápida na praça antes do eixo dos Champs.',
          },
        },
        {
          placeId: 'par-champs-elysees',
          time: '14:00',
          slot: 'afternoon',
          note: {
            en: 'Walk west toward the Arc.',
            'pt-BR': 'Caminhada para o oeste em direção ao Arco.',
          },
        },
        {
          placeId: 'par-pierre-herme',
          time: '14:20',
          slot: 'afternoon',
          note: {
            en: 'Macarons (~€6/person).',
            'pt-BR': 'Macarons (~€6/pessoa).',
          },
        },
        {
          placeId: 'par-arc-triomphe',
          time: '14:50',
          slot: 'afternoon',
        },
        {
          placeId: 'par-palais',
          time: '15:40',
          slot: 'afternoon',
          note: {
            en: 'Walk down from the Arc — Petit + Grand Palais exteriors.',
            'pt-BR':
              'Descida a pé do Arco — exteriores do Petit e Grand Palais.',
          },
        },
        {
          placeId: 'par-alexandre-iii',
          time: '16:00',
          slot: 'afternoon',
        },
        {
          placeId: 'par-invalides',
          time: '16:20',
          slot: 'afternoon',
          note: {
            en: 'Tickets ~€17.',
            'pt-BR': 'Ingressos ~€17.',
          },
        },
        {
          placeId: 'par-opera',
          time: '18:00',
          slot: 'evening',
          note: {
            en: 'Visit tickets ~€15.',
            'pt-BR': 'Visita ~€15.',
          },
        },
        {
          placeId: 'par-galeries-lafayette',
          time: '19:15',
          slot: 'evening',
          note: {
            en: 'Sunset from the rooftop (or Printemps).',
            'pt-BR': 'Pôr do sol no terraço (ou Printemps).',
          },
        },
        {
          placeId: 'par-printemps',
          time: '19:15',
          slot: 'evening',
          optional: true,
          note: {
            en: 'Alternative rooftop to Galeries Lafayette.',
            'pt-BR': 'Terraço alternativo às Galeries Lafayette.',
          },
        },
        {
          placeId: 'par-eclair-genie',
          time: '20:00',
          slot: 'evening',
          optional: true,
          note: {
            en: 'Éclair stop if you still have room.',
            'pt-BR': 'Parada de éclair se ainda der.',
          },
        },
        {
          placeId: 'par-bouillon',
          time: '20:30',
          slot: 'evening',
          note: {
            en: 'Dinner — classic French, great ratings, ~€15–20/person. Book or takeaway.',
            'pt-BR':
              'Jantar — francês clássico, ótimas notas, ~€15–20/pessoa. Reserve ou leve.',
          },
        },
      ],
    },
    {
      id: 'paris-d3',
      day: 3,
      title: {
        en: 'Left bank · Île de la Cité · Montmartre',
        'pt-BR': 'Margem esquerda · Île de la Cité · Montmartre',
      },
      summary: {
        en: 'Luxembourg & Latin Quarter → Notre-Dame island → Montmartre night.',
        'pt-BR':
          'Luxemburgo e Quartier Latin → ilha de Notre-Dame → noite em Montmartre.',
      },
      stops: [
        {
          placeId: 'par-maison-isabelle',
          time: '09:00',
          slot: 'morning',
          note: {
            en: 'Award-winning croissants — expect a queue. Grab baguettes for the park (~€10/person).',
            'pt-BR': 'Croissants premiados — costuma ter fila. Pegue baguetes pro parque (~€10/pessoa).',
          },
        },
        {
          placeId: 'par-luxembourg',
          time: '09:30',
          slot: 'morning',
        },
        {
          placeId: 'par-pantheon',
          time: '11:00',
          slot: 'morning',
          note: {
            en: 'Tickets ~€15.',
            'pt-BR': 'Ingressos ~€15.',
          },
        },
        {
          placeId: 'par-sorbonne',
          time: '12:00',
          slot: 'afternoon',
          note: {
            en: 'Walk the Sorbonne street.',
            'pt-BR': 'Passar pela rua da Sorbonne.',
          },
        },
        {
          placeId: 'par-creperie-arts',
          time: '12:15',
          slot: 'afternoon',
          note: {
            en: 'Crêpes (~€15/person).',
            'pt-BR': 'Crêpes (~€15/pessoa).',
          },
        },
        {
          placeId: 'par-auptitgrec',
          time: '12:15',
          slot: 'afternoon',
          optional: true,
          note: {
            en: 'Alternative crêperie.',
            'pt-BR': 'Crêperie alternativa.',
          },
        },
        {
          placeId: 'par-cour-commerce',
          time: '12:30',
          slot: 'afternoon',
          optional: true,
          note: {
            en: 'If sitting for a proper lunch — Le Procope / Brasserie des Prés nearby.',
            'pt-BR':
              'Se quiser almoço sentado — Le Procope / Brasserie des Prés perto.',
          },
        },
        {
          placeId: 'par-procope',
          time: '12:40',
          slot: 'afternoon',
          optional: true,
        },
        {
          placeId: 'par-brasserie-pres',
          time: '12:40',
          slot: 'afternoon',
          optional: true,
        },
        {
          placeId: 'par-saint-michel',
          time: '14:00',
          slot: 'afternoon',
        },
        {
          placeId: 'par-notre-dame',
          time: '14:15',
          slot: 'afternoon',
        },
        {
          placeId: 'par-hotel-ville',
          time: '14:45',
          slot: 'afternoon',
        },
        {
          placeId: 'par-horloge',
          time: '15:00',
          slot: 'afternoon',
          note: {
            en: 'Oldest public clock — look up on the Conciergerie tower.',
            'pt-BR':
              'Relógio público mais antigo — olhe a torre da Conciergerie.',
          },
        },
        {
          placeId: 'par-sainte-chapelle',
          time: '15:15',
          slot: 'afternoon',
        },
        {
          placeId: 'par-fric-frac',
          time: '18:00',
          slot: 'afternoon',
          note: {
            en: 'Croque-lanche by the canal.',
            'pt-BR': 'Croque-lanche no canal.',
          },
        },
        {
          placeId: 'par-montmartre',
          time: '18:45',
          slot: 'evening',
          note: {
            en: 'Wander the neighborhood on the way up.',
            'pt-BR': 'Volta pelo bairro na subida.',
          },
        },
        {
          placeId: 'par-sacre-coeur',
          time: '19:15',
          slot: 'evening',
          note: {
            en: 'Sunset in front of the basilica.',
            'pt-BR': 'Pôr do sol em frente à basílica.',
          },
        },
        {
          placeId: 'par-moulin-rouge',
          time: '20:00',
          slot: 'evening',
        },
        {
          placeId: 'par-arnaud-nicolas',
          time: '21:00',
          slot: 'evening',
          note: {
            en: 'Charcuterie dinner.',
            'pt-BR': 'Jantar de charcutaria.',
          },
        },
        {
          placeId: 'par-bateaux-mouches',
          time: '21:30',
          slot: 'evening',
          optional: true,
          note: {
            en: 'Optional Seine boat ride.',
            'pt-BR': 'Passeio de barco opcional no Sena.',
          },
        },
      ],
    },
    {
      id: 'paris-d4',
      day: 4,
      title: {
        en: 'Versailles day · Eiffel night',
        'pt-BR': 'Dia em Versalhes · noite na Torre',
      },
      summary: {
        en: 'Pastry → full Versailles day → Tower + dinner.',
        'pt-BR': 'Confeitaria → dia inteiro em Versalhes → Torre + jantar.',
      },
      stops: [
        {
          placeId: 'par-michalak',
          time: '09:00',
          slot: 'morning',
        },
        {
          placeId: 'par-versailles',
          time: '10:00',
          slot: 'morning',
          note: {
            en: 'Passport ticket ~€32. Closed Mondays. Book ahead.',
            'pt-BR': 'Passport ~€32. Fecha às segundas. Reserve antes.',
          },
        },
        {
          placeId: 'par-eiffel',
          time: '18:30',
          slot: 'evening',
          note: {
            en: 'Tickets ~€36. Book timed entry.',
            'pt-BR': 'Ingressos ~€36. Reserve horário.',
          },
        },
        {
          placeId: 'par-bien-eleve',
          time: '20:00',
          slot: 'evening',
        },
      ],
    },
    {
      id: 'paris-d5',
      day: 5,
      title: {
        en: 'Right bank · Louvre deep dive · Montparnasse',
        'pt-BR': 'Margem direita · Louvre a fundo · Montparnasse',
      },
      summary: {
        en: 'Palais-Royal brunch → Les Halles / Pompidou → Louvre → Line 6 views → steak.',
        'pt-BR':
          'Brunch no Palais-Royal → Les Halles / Pompidou → Louvre → vista linha 6 → entrecôte.',
      },
      stops: [
        {
          placeId: 'par-palais-royal',
          time: '09:00',
          slot: 'morning',
        },
        {
          placeId: 'par-cedric-grolet',
          time: '09:15',
          slot: 'morning',
          optional: true,
          note: {
            en: 'Morning pastry option (better hours than an evening stop on Day 1).',
            'pt-BR':
              'Opção de confeitaria de manhã (melhor horário que à noite no Dia 1).',
          },
        },
        {
          placeId: 'par-bohemia',
          time: '09:30',
          slot: 'morning',
          note: {
            en: 'Club sandwich or Club Loco de Blueberries (~€30/person).',
            'pt-BR': 'Club sandwich ou Club Loco de Blueberries (~€30/pessoa).',
          },
        },
        {
          placeId: 'par-bnf',
          time: '11:00',
          slot: 'morning',
          note: {
            en: 'Richelieu or François-Mitterrand site depending on the day.',
            'pt-BR':
              'Site Richelieu ou François-Mitterrand, conforme o dia.',
          },
        },
        {
          placeId: 'par-chatelet',
          time: '11:30',
          slot: 'morning',
        },
        {
          placeId: 'par-saint-eustache',
          time: '11:40',
          slot: 'morning',
        },
        {
          placeId: 'par-montorgueil',
          time: '11:50',
          slot: 'morning',
        },
        {
          placeId: 'par-pompidou',
          time: '12:10',
          slot: 'afternoon',
        },
        {
          placeId: 'par-amorino',
          time: '12:20',
          slot: 'afternoon',
          note: {
            en: 'Gelato break.',
            'pt-BR': 'Pausa de gelato.',
          },
        },
        {
          placeId: 'par-madeleine',
          time: '12:45',
          slot: 'afternoon',
          note: {
            en: 'Foyer de la Madeleine lunch — full menu ~€17.50/person.',
            'pt-BR':
              'Almoço no Foyer de la Madeleine — menu completo ~€17,50/pessoa.',
          },
        },
        {
          placeId: 'par-jeffrey-cagnes',
          time: '13:30',
          slot: 'afternoon',
        },
        {
          placeId: 'par-louvre',
          time: '14:00',
          slot: 'afternoon',
          note: {
            en: 'Tickets ~€22. Timed entry recommended.',
            'pt-BR': 'Ingressos ~€22. Horário marcado recomendado.',
          },
        },
        {
          placeId: 'par-metro-6',
          time: '18:00',
          slot: 'evening',
          note: {
            en: 'Elevated panoramic ride with Tower views.',
            'pt-BR': 'Trecho elevado panorâmico com vista da Torre.',
          },
        },
        {
          placeId: 'par-bakery-gaite',
          time: '18:30',
          slot: 'evening',
          note: {
            en: 'Famous Paris flan.',
            'pt-BR': 'Flan mais famoso de Paris.',
          },
        },
        {
          placeId: 'par-montparnasse',
          time: '19:00',
          slot: 'evening',
          note: {
            en: 'Observation deck ~€21.',
            'pt-BR': 'Mirante ~€21.',
          },
        },
        {
          placeId: 'par-entrecote',
          time: '20:00',
          slot: 'evening',
          note: {
            en: 'Steak-frites — reserve or arrive early (dinner queues). Near the Champs.',
            'pt-BR': 'Steak-frites — reserve ou chegue cedo (fila no jantar). Perto dos Champs.',
          },
        },
      ],
    },
    {
      id: 'paris-d6',
      day: 6,
      title: {
        en: 'Monceau · Marais · Vincennes · Train Bleu',
        'pt-BR': 'Monceau · Marais · Vincennes · Train Bleu',
      },
      summary: {
        en: 'Soft park morning → Bastille / Vosges lunch → Vincennes → gilded dinner.',
        'pt-BR':
          'Manhã de parque → almoço Bastille / Vosges → Vincennes → jantar dourado.',
      },
      stops: [
        {
          placeId: 'par-monceau',
          time: '09:00',
          slot: 'morning',
        },
        {
          placeId: 'par-bastille',
          time: '11:00',
          slot: 'morning',
        },
        {
          placeId: 'par-vosges',
          time: '11:15',
          slot: 'morning',
        },
        {
          placeId: 'par-chez-janou',
          time: '11:30',
          slot: 'afternoon',
          note: {
            en: 'French table + legendary chocolate mousse.',
            'pt-BR': 'Mesa francesa + mousse de chocolate lendária.',
          },
        },
        {
          placeId: 'par-chez-elo',
          time: '12:30',
          slot: 'afternoon',
          optional: true,
          note: {
            en: 'Snack to take to the park.',
            'pt-BR': 'Lanche pra levar no parque.',
          },
        },
        {
          placeId: 'par-vincennes-town',
          time: '15:00',
          slot: 'afternoon',
          note: {
            en: 'Town + castle + Bois nearby.',
            'pt-BR': 'Cidade + castelo + bosque por perto.',
          },
        },
        {
          placeId: 'par-chateau-vincennes',
          time: '15:30',
          slot: 'afternoon',
          optional: true,
        },
        {
          placeId: 'par-vincennes',
          time: '16:00',
          slot: 'afternoon',
          optional: true,
          note: {
            en: 'Bois de Vincennes walk.',
            'pt-BR': 'Passeio no Bois de Vincennes.',
          },
        },
        {
          placeId: 'par-train-bleu',
          time: '20:00',
          slot: 'evening',
          note: {
            en: 'Dinner at Gare de Lyon — book ahead.',
            'pt-BR': 'Jantar na Gare de Lyon — reserve antes.',
          },
        },
      ],
    },
  ],
};

/** City slug → itinerary (only cities with authored day routes). */
export const itinerariesByCitySlug: Record<string, TravelItinerary> = {
  paris: parisItinerary,
};

export function itineraryForCity(
  slug: string,
): TravelItinerary | undefined {
  return itinerariesByCitySlug[slug];
}

/**
 * Place ids for a day, in stop order (optional stops included).
 * Intentional revisits stay (e.g. home base morning + night return).
 */
export function dayRoutePlaceIds(
  day: ItineraryDay,
  opts?: { includeOptional?: boolean },
): string[] {
  const includeOptional = opts?.includeOptional !== false;
  const ids: string[] = [];
  for (const stop of day.stops) {
    if (stop.optional && !includeOptional) continue;
    ids.push(stop.placeId);
  }
  return ids;
}

/** Required (non-optional) place ids — preferred for map routes. */
export function dayPrimaryRoutePlaceIds(day: ItineraryDay): string[] {
  return dayRoutePlaceIds(day, { includeOptional: false });
}

/**
 * Typical € amount from MoneyInfo.
 * Food ranges are curated as min = average/typical, max = upper bound —
 * use min so restaurants don’t budget the expensive end.
 * Tickets: min when set, else max; free → 0.
 */
export function moneyTypicalEur(m?: MoneyInfo): number {
  if (!m || m.free) return 0;
  if (m.currency && m.currency !== 'EUR') return 0;
  if (m.min != null && Number.isFinite(m.min)) return Number(m.min);
  if (m.max != null && Number.isFinite(m.max)) return Number(m.max);
  return 0;
}

export type DayBudget = {
  /** Sum of avgPricePerPerson for primary stops (€) */
  foodEur: number;
  /** Sum of tickets for primary stops (€) */
  ticketsEur: number;
  /** Primary place ids that contributed food */
  foodPlaceIds: string[];
  /** Primary place ids that contributed tickets */
  ticketPlaceIds: string[];
};

/**
 * Food + tickets / person for a day, from curated visit meta on each primary stop.
 * Optional stops are excluded.
 * Food uses typical (min); tickets use typical ticket amount.
 */
export function computeDayBudget(
  day: ItineraryDay,
  placesById: Map<string, TravelPlace>,
): DayBudget {
  const primaryIds = dayPrimaryRoutePlaceIds(day);
  let foodEur = 0;
  let ticketsEur = 0;
  const foodPlaceIds: string[] = [];
  const ticketPlaceIds: string[] = [];
  const seen = new Set<string>();

  for (const id of primaryIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const place = placesById.get(id);
    const visit: VisitInfo | undefined =
      place?.visit ?? resolveVisit(id, place?.visit);
    if (!visit) continue;

    const stopMeta = day.stops.find(
      (s) => s.placeId === id && !s.optional,
    );
    const countFood = stopMeta?.countFood !== false;
    const countTicket = stopMeta?.countTicket !== false;

    if (countFood) {
      const food = moneyTypicalEur(visit.avgPricePerPerson);
      if (food > 0) {
        foodEur += food;
        foodPlaceIds.push(id);
      }
    }

    if (countTicket) {
      const ticket = moneyTypicalEur(visit.ticket);
      if (ticket > 0) {
        ticketsEur += ticket;
        ticketPlaceIds.push(id);
      }
    }
  }

  return {
    foodEur: Math.round(foodEur * 100) / 100,
    ticketsEur: Math.round(ticketsEur * 100) / 100,
    foodPlaceIds,
    ticketPlaceIds,
  };
}

/**
 * Sum food + tickets across all days (uses each day's default arrival stops
 * when `arrivals` is set).
 */
export function computeTripBudget(
  itinerary: TravelItinerary,
  placesById: Map<string, TravelPlace>,
): Pick<DayBudget, 'foodEur' | 'ticketsEur'> {
  let foodEur = 0;
  let ticketsEur = 0;
  for (const day of itinerary.days) {
    let dayForBudget = day;
    if (day.arrivals?.length) {
      const def =
        day.arrivals.find((a) => a.default) ?? day.arrivals[0]!;
      dayForBudget = { ...day, stops: def.stops };
    }
    const b = computeDayBudget(dayForBudget, placesById);
    foodEur += b.foodEur;
    ticketsEur += b.ticketsEur;
  }
  return {
    foodEur: Math.round(foodEur * 100) / 100,
    ticketsEur: Math.round(ticketsEur * 100) / 100,
  };
}
