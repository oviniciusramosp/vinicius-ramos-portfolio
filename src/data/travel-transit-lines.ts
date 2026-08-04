/**
 * Curated Paris transit spines for itinerary map drawing.
 * Station order follows the line direction; slice with station ids.
 * Coordinates are approximate station anchors (not full track geometry).
 */

export type LatLng = [number, number];

export type TransitStation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type TransitLine = {
  id: string;
  name: string;
  /** Rough RATP/RER brand color */
  color: string;
  stations: TransitStation[];
};

function st(
  id: string,
  name: string,
  lat: number,
  lng: number,
): TransitStation {
  return { id, name, lat, lng };
}

/** Metro Line 1 — La Défense → Château de Vincennes (west → east) */
export const metro1: TransitLine = {
  id: 'm1',
  name: 'Métro 1',
  color: '#FFBE00',
  stations: [
    st('la-defense', 'La Défense', 48.891922, 2.238038),
    st('esplanade-defense', 'Esplanade de La Défense', 48.887843, 2.250442),
    st('pont-neuilly', 'Pont de Neuilly', 48.884509, 2.259503),
    st('les-sablons', 'Les Sablons', 48.880692, 2.272281),
    st('porte-maillot', 'Porte Maillot', 48.87803, 2.282547),
    st('argentine', 'Argentine', 48.87549, 2.29013),
    st('etoile', 'Charles de Gaulle–Étoile', 48.8738, 2.295),
    st('george-v', 'George V', 48.872, 2.3006),
    st('fdr', 'Franklin D. Roosevelt', 48.8691, 2.3098),
    st('clemenceau', 'Champs-Élysées–Clemenceau', 48.8676, 2.3135),
    st('concorde', 'Concorde', 48.8656, 2.3211),
    st('tuileries', 'Tuileries', 48.8636, 2.3303),
    st('palais-royal', 'Palais Royal–Musée du Louvre', 48.8625, 2.3364),
    st('louvre-rivoli', 'Louvre–Rivoli', 48.8609, 2.3408),
    st('chatelet', 'Châtelet', 48.8584, 2.347),
    st('hotel-ville', 'Hôtel de Ville', 48.8573, 2.3517),
    st('saint-paul', 'Saint-Paul', 48.8553, 2.3609),
    st('bastille', 'Bastille', 48.8532, 2.3691),
    st('gare-lyon', 'Gare de Lyon', 48.8448, 2.3735),
    st('nation', 'Nation', 48.8482, 2.3958),
    st('porte-vincennes', 'Porte de Vincennes', 48.8472, 2.4109),
    st('saint-mande', 'Saint-Mandé', 48.8462, 2.4189),
    st('berault', 'Bérault', 48.8453, 2.4285),
    st('chateau-vincennes', 'Château de Vincennes', 48.8444, 2.4405),
  ],
};

/** Metro Line 6 — Charles de Gaulle–Étoile → Nation (via south / elevated) */
export const metro6: TransitLine = {
  id: 'm6',
  name: 'Métro 6',
  color: '#6ECA97',
  stations: [
    st('etoile', 'Charles de Gaulle–Étoile', 48.8738, 2.295),
    st('kleber', 'Kléber', 48.8712, 2.2928),
    st('boissiere', 'Boissière', 48.8674, 2.29),
    st('trocadero', 'Trocadéro', 48.863, 2.2875),
    st('passy', 'Passy', 48.8575, 2.2858),
    st('bir-hakeim', 'Bir-Hakeim', 48.8539, 2.2893),
    st('dupleix', 'Dupleix', 48.8505, 2.2935),
    st('motte-picquet', 'La Motte-Picquet–Grenelle', 48.8492, 2.2985),
    st('cambronne', 'Cambronne', 48.8475, 2.3025),
    st('sevres-lecourbe', 'Sèvres–Lecourbe', 48.8455, 2.31),
    st('pasteur', 'Pasteur', 48.8428, 2.3125),
    st('montparnasse', 'Montparnasse–Bienvenüe', 48.8422, 2.3219),
    st('edgar-quinet', 'Edgar Quinet', 48.841, 2.325),
    st('raspail', 'Raspail', 48.8405, 2.3305),
    st('denfert', 'Denfert-Rochereau', 48.8339, 2.3325),
    st('place-italie', "Place d'Italie", 48.8312, 2.3558),
    st('bercy', 'Bercy', 48.84, 2.3795),
    st('nation', 'Nation', 48.8482, 2.3958),
  ],
};

/** Metro Line 2 — Porte Dauphine → Nation (north arc) */
export const metro2: TransitLine = {
  id: 'm2',
  name: 'Métro 2',
  color: '#003CA6',
  stations: [
    st('porte-dauphine', 'Porte Dauphine', 48.8715, 2.276),
    st('victor-hugo', 'Victor Hugo', 48.8708, 2.2855),
    st('etoile', 'Charles de Gaulle–Étoile', 48.8738, 2.295),
    st('ternes', 'Ternes', 48.8755, 2.305),
    st('courcelles', 'Courcelles', 48.878, 2.314),
    st('monceau', 'Monceau', 48.8805, 2.322),
    st('villiers', 'Villiers', 48.882, 2.3275),
    st('rome', 'Rome', 48.8835, 2.333),
    st('place-clichy', 'Place de Clichy', 48.8838, 2.338),
    st('blanche', 'Blanche', 48.8835, 2.3435),
    st('pigalle', 'Pigalle', 48.8828, 2.3499),
    st('anvers', 'Anvers', 48.8825, 2.3545),
    st('barbès', 'Barbès–Rochechouart', 48.8835, 2.349),
    st('la-chapelle', 'La Chapelle', 48.8845, 2.36),
    st('stalingrad', 'Stalingrad', 48.8843, 2.367),
    st('jaures', 'Jaurès', 48.8828, 2.3705),
    st('colonel-fabien', 'Colonel Fabien', 48.8785, 2.3708),
    st('belleville', 'Belleville', 48.8722, 2.3768),
    st('couronnes', 'Couronnes', 48.8692, 2.3802),
    st('menilmontant', 'Ménilmontant', 48.8662, 2.3835),
    st('pere-lachaise', 'Père Lachaise', 48.8628, 2.3872),
    st('philippe-auguste', 'Philippe Auguste', 48.8582, 2.3905),
    st('alexandre-dumas', 'Alexandre Dumas', 48.8558, 2.3945),
    st('avron', 'Avron', 48.8522, 2.3978),
    st('nation', 'Nation', 48.8482, 2.3958),
  ],
};

/** Metro Line 4 — Porte de Clignancourt → Bagneux (north–south spine) */
export const metro4: TransitLine = {
  id: 'm4',
  name: 'Métro 4',
  color: '#C04191',
  stations: [
    st('porte-clignancourt', 'Porte de Clignancourt', 48.8973, 2.3447),
    st('simplon', 'Simplon', 48.8935, 2.3472),
    st('marcadet', 'Marcadet–Poissonniers', 48.8902, 2.3495),
    st('chateau-rouge', 'Château Rouge', 48.8872, 2.3495),
    st('barbès', 'Barbès–Rochechouart', 48.8835, 2.349),
    st('gare-nord', 'Gare du Nord', 48.8805, 2.355),
    st('gare-est', "Gare de l'Est", 48.8763, 2.358),
    st('chateau-deau', "Château d'Eau", 48.8728, 2.3555),
    st('strasbourg', 'Strasbourg–Saint-Denis', 48.8697, 2.354),
    st('reaumur', 'Réaumur–Sébastopol', 48.8662, 2.3525),
    st('etienne-marcel', 'Étienne Marcel', 48.8638, 2.3488),
    st('les-halles', 'Les Halles', 48.862, 2.346),
    st('chatelet', 'Châtelet', 48.8584, 2.347),
    st('cite', 'Cité', 48.8554, 2.3472),
    st('saint-michel', 'Saint-Michel', 48.8534, 2.344),
    st('odeon', 'Odéon', 48.8522, 2.339),
    st('saint-germain', 'Saint-Germain-des-Prés', 48.8538, 2.3335),
    st('saint-sulpice', 'Saint-Sulpice', 48.851, 2.3308),
    st('saint-placide', 'Saint-Placide', 48.847, 2.327),
    st('montparnasse', 'Montparnasse–Bienvenüe', 48.8422, 2.3219),
    st('vavin', 'Vavin', 48.8422, 2.329),
    st('raspail', 'Raspail', 48.8405, 2.3305),
    st('denfert', 'Denfert-Rochereau', 48.8339, 2.3325),
  ],
};

/** Metro Line 8 — Balard → Créteil (useful for Invalides / Opéra / Bastille) */
export const metro8: TransitLine = {
  id: 'm8',
  name: 'Métro 8',
  color: '#D282BE',
  stations: [
    st('balard', 'Balard', 48.8362, 2.2785),
    st('lourmel', 'Lourmel', 48.8385, 2.282),
    st('boucicaut', 'Boucicaut', 48.841, 2.2875),
    st('felix-faure', 'Félix Faure', 48.8425, 2.292),
    st('commerce', 'Commerce', 48.8445, 2.297),
    st('motte-picquet', 'La Motte-Picquet–Grenelle', 48.8492, 2.2985),
    st('ecole-militaire', 'École Militaire', 48.855, 2.3065),
    st('la-tour-neuve', 'La Tour-Maubourg', 48.8575, 2.3105),
    st('invalides', 'Invalides', 48.861, 2.3145),
    st('concorde', 'Concorde', 48.8656, 2.3211),
    st('madeleine', 'Madeleine', 48.87, 2.3244),
    st('opera', 'Opéra', 48.8707, 2.332),
    st('richelieu', 'Richelieu–Drouot', 48.872, 2.3385),
    st('grands-boulevards', 'Grands Boulevards', 48.8715, 2.3435),
    st('bonne-nouvelle', 'Bonne Nouvelle', 48.8705, 2.3485),
    st('strasbourg', 'Strasbourg–Saint-Denis', 48.8697, 2.354),
    st('republique', 'République', 48.8675, 2.3635),
    st('filles-calvaire', 'Filles du Calvaire', 48.863, 2.3665),
    st('saint-sebastien', 'Saint-Sébastien–Froissart', 48.8605, 2.3675),
    st('chemin-vert', 'Chemin Vert', 48.8575, 2.3685),
    st('bastille', 'Bastille', 48.8532, 2.3691),
    st('ledru-rollin', 'Ledru-Rollin', 48.8515, 2.376),
    st('faidherbe', 'Faidherbe–Chaligny', 48.8505, 2.3835),
    st('reuilly', 'Reuilly–Diderot', 48.8475, 2.3865),
    st('montgallet', 'Montgallet', 48.8445, 2.3895),
    st('daumesnil', 'Daumesnil', 48.8395, 2.3955),
  ],
};

/** Metro Line 12 — Front Populaire → Mairie d'Issy */
export const metro12: TransitLine = {
  id: 'm12',
  name: 'Métro 12',
  color: '#007852',
  stations: [
    st('pigalle', 'Pigalle', 48.8828, 2.3499),
    st('abbesses', 'Abbesses', 48.8845, 2.3385),
    st('lamarck', 'Lamarck–Caulaincourt', 48.8895, 2.3385),
    st('jules-joffrin', 'Jules Joffrin', 48.8925, 2.3445),
    st('marcadet', 'Marcadet–Poissonniers', 48.8902, 2.3495),
    st('poissonniers', 'Poissonniers', 48.8865, 2.3505),
    st('anvers-n', 'Anvers', 48.8825, 2.3445),
    st('pigalle-s', 'Pigalle', 48.882, 2.3375),
    st('saint-georges', 'Saint-Georges', 48.8785, 2.3375),
    st('notre-dame-de-lorette', 'Notre-Dame-de-Lorette', 48.876, 2.3385),
    st('trinite', 'Trinité–d’Estienne d’Orves', 48.8765, 2.333),
    st('saint-lazare', 'Saint-Lazare', 48.8755, 2.3255),
    st('madeleine', 'Madeleine', 48.87, 2.3244),
    st('concorde', 'Concorde', 48.8656, 2.3211),
    st('assemblee', 'Assemblée Nationale', 48.8605, 2.321),
    st('solferino', 'Solférino', 48.8585, 2.3235),
    st('rue-du-bac', 'Rue du Bac', 48.8555, 2.3255),
    st('sevres-babylone', 'Sèvres–Babylone', 48.8515, 2.3265),
    st('rennes', 'Rennes', 48.848, 2.3275),
    st('notre-dames-champs', 'Notre-Dame-des-Champs', 48.8445, 2.3285),
    st('montparnasse', 'Montparnasse–Bienvenüe', 48.8422, 2.3219),
  ],
};

/** Metro Line 13 — useful for Invalides / Saint-Lazare / north */
export const metro13: TransitLine = {
  id: 'm13',
  name: 'Métro 13',
  color: '#6EC4E8',
  stations: [
    st('chateau-de-vincennes-n', 'Châtillon–Montrouge', 48.8105, 2.302),
    st('porte-vanves', 'Porte de Vanves', 48.8275, 2.3055),
    st('plaisance', 'Plaisance', 48.8315, 2.3135),
    st('pernety', 'Pernety', 48.8335, 2.3185),
    st('gaite', 'Gaîté', 48.8385, 2.3225),
    st('montparnasse', 'Montparnasse–Bienvenüe', 48.8422, 2.3219),
    st('duroc', 'Duroc', 48.847, 2.3165),
    st('varenne', 'Varenne', 48.856, 2.315),
    st('invalides', 'Invalides', 48.861, 2.3145),
    st('champs-elysees', 'Champs-Élysées–Clemenceau', 48.8676, 2.3135),
    st('miromesnil', 'Miromesnil', 48.8735, 2.3145),
    st('saint-lazare', 'Saint-Lazare', 48.8755, 2.3255),
    st('liege', 'Liège', 48.8795, 2.327),
    st('place-clichy', 'Place de Clichy', 48.8838, 2.338),
    st('la-fourche', 'La Fourche', 48.8875, 2.326),
    st('guy-moquet', 'Guy Môquet', 48.892, 2.327),
    st('porte-clichy', 'Porte de Clichy', 48.8945, 2.314),
  ],
};

/**
 * RER C simplified spine — Versailles-Château ↔ eastern Paris.
 * Enough stations for Versailles day + Champ de Mars / Invalides.
 */
export const rerC: TransitLine = {
  id: 'rer-c',
  name: 'RER C',
  color: '#F4C300',
  stations: [
    st('versailles-chateau', 'Versailles-Château–Rive Gauche', 48.8003, 2.1293),
    st('versailles-chantiers', 'Versailles-Chantiers', 48.7955, 2.1355),
    st('viroflay-rg', 'Viroflay-Rive Gauche', 48.8005, 2.1675),
    st('chaville', 'Chaville–Vélizy', 48.8055, 2.1885),
    st('meudon', 'Meudon-Val-Fleury', 48.8125, 2.2215),
    st('issy', 'Issy', 48.8215, 2.2595),
    st('boulevard-victor', 'Boulevard Victor', 48.8385, 2.2735),
    st('javel', 'Javel', 48.8465, 2.2785),
    st('champ-mars', 'Champ de Mars–Tour Eiffel', 48.8555, 2.2895),
    st('pont-alma', "Pont de l'Alma", 48.8625, 2.3015),
    st('invalides', 'Invalides', 48.861, 2.3145),
    st('musee-orsay', "Musée d'Orsay", 48.8605, 2.3255),
    st('saint-michel', 'Saint-Michel–Notre-Dame', 48.8535, 2.3445),
    st('gare-austerlitz', "Gare d'Austerlitz", 48.8422, 2.3655),
    st('bibliotheque', 'Bibliothèque François Mitterrand', 48.8298, 2.3765),
  ],
};

/** Metro Line 14 — useful for BNF ↔ Châtelet / Gare de Lyon */
export const metro14: TransitLine = {
  id: 'm14',
  name: 'Métro 14',
  color: '#62259D',
  stations: [
    st('saint-lazare', 'Saint-Lazare', 48.8755, 2.3255),
    st('madeleine', 'Madeleine', 48.87, 2.3244),
    st('pyramides', 'Pyramides', 48.8665, 2.3345),
    st('chatelet', 'Châtelet', 48.8584, 2.347),
    st('gare-lyon', 'Gare de Lyon', 48.8448, 2.3735),
    st('bercy', 'Bercy', 48.84, 2.3795),
    st('cour-saint-emilion', 'Cour Saint-Émilion', 48.8335, 2.3865),
    st('bibliotheque', 'Bibliothèque François Mitterrand', 48.8298, 2.3765),
    st('olympiades', 'Olympiades', 48.827, 2.367),
  ],
};

export const transitLinesById: Record<string, TransitLine> = {
  m1: metro1,
  m2: metro2,
  m4: metro4,
  m6: metro6,
  m8: metro8,
  m12: metro12,
  m13: metro13,
  m14: metro14,
  'rer-c': rerC,
};

export type TransitLineId = keyof typeof transitLinesById;

export function getTransitLine(id: string): TransitLine | undefined {
  return transitLinesById[id];
}

export function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestStation(
  line: TransitLine,
  point: { lat: number; lng: number },
): TransitStation {
  let best = line.stations[0]!;
  let bestD = Infinity;
  for (const s of line.stations) {
    const d = haversineM(point, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function stationById(
  line: TransitLine,
  id: string,
): TransitStation | undefined {
  return line.stations.find((s) => s.id === id);
}

/**
 * Inclusive slice of station path from A to B (either direction).
 */
export function sliceLinePath(
  line: TransitLine,
  fromStationId: string,
  toStationId: string,
): LatLng[] {
  const i = line.stations.findIndex((s) => s.id === fromStationId);
  const j = line.stations.findIndex((s) => s.id === toStationId);
  if (i < 0 || j < 0) return [];
  const lo = Math.min(i, j);
  const hi = Math.max(i, j);
  const slice = line.stations.slice(lo, hi + 1);
  const ordered = i <= j ? slice : [...slice].reverse();
  return ordered.map((s) => [s.lat, s.lng] as LatLng);
}

/** Full line path as LatLngs */
export function linePath(line: TransitLine): LatLng[] {
  return line.stations.map((s) => [s.lat, s.lng] as LatLng);
}
