/**
 * Place gallery photos for /travel cards (cover + slider).
 *
 * Place-specific preferred — Wikimedia Commons / Wikipedia / Openverse CC.
 *
 * Cafés & pâtisseries: food/dishes only (macarons, croissants, gelato…),
 * never owner portraits or street façades. When a free photo of that exact
 * counter doesn’t exist, use a clear plate of what they sell.
 *
 * Google Place Photos are not used (API billing + ephemeral media URLs).
 *
 * Link health:
 *  - Structural tests: `src/data/travel-photos.test.ts` (hosts, banned 404s)
 *  - Live HTTP check:  `npm run travel:photos:check`
 *  - Runtime: broken images are hidden by travel-photo-slider (no dead covers)
 */

import type { LString } from './travel';

export type TravelPhoto = {
  url: string;
  alt?: LString;
  credit?: string;
};

function photo(
  url: string,
  en: string,
  pt: string,
  credit: string,
): TravelPhoto {
  return { url, alt: { en, 'pt-BR': pt }, credit };
}

export const photosByPlaceId: Record<string, TravelPhoto[]> = {
  'par-bouillon': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chez_Chartier_1.JPG',
      'Bouillon',
      'Bouillon',
      'Wikimedia Commons',
    ),
  ],
  'par-cedric-grolet': [
    photo(
      'https://cdn.sortiraparis.com/images/80/76511/340058-la-patisserie-de-cedric-grolet-au-meurice.jpg',
      'Pâtisserie Cédric Grolet at Le Meurice',
      'Pâtisserie Cédric Grolet no Le Meurice',
      'Sortir à Paris',
    ),
    photo(
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHUMAnnoa1qHK4CBkOUFhkT6bgEfPckQMSl9eauB91LSfFuLBNs-8_tq-m&s=10',
      'Cédric Grolet pastry',
      'Doce de Cédric Grolet',
      'Google',
    ),
  ],

  'par-alexandre-iii': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Pont_Alexandre_III_depuis_pont_de_la_Concorde_Paris.jpg/1280px-Pont_Alexandre_III_depuis_pont_de_la_Concorde_Paris.jpg',
      'Pont Alexandre III',
      'Pont Alexandre III',
      'Wikimedia Commons',
    ),
  ],
  'par-amorino': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Amorino_Gelato_Flowers.jpg/1280px-Amorino_Gelato_Flowers.jpg',
      'Amorino flower-shaped gelato',
      'Gelato em forma de flor da Amorino',
      'Wikimedia Commons',
    ),
  ],
  'par-andre-citroen': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/0/03/Serres_Parc-Andr%C3%A9-Citro%C3%ABn-Paris.jpg',
      'Parc André Citroën',
      'Parc André Citroën',
      'Wikimedia Commons',
    ),
  ],
  'par-arc-triomphe': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Arc_de_Triomphe%2C_Paris_21_October_2010.jpg/1280px-Arc_de_Triomphe%2C_Paris_21_October_2010.jpg',
      'Arc de Triomphe',
      'Arc de Triomphe',
      'Wikimedia Commons',
    ),
  ],
  'par-arnaud-nicolas': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/9/9e/P1160897_Paris_XVII_rue_de_L%C3%A9vis_rwk.jpg',
      'Charcuterie Arnaud Nicolas',
      'Charcuterie Arnaud Nicolas',
      'Wikimedia Commons',
    ),
  ],
  'par-auptitgrec': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Facade_de_magasin_Au_p%27tit_grec_%C3%A0_l%27angle_des_rues_Cujas_et_Mouffetard.jpg/1280px-Facade_de_magasin_Au_p%27tit_grec_%C3%A0_l%27angle_des_rues_Cujas_et_Mouffetard.jpg',
      'Au P\'tit Grec',
      'Au P\'tit Grec',
      'Wikimedia Commons',
    ),
  ],
  'par-bake-blend': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWldBjMg13upIn99jRPyDfD4dh8tuB7AnKHDUd9No_zbcT2134mE43O_M6B6tzOIYeB9UCgTCHgEGek2iUPKLZB2hVjQbM1cxh0vmvbQKK2ha7r5XnvV-ydkGK_ZsIHejFQztzKN9siBV_4p=s392-k-no',
      'Le café by Maison Bergeron',
      'Le café by Maison Bergeron',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWn4Maj78YqyPGePWag5UDplYQrvU8s5Z31S9h0PFhextMeMh7xBefhDv3AsgmSfjTYbsaUiEsu94ajLpKiKulG52d0FUt3guL3-VOOHs_OEU-smShuSqqjXGyDdVSLT6uN8CZtfwy0CPWT9=s457-k-no',
      'Pastries at Le café by Maison Bergeron',
      'Doces no Le café by Maison Bergeron',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnT7AKRGTQTbTRcUttUVpK1BLrF1d78tFoN08989bk5-OrAxljHvsmxa2BIdFKuj9shVgiNFQfCeUf1DUaI8-rFmnux0LqF_MUF4PHL0LZOEv32jQJ73GMCwCAGiKWLnXKkXD18=s609-k-no',
      'Le café by Maison Bergeron interior',
      'Interior do Le café by Maison Bergeron',
      'Google Maps',
    ),
  ],
  'par-bakery-gaite': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Typical_French_bakery_pastries.jpg/1280px-Typical_French_bakery_pastries.jpg',
      'French bakery pastries',
      'Doces de padaria francesa',
      'Wikimedia Commons',
    ),
  ],
  'par-bastille': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Place_de_la_Bastille%2C_avril_2021.jpg/3840px-Place_de_la_Bastille%2C_avril_2021.jpg',
      'Place de la Bastille',
      'Place de la Bastille',
      'Wikimedia Commons',
    ),
  ],
  'par-cafe-flore': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Hot_chocolate_p1150797.jpg/1280px-Hot_chocolate_p1150797.jpg',
      'Hot chocolate at a Paris café',
      'Chocolate quente em café parisiense',
      'Wikimedia Commons',
    ),
  ],
  'par-bateaux-mouches': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlkamvAmLuu9HadRULncd6dlec-JkHS2mvKdAPumGuKgcmKw5mydCIyoZ8jouzdmaQyLpGnbwoOaGlb47dgnnoy_vArk_h9sSEXT3J9LPSha25mCb9HCKYhquZSBFO_doZjpmZfMqWR9bk=s348-k-no',
      'Bateaux-Mouches on the Seine',
      'Bateaux-Mouches no Sena',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlamPWEfHwgG-WxIJyciXZkNHIqWN1OUGuKzVr_pwYyn41CpGtEQL3kR5uwHa0Yr1T1KQuIbRHtL2MCzcO7IW9-cv2QmeyPhsHYjg7clzMXNkgqbanbMNgxvS56kOeh1UqVXw4lNMjbwNcI=s406-k-no',
      'Bateaux-Mouches Seine cruise',
      'Cruzeiro Bateaux-Mouches no Sena',
      'Google Maps',
    ),
  ],
  'par-bhv-marais': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnEY8D0ehGDCxCzy0LMqSo4b8RK894HTeV4gyaZiAkpiT0oG819zWmpZYBzLqZyP0TeADzZZ1NLwfFDz7m2X5HJ4A6Xl4eVhlwu8d4-oxypqYypndljnn3Qlk8lXMTmjYTL7v-fJg=s811-k-no',
      'BHV Marais',
      'BHV Marais',
      'Google Maps',
    ),
  ],
  'par-bien-eleve': [
    photo(
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSY4m17cZwr6AWZ3zvfmBP1u6cYz8BnFjijBliOyvTfFsI9W-qcFz9MSYwl&s=10',
      'Bien Élevé',
      'Bien Élevé',
      'Google',
    ),
    photo(
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6r2hls0orPx9-kyg9ulL1N7Clk7PJ2L3_C1GqycCgTX2hB0FQ7trTjYU&s=10',
      'Bien Élevé dish',
      'Prato do Bien Élevé',
      'Google',
    ),
  ],
  'par-bike': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/V%C3%A9lib%27_Paris.jpg/1280px-V%C3%A9lib%27_Paris.jpg',
      'Bike around Paris',
      'Bike around Paris',
      'Wikimedia Commons',
    ),
  ],
  'par-bnf': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Biblioth%C3%A8que_Mitterrand_Mai_2022.jpg/3840px-Biblioth%C3%A8que_Mitterrand_Mai_2022.jpg',
      'Bibliothèque nationale',
      'Bibliothèque nationale',
      'Wikimedia Commons',
    ),
  ],
  'par-bohemia': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/7/70/Cafe_gourmand.JPG',
      'Café gourmand plate',
      'Prato de café gourmand',
      'Wikimedia Commons',
    ),
  ],
  'par-bon-marche': [
    photo(
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/35/35/68/le-bon-marche.jpg?w=1200&h=-1&s=1',
      'Le Bon Marché, Paris',
      'Le Bon Marché, Paris',
      'TripAdvisor',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/b/b8/Le_Bon_March%C3%A9%2C_Paris_3_November_2008_-_panoramio.jpg',
      'Le Bon Marché façade, Paris',
      'Fachada do Le Bon Marché, Paris',
      'Wikimedia Commons',
    ),
  ],
  'par-boulogne': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/La_D%C3%A9fense_and_Bois_de_Boulogne_from_the_Eiffel_Tower%2C_11_June_2017_001.jpg/3840px-La_D%C3%A9fense_and_Bois_de_Boulogne_from_the_Eiffel_Tower%2C_11_June_2017_001.jpg',
      'Bois de Boulogne',
      'Bois de Boulogne',
      'Wikimedia Commons',
    ),
  ],
  'par-brasserie-pres': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/0/0e/P1020083_Paris_VI_Cour_du_Commerce-Saint-Andr%C3%A9_reductwk.JPG',
      'Brasserie des Prés',
      'Brasserie des Prés',
      'Wikimedia Commons',
    ),
  ],
  'par-burger-king-opera': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWl25elIupAOZi6Ix80qTzI64wQeX4a9k5rqXuAR9tlRjlowJHGCX6xcUvGs5_ymGdp54IdP3LSu2eKa4MLW-4tNcH0koI25LIjdeal2KNXTDe-pE643Lyde20Bpi2aQ1bvcF2bOJg=s696-k-no',
      'Burger King Opéra',
      'Burger King Opéra',
      'Google Maps',
    ),
  ],
  'par-buttes-chaumont': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Passerelle_suspendue%2C_Buttes_Chaumont%2C_Paris_14_April_2014.jpg/3840px-Passerelle_suspendue%2C_Buttes_Chaumont%2C_Paris_14_April_2014.jpg',
      'Parc des Buttes-Chaumont',
      'Parc des Buttes-Chaumont',
      'Wikimedia Commons',
    ),
  ],
  'par-canals': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Canal_Saint-Martin_Paris_FRA_001.jpg/1280px-Canal_Saint-Martin_Paris_FRA_001.jpg',
      'Paris canals walk',
      'Paris canals walk',
      'Wikimedia Commons',
    ),
  ],
  'par-champ-mars': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Champ_de_Mars_from_the_Eiffel_Tower_-_July_2006_edit.jpg/1280px-Champ_de_Mars_from_the_Eiffel_Tower_-_July_2006_edit.jpg',
      'Champ de Mars',
      'Champ de Mars',
      'Wikimedia Commons',
    ),
  ],
  'par-champs-elysees': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/6/6d/Avenue_des_Champs-%C3%89lys%C3%A9es_July_24%2C_2009_N1.jpg',
      'Champs-Élysées',
      'Champs-Élysées',
      'Wikimedia Commons',
    ),
  ],
  'par-chateau-vincennes': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Vincennes_-_Chateau_02.jpg/3840px-Vincennes_-_Chateau_02.jpg',
      'Château de Vincennes',
      'Château de Vincennes',
      'Wikimedia Commons',
    ),
  ],
  'par-chatelet': [
    photo(
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7BGcefKa4C2d8TJ7eV4SrT4Rc5LH-La-EeaqFA90gMBKSK5DMoZA30b6n&s=10',
      'Place du Châtelet',
      'Place du Châtelet',
      'Google',
    ),
  ],
  'par-chez-elo': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/d/d3/Paris_Hotel_de_Sens_dsc04028.jpg',
      'Chez Elo',
      'Chez Elo',
      'Wikimedia Commons',
    ),
  ],
  'par-chez-janou': [
    photo(
      'https://live.staticflickr.com/55/143096731_7a3ef7ff8f_b.jpg',
      'Chez Janou',
      'Chez Janou',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-cour-commerce': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/8/83/Plaque_Sainte-Beuve%2C_2_cour_du_Commerce-Saint-Andr%C3%A9%2C_Paris_6e.jpg',
      'Cour du Commerce Saint-André',
      'Cour du Commerce Saint-André',
      'Wikimedia Commons',
    ),
  ],
  'par-creperie-arts': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/5/59/Cr%C3%AAperie_des_Arts%2C_27_Rue_Saint-Andr%C3%A9-des-Arts_%28Paris%29_2010-07-29.jpg',
      'Crêperie des Arts',
      'Crêperie des Arts',
      'Wikimedia Commons',
    ),
  ],
  'par-disneyland': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Sleeping_Beauty_Castle_DLP_Jan_2013.jpg/1280px-Sleeping_Beauty_Castle_DLP_Jan_2013.jpg',
      'Disneyland Paris — Sleeping Beauty Castle',
      'Disneyland Paris — Castelo da Bela Adormecida',
      'Wikimedia Commons',
    ),
  ],
  'par-eclair-genie': [
    photo(
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhMAM7N2tcdxVfxVPeyk8nRURyi11fzq8FSMdaOG7zWqVZA8D7aGTgyKU&s=10',
      "L'Éclair de Génie",
      "L'Éclair de Génie",
      'Google',
    ),
    photo(
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjHHZ35fyr0Lg5UrmGl62D3tuvTSrvNlhEfVlDPl7F0tkh9XLOAErt5vUMFFu6BDRQK9Ojsj6gGjqRnOCiAI-3Al3PpfVseDA1VdoyBf1ZdGwyhkLatzlLcEkyoGe7RZVoab6T4hyphenhyphenjPuLYt/s1600/eclair+de+genie+011.JPG',
      "L'Éclair de Génie éclairs",
      "Éclairs L'Éclair de Génie",
      'Blogger',
    ),
  ],
  'par-eiffel': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/1280px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
      'Eiffel Tower',
      'Eiffel Tower',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Tour_Eiffel_vue_du_Champ-de-Mars.jpg/1280px-Tour_Eiffel_vue_du_Champ-de-Mars.jpg',
      'Eiffel Tower',
      'Eiffel Tower',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Eiffel_Tower_and_Pont_Alexandre_III_at_night.jpg/1280px-Eiffel_Tower_and_Pont_Alexandre_III_at_night.jpg',
      'Eiffel Tower',
      'Eiffel Tower',
      'Wikimedia Commons',
    ),
  ],
  'par-entrecote': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlXwdN3JsZ0VmQ2oyQUTkHhGR6YB6Rjdj4F6kPjivHBnixSTgWeTGOPGvNqJ4h2HYxFWQLMqJ40nzWYr5UsGdSG8NoAsNr27vJOajmyi-3CXdJI6m4rx5ma3IFgaaSdDwAhCl4Y_SRdw5xK=s348-k-no',
      "Le Relais de l'Entrecôte",
      "Le Relais de l'Entrecôte",
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWm71U9_7fhHPjYvumKnKuOR3D3_qZ_F37yLg5Rjh2H3iFLpbaZDty9diVOoTXAo9oiYwgbZy5XfaMoUW-SiltSgRLbioXsFtUQdthYA8EZIUoiluiwZ2ZQXyFQulCIADYL-LGxD_f-eH-__=s457-k-no',
      "Entrecôte and fries",
      'Entrecôte com fritas',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWm3iXlVotabP5wg_1Y_eQNIgkBenXPLXyZzamqbl9tAoMk_jvt9dX9S55NSYmZDyJ4QOVstbFhmLBfsvZ2eAJLB3adprgRmUXKVN-D5UDbMOURU-_JLtMbIPINCWMGIj2UCqnaOjDSZPFas=w203-h161-k-no',
      "Le Relais de l'Entrecôte interior",
      "Interior do Le Relais de l'Entrecôte",
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWn3rLWNFxK0QeZeuyqspPy4yE4C2-kc8TG50feFN_JLZOdOP0fvidGputAj71KqUpwRXnhm1lHGzIfdNYWrlI1cxjITWVWlRmxfeLPtnyXgon8BMzI7geC7WMaoT5epkwAsjd0teVA_y0_I=s348-k-no',
      "Le Relais de l'Entrecôte",
      "Le Relais de l'Entrecôte",
      'Google Maps',
    ),
  ],
  'par-esplanade-de-gaulle': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmLEK9QnMY98qZVpGsRj5nO0eWncgd-vKOPRLmpxv994Z8T6kalIa1YMqKr9Ib0trrWlWBW0ahvB9_DOv8JIRuhVr4qfH0PeXwjA79OXK_McyKSB33lz02N1cohcPXR7YCSyfRQ=s1219-k-no',
      'Esplanade du Général de Gaulle',
      'Esplanade du Général de Gaulle',
      'Google Maps',
    ),
  ],
  'par-felicita': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/1/17/Bar_et_restaurant_dans_La_Felicit%C3%A0%2C_Paris._02.jpg',
      'La Felicità',
      'La Felicità',
      'Wikimedia Commons',
    ),
  ],
  'par-fondation-lv': [
    photo(
      'https://upload.wikimedia.org/wikipedia/en/0/03/Fondation_Louis_Vuitton_-_Paris_%2850569906682%29.jpg',
      'Fondation Louis Vuitton',
      'Fondation Louis Vuitton',
      'Wikimedia Commons',
    ),
  ],
  'par-forum-halles': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkIc4UdAVBkz5wAbJ8WviLm915QyPqJLdAlrF3iV3NIDAD-5GOWnA-_WxJ-roqa8y4oCY4tYMRwVmb9607O7hTeq1W6v6rBRasHAx2FT3sN32u5qcK1f-aV-8tcSJ21uaKSvkhrXQGDkZZ8=s696-k-no',
      'Forum des Halles',
      'Forum des Halles',
      'Google Maps',
    ),
  ],
  'par-francette': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/a/aa/P1080375_Paris_XV_Port_de_Suffren_rwk.JPG',
      'Francette',
      'Francette',
      'Wikimedia Commons',
    ),
  ],
  'par-franklin-passy': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/1/1c/Statue_de_Benjamin_Franklin%2C_square_de_Yorktown%2C_Paris_16e_9.jpg',
      'Le Franklin Passy',
      'Le Franklin Passy',
      'Wikimedia Commons',
    ),
  ],
  'par-fric-frac': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Canal_Saint-Martin_P1060441.JPG/3840px-Canal_Saint-Martin_P1060441.JPG',
      'Fric-Frac',
      'Fric-Frac',
      'Wikimedia Commons',
    ),
  ],
  'par-galeries-lafayette': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/GaleriesLafayetteNuit.jpg/1280px-GaleriesLafayetteNuit.jpg',
      'Galeries Lafayette',
      'Galeries Lafayette',
      'Wikimedia Commons',
    ),
  ],
  'par-grande-arche': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmahbvRwF1cvKduou9vRtXurYY3w9gIBNKAlCk0TA1UXpLv04fzMzPniM-ewJjT2K4fA7BvxwdRJbdvJu8LsnJR34B63YMk2pXYooIOWoG5zKcZdUIHNs2lxWfh2iIO2WLkC1bH-A=s1219-k-no',
      'Grande Arche de la Défense',
      'Grande Arche de la Défense',
      'Google Maps',
    ),
  ],
  'par-horloge': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/5/5f/Paris_Conciergerie_265.jpg',
      'Conciergerie Clock',
      'Conciergerie Clock',
      'Wikimedia Commons',
    ),
  ],
  'par-hotel-ville': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/H%C3%B4tel_ville_fa%C3%A7ade_principale_Paris_11.jpg/3840px-H%C3%B4tel_ville_fa%C3%A7ade_principale_Paris_11.jpg',
      'Hôtel de Ville',
      'Hôtel de Ville',
      'Wikimedia Commons',
    ),
  ],
  'par-invalides': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/H%C3%B4tel_des_Invalides_from_the_Eiffel_Tower%2C_23_July_2009.jpg/3840px-H%C3%B4tel_des_Invalides_from_the_Eiffel_Tower%2C_23_July_2009.jpg',
      'Invalides',
      'Invalides',
      'Wikimedia Commons',
    ),
  ],
  'par-jeffrey-cagnes': [
    photo(
      'https://cdn.sortiraparis.com/images/80/95310/680422-la-patisserie-de-jeffrey-cagnes-les-photos.jpg',
      'Pâtisserie Jeffrey Cagnes',
      'Pâtisserie Jeffrey Cagnes',
      'Sortir à Paris',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmIIAjo_lSaDowJ0Wj5kcqK7UmcBq2Ty8ABY58LpM6-LspvvbIF2MHLI0UNHwAhhxnA7DjqUy4JmE9_7vwNfz6CYw238S4dxboNJ8Jd3VhID638h7ZKcvamVlstKkH3FL1_2BSgAnhY3zE=s406-k-no',
      'Jeffrey Cagnes pastries',
      'Doces Jeffrey Cagnes',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWln4CTyblSguxcNY_GFhJyz6wzOKURhN-eFyPVRcFWRGIdFG97yuAtlxea-Z6OqqK44TylGzbgfSpMZPCWcv5cJq_cPq6tP62fyqGBK4HRebunN4jLKCqymjpWkw0A_UadyGbtz_mGAIMWo=s348-k-no',
      'Jeffrey Cagnes shop',
      'Loja Jeffrey Cagnes',
      'Google Maps',
    ),
  ],
  'par-la-defense': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/La_D%C3%A9fense_Juin_2025.jpg/3840px-La_D%C3%A9fense_Juin_2025.jpg',
      'La Défense',
      'La Défense',
      'Wikimedia Commons',
    ),
  ],
  'par-la-villette': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Rio_Samba_School_statue_%40_Parc_de_La_Villette_%40_Paris_%2828881779791%29.jpg/3840px-Rio_Samba_School_statue_%40_Parc_de_La_Villette_%40_Paris_%2828881779791%29.jpg',
      'Parc de la Villette',
      'Parc de la Villette',
      'Wikimedia Commons',
    ),
  ],
  'par-louvre': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/1280px-Louvre_Museum_Wikimedia_Commons.jpg',
      'Louvre',
      'Louvre',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Cour_Napol%C3%A9on_at_night_-_Louvre.jpg/1280px-Cour_Napol%C3%A9on_at_night_-_Louvre.jpg',
      'Louvre',
      'Louvre',
      'Wikimedia Commons',
    ),
  ],
  'par-luxembourg': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/LuxembourgMontparnasse.JPG/1280px-LuxembourgMontparnasse.JPG',
      'Luxembourg Garden',
      'Luxembourg Garden',
      'Wikimedia Commons',
    ),
  ],
  'par-madeleine': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/f/fc/Eglise_de_la_Madeleine_2024.jpg',
      'Église de la Madeleine',
      'Église de la Madeleine',
      'Wikimedia Commons',
    ),
  ],
  'par-maison-balzac': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maison_de_Balzac%2C_Paris_16e_5.jpg/1280px-Maison_de_Balzac%2C_Paris_16e_5.jpg',
      'Maison de Balzac',
      'Maison de Balzac',
      'Wikimedia Commons',
    ),
  ],
  'par-maison-isabelle': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWk0gzwLpcH_UdtOadluoLz-GOpOPH3CA9DYt3dHWZUGsU9pqbUhfgKRWFl2UVKFizBRq1bqr17yM81ewmNKy36Oenp3cMYqw9CW60z0AqIxzByyP7op0p3x0_FNUQmYXeFsn1eCjfnxhZPN=s773-k-no',
      'La Maison d\'Isabelle croissants',
      'Croissants da La Maison d\'Isabelle',
      'Google Maps',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Croissant%2C_whole.jpg/1280px-Croissant%2C_whole.jpg',
      'Butter croissant',
      'Croissant de manteiga',
      'Wikimedia Commons',
    ),
  ],
  'par-marais': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/d/d3/Paris_Hotel_de_Sens_dsc04028.jpg',
      'Le Marais',
      'Le Marais',
      'Wikimedia Commons',
    ),
  ],
  'par-marche-aligre': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlLr2ZyOyW0DW2yWYYo4kVh58E1iOPA0jVK6G7txkkVOQJseB8F1ZChnkX6l4TN1KKHtAA4flY9Q6_dpEM9HCo16N9IoKVCMLD3DYJS7AN3SFMTaZQGj8oZyjLIvT8o8vrukLfk-jDltn80=s1219-k-no',
      "Marché d'Aligre",
      "Marché d'Aligre",
      'Google Maps',
    ),
  ],
  'par-marche-bastille': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmkLsVvYlhMCeproeoRDB-ytYLFBXS9T4j665o1mhUUPwScsShMUJK2J0vysxQDR1a9TRrrZNEsv1M1vYSaqnatPThdAV9rif1arvcZ3TUuk_7t_t8nwm1pWjsdNNIRkUCtOdHKu19SdaI=s696-k-no',
      'Marché Bastille',
      'Marché Bastille',
      'Google Maps',
    ),
  ],
  'par-marche-enfants-rouges': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkMAd6auG6O4KUWeuPpeXVLW8_l_lZzvf1YdAV0v2J8wA20ru7IzgGhMq6sX5ruThNNhEIWVJ1LSho8ANt_GEFbosLGS5k2YEYOEBZwnlZbYYUKt14y1U-dOxMFdF3VSQngxpYcJVDY6cKC=s608-k-no',
      'Marché des Enfants Rouges',
      'Marché des Enfants Rouges',
      'Google Maps',
    ),
  ],
  'par-mcdonalds-champs': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWn7b5zps0QDEwMsyLDpD9tMW2NFs39BvTaRgYil5dwc2jL38jTtM6X2GHg82SvTxwvExjxdApF7o8lJ_BGQsnhsgl7N9mcIDOf8KmludLUCkCjxyEkR1bh-3qyWG7Zt52441k9jIw=s348-k-no',
      "McDonald's Champs-Élysées",
      "McDonald's Champs-Élysées",
      'Google Maps',
    ),
  ],
  'par-metro-2': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/3/35/Musician_Mohamed_Lamouri_in_Paris_Metro_line_2.jpg',
      'Metro Line 2',
      'Metro Line 2',
      'Wikimedia Commons',
    ),
  ],
  'par-metro-6': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/0/01/Pont_de_Bir-Hakeim%2C_may_2025.jpg',
      'Metro Line 6',
      'Metro Line 6',
      'Wikimedia Commons',
    ),
  ],
  'par-michalak': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Religieuses_au_chocolat.jpg/1280px-Religieuses_au_chocolat.jpg',
      'Chocolate religieuses pastry',
      'Religieuses de chocolate',
      'Wikimedia Commons',
    ),
  ],
  'par-michalak-etienne': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWl_F5T32X9QyZREvawZVe0bOJ2aylxLUkh2inyD3ANQM5IkiiFHLAQFUaYpmYl8d5pHi_RCF7ALb3W0d8y60PiKLZZtI4BS_BFTYl0hBrkNcU-kxkcLAYMTu3Ve3GB-vtEmg2PbFg=w203-h360-k-no',
      'Pâtisserie Michalak · Étienne Marcel',
      'Pâtisserie Michalak · Étienne Marcel',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnKZrjDWPOFc35n60b2v1NHIlCFvobPPTMNw8XnDVe3CxYGTVn3Ync_GGMmoYJjbljCFZnkIUQUD5VqotgUNPWPT-MhJUUgTrhyZoKCJHbMwEq5zC0c1YuhDsibIawEprBwULjqlKHy0B9T=s609-k-no',
      'Michalak pastries',
      'Doces Michalak',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWle5pSQjLlqxWH4yh_cxEjs87ocuACipxxNIl8cR7mVT8avg_F12uEzB3cSfYTYcdjl5w0TAb4eHMuZQ3aLkX3s_ypX8ayvxxW2nSxkuJtsTxqSnbBTXEFgovE6DqmWxQ2iiaDMnF3ejm4=s406-k-no',
      'Michalak shop',
      'Loja Michalak',
      'Google Maps',
    ),
  ],
  'par-artizans': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chez_Chartier_1.JPG',
      'Classic Paris bistro dining room',
      'Salão clássico de bistrô parisiense',
      'Wikimedia Commons',
    ),
  ],
  'par-monceau': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Rotonde_Chartres_Paris_3.jpg/3840px-Rotonde_Chartres_Paris_3.jpg',
      'Parc Monceau',
      'Parc Monceau',
      'Wikimedia Commons',
    ),
  ],
  'par-monoprix-rivoli': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnF1uhrNplnaayle-0aAhogQhyHeKRYWNa74nWrt9O-96-pgRgEK-xzYnQKZyd8brJJilHYUF6zVPuR9dmAUF5gacQBWiqkg6Rgr81ufZRfYtFRlxGl_L4HTWWSjg2aeECSOaa8=s811-k-no',
      'Monoprix Opéra',
      'Monoprix Opéra',
      'Google Maps',
    ),
  ],
  'par-montmartre': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/View_from_Notre-Dame_de_Paris%2C_24_June_2014_004.jpg/3840px-View_from_Notre-Dame_de_Paris%2C_24_June_2014_004.jpg',
      'Montmartre',
      'Montmartre',
      'Wikimedia Commons',
    ),
  ],
  'par-montorgueil': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmTANTGhyQyKBA0XK_LvDPsanTWcJTp8ugWIRwz8HhBogvZrM1O-Z-skoqOykpqEig7iV1T8tKXeiyMqPCsDa_DJ8SYDFeeDNQRvVIRKYZTILKa7tlL9cxLaeYUBSRKeUUAXiqf=s457-k-no',
      'Rue Montorgueil',
      'Rue Montorgueil',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWn64em6_9Zp6_Vz7GN6yII64mGDpsHSGo-YaYhUKkBGjE7NX3a0qGMZyoHUPmAuSFMvV30C3God4693dU3a4KArSkdsiVyXH4aBTaakYeEzaiswGcxyrG81vdSS1DEC40UzsNB7=s406-k-no',
      'Montorgueil market street',
      'Rua de mercado Montorgueil',
      'Google Maps',
    ),
  ],
  'par-montparnasse': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Parc_de_Saint-Cloud_avec_vue_sur_la_Tour_Montparnasse.jpg/1280px-Parc_de_Saint-Cloud_avec_vue_sur_la_Tour_Montparnasse.jpg',
      'Tour Montparnasse',
      'Tour Montparnasse',
      'Wikimedia Commons',
    ),
  ],
  'par-moulin-rouge': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Moulin_Rouge%2C_17_April_2011.jpg/3840px-Moulin_Rouge%2C_17_April_2011.jpg',
      'Moulin Rouge',
      'Moulin Rouge',
      'Wikimedia Commons',
    ),
  ],
  'par-notre-dame': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Notre-Dame_de_Paris%2C_4_October_2017.jpg/1280px-Notre-Dame_de_Paris%2C_4_October_2017.jpg',
      'Notre-Dame west façade from the Seine',
      'Fachada oeste de Notre-Dame vista do Sena',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Notre-Dame_de_Paris%2C_across_the_Seine%2C_before_reopening.jpg/1280px-Notre-Dame_de_Paris%2C_across_the_Seine%2C_before_reopening.jpg',
      'Notre-Dame across the Seine',
      'Notre-Dame vista do outro lado do Sena',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Notre-Dame_de_Paris_from_the_Pont_de_l%27Archev%C3%AAch%C3%A9_by_Night.jpg/1280px-Notre-Dame_de_Paris_from_the_Pont_de_l%27Archev%C3%AAch%C3%A9_by_Night.jpg',
      'Notre-Dame at night from Pont de l’Archevêché',
      'Notre-Dame à noite a partir do Pont de l’Archevêché',
      'Wikimedia Commons',
    ),
  ],
  'par-opera': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Paris_Opera_full_frontal_architecture%2C_May_2009.jpg/1280px-Paris_Opera_full_frontal_architecture%2C_May_2009.jpg',
      'Opéra Garnier',
      'Opéra Garnier',
      'Wikimedia Commons',
    ),
  ],
  'par-orangerie': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/b/bb/Mus%C3%A9e_de_l%E2%80%99Orangerie_exterior.JPG',
      'Musée de l\'Orangerie',
      'Musée de l\'Orangerie',
      'Wikimedia Commons',
    ),
  ],
  'par-orsay': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Mus%C3%A9e_d%27Orsay%2C_North-West_view%2C_Paris_7e_140402.jpg/1280px-Mus%C3%A9e_d%27Orsay%2C_North-West_view%2C_Paris_7e_140402.jpg',
      'Musée d\'Orsay',
      'Musée d\'Orsay',
      'Wikimedia Commons',
    ),
  ],
  'par-ory': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Paris-Orly_Aerial.jpg/1280px-Paris-Orly_Aerial.jpg',
      'Orly Airport (ORY)',
      'Orly Airport (ORY)',
      'Wikimedia Commons',
    ),
  ],
  'par-orly-paul': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkU4PmcTDXuC46zcsWSnJJ1SGYdjlg0cnm98pKosrcZu0dgXMSbQbaqXxhU4Du3UY5T-svxcrBe2KFVcRerynbAwaDLNlrynDFTkKXOvWZxYiskgRn6lnJRieX2VJjQ3IcCb-xT=s901-k-no',
      'PAUL Orly — bakery counter',
      'PAUL Orly — balcão da padaria',
      'Google Maps',
    ),
  ],
  'par-cdg-paul': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Pain_au_chocolat_Luc_Viatour.jpg/1280px-Pain_au_chocolat_Luc_Viatour.jpg',
      'PAUL CDG — croissants & coffee',
      'PAUL CDG — croissants e café',
      'Wikimedia Commons',
    ),
  ],
  'par-cdg': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Aerial_view_of_Paris-Charles_de_Gaulle_airport.jpg/1280px-Aerial_view_of_Paris-Charles_de_Gaulle_airport.jpg',
      'Charles de Gaulle Airport (CDG)',
      'Aeroporto Charles de Gaulle (CDG)',
      'Wikimedia Commons',
    ),
  ],
  'par-palais': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/France-000296_-_Paris%27_Grand_Palais_%2814525102530%29.jpg/1280px-France-000296_-_Paris%27_Grand_Palais_%2814525102530%29.jpg',
      'Petit & Grand Palais',
      'Petit & Grand Palais',
      'Wikimedia Commons',
    ),
  ],
  'par-palais-royal': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/8/85/Conseil_d%27Etat_Paris_WA.jpg',
      'Palais-Royal',
      'Palais-Royal',
      'Wikimedia Commons',
    ),
  ],
  'par-paname-brewing': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Paname_Tap_House_%28Quartier_Crim%C3%A9e%29_01.jpg/1280px-Paname_Tap_House_%28Quartier_Crim%C3%A9e%29_01.jpg',
      'Paname Brewing Company',
      'Paname Brewing Company',
      'Wikimedia Commons',
    ),
  ],
  'par-pantheon': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Pantheon_of_Paris_007.JPG/1280px-Pantheon_of_Paris_007.JPG',
      'Panthéon',
      'Panthéon',
      'Wikimedia Commons',
    ),
  ],
  'par-paul-defense': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlIXnW00fy0Lc5DC9DmAB5cqZN9s3smQ5tdSvYGMp8fGNavpxIKCq8UZvVVVtrP-e5UhfD9YKGcYXYe83UFbHbdaNGetbAsmaubU2bmVW1kNh5g0Z79iz3UtPV1GiD9hEJtxrCrC0hiIV59=s928-k-no',
      'PAUL La Défense',
      'PAUL La Défense',
      'Google Maps',
    ),
  ],
  'par-pierre-herme': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Various_Pierre_Herme_macarons.jpg/1280px-Various_Pierre_Herme_macarons.jpg',
      'Pierre Hermé macarons assortment',
      'Seleção de macarons Pierre Hermé',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/5/52/A_selection_of_Pierre_Herm%C3%A9_pastry_creations.jpg',
      'Pierre Hermé pastry creations',
      'Criações de confeitaria Pierre Hermé',
      'Wikimedia Commons',
    ),
  ],
  'par-pompidou': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Pompidou_Centre.jpg/1280px-Pompidou_Centre.jpg',
      'Centre Pompidou — high-tech exterior',
      'Centre Pompidou — exterior high-tech',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Apud_la_Centro_Georges-Pompidou_5.jpg/1280px-Apud_la_Centro_Georges-Pompidou_5.jpg',
      'Centre Pompidou façade and escalator tubes',
      'Fachada do Centre Pompidou e tubos das escadas',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Place_Georges-Pompidou%2C_Paris_24_April_2011.jpg/1280px-Place_Georges-Pompidou%2C_Paris_24_April_2011.jpg',
      'Place Georges-Pompidou and the Centre',
      'Place Georges-Pompidou e o Centre',
      'Wikimedia Commons',
    ),
  ],
  'par-printemps': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Printemps_Haussmann.jpg/1280px-Printemps_Haussmann.jpg',
      'Printemps',
      'Printemps',
      'Wikimedia Commons',
    ),
  ],
  'par-procope': [
    photo(
      'https://live.staticflickr.com/3597/3496995066_69ae2de882_b.jpg',
      'Le Procope',
      'Le Procope',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-promenade-plantee': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlfkY0zLztqFv-OeWPjr25HkcqNMuXkRXH3OUrJUtL_vmqvLjDqKVE82TzTGVKpE9D2gdqkRMwhz_IH0UfHJHCC-ZrkydfGeSq0CtknZDrVyHKinoWs4JZLVebCpOMYOKbLvz0A=s391-k-no',
      'Promenade Plantée (Coulée Verte)',
      'Promenade Plantée (Coulée Verte)',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmbuIaftOyI4ips3fvQzyENQlRnD5RdmHJJzlkAMB4DOUUBw8AjOX6lv9JCEZ5H3TwZa8yNZ06oIWNFjTjLk-2UG9ywDa3a5Q1JOcE6-kwJP654rlVbVmRR92x9GI1CNk2pOOLZ=s391-k-no',
      'Coulée Verte elevated walkway',
      'Coulée Verte — passeio elevado',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWm7PSUASISQxXiOzBBLZnlXv6dVWmaEfwwH6w1dm_udp7Z5G7GnM5w4NJfz-pabJr1LpcskSHelSu4Zqtq8BeYrow1tBJXKBhGsHX5lrMShIijYa1hELQW4ASgq93j6V26bNQvM=s609-k-no',
      'Promenade Plantée greenery',
      'Promenade Plantée — vegetação',
      'Google Maps',
    ),
  ],
  'par-royal-cambronne': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Place_Cambronne_-_Paris_XV_%28FR75%29_-_2021-08-09_-_3.jpg/3840px-Place_Cambronne_-_Paris_XV_%28FR75%29_-_2021-08-09_-_3.jpg',
      'Le Royal Cambronne',
      'Le Royal Cambronne',
      'Wikimedia Commons',
    ),
  ],
  'par-rue-cler': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkeiO7DDL5xXmFeahNjey_zHAtL_o11evVGW2uraioxRsfrTBaLC5A7yS_8KOKf-qwGrjIssjgWX6HmoZLcAB4AzhqTLLuL63BWO38QHOR0cdDYFB7bStui0mL_-tTGC5mdQfJ1eg=s696-k-no',
      'Rue Cler market street',
      'Rue Cler — rua de mercado',
      'Google Maps',
    ),
  ],
  'par-sacre-coeur': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre_-_Paris_-_GT-01_-_2024.jpg/1280px-Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre_-_Paris_-_GT-01_-_2024.jpg',
      'Sacré-Cœur',
      'Sacré-Cœur',
      'Wikimedia Commons',
    ),
  ],
  'par-saint-eustache': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Paris_-_Eglise_Saint-Eustache_-_Vue_g%C3%A9n%C3%A9rale.jpg/1280px-Paris_-_Eglise_Saint-Eustache_-_Vue_g%C3%A9n%C3%A9rale.jpg',
      'Église Saint-Eustache — general view',
      'Église Saint-Eustache — vista geral',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/%C3%89glise_Saint-Eustache_de_Paris_vue_des_Halles.jpg/1280px-%C3%89glise_Saint-Eustache_de_Paris_vue_des_Halles.jpg',
      'Saint-Eustache from Les Halles',
      'Saint-Eustache vista de Les Halles',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/South_facade_of_%C3%89glise_Saint-Eustache_de_Paris%2C_M.jpg/1280px-South_facade_of_%C3%89glise_Saint-Eustache_de_Paris%2C_M.jpg',
      'Saint-Eustache south façade',
      'Fachada sul de Saint-Eustache',
      'Wikimedia Commons',
    ),
  ],
  'par-saint-michel': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkjWrOpg-Wiii47W4fvwH1Kn1dHCJwK9ipDVRjcKSHcxhBpaTXbl5oDxEtBtuWOhd9eZrTXbL3U7WWDmSAWIdyP-w9ks1ngTjvSlEkqrrI2qgiwM80p_B74XYFASFRQ0rBgh4dV=s365-k-no',
      'Place Saint-Michel',
      'Place Saint-Michel',
      'Google Maps',
    ),
  ],
  'par-sainte-chapelle': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/7/70/Sainte_Chapelle_-_Upper_level_1.jpg',
      'Sainte-Chapelle',
      'Sainte-Chapelle',
      'Wikimedia Commons',
    ),
  ],
  'par-serres-auteuil': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/7/74/Serianthes_calycina_au_Jardin_des_Serres_d%27Auteuil_%28Paris%29.jpg',
      'Jardin des Serres d\'Auteuil',
      'Jardin des Serres d\'Auteuil',
      'Wikimedia Commons',
    ),
  ],
  'par-shakespeare': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnYJiEHyO5MHM2kAbH2cbi1w2LBAeYS_xuFSqotP3no10MQuYiU_R32a-643KZ1sg01A_8XjyDCM3BcfCm2LQQBvlkm-madcx7ywnHRtIuGa5QHAazhqJavA6Bd0X9xsVb45ACfoeb5bHB5=w408-h544-k-no',
      'Shakespeare and Company bookshop',
      'Livraria Shakespeare and Company',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWk3CDv49kUl1PyWi8GAhIiMlga9dz2WwyRUt2om9v3q7EV_RLVP5w9gVGfthdxSMCvxOx6k46FS_lBngmkl3TSjiMzIJpH01iTtVBUFAc6CBJLZ_FUuZD1M8qPsi7kxtK2E04FLNB6Teaw=s696-k-no',
      'Shakespeare and Company interior',
      'Interior da Shakespeare and Company',
      'Google Maps',
    ),
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWletNv21VtmdV6MDwoYKjqJcq8L2XTs1maAYh-ou5Ih-eFfzNnpYLxBvCE8Evpy6OVrcyNpGiQ1uwt5DAEMt_3aLIeLdXFw7TD0O99UkekT3Bny9zwrwm8fv3q3MXO9AdrWu1L2hWXyDNo=s644-k-no',
      'Shakespeare and Company shelves',
      'Prateleiras da Shakespeare and Company',
      'Google Maps',
    ),
  ],
  'par-sorbonne': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/P1300734_Paris_V_place_de_la_Sorbonne_rwk.jpg/1280px-P1300734_Paris_V_place_de_la_Sorbonne_rwk.jpg',
      'Rue de la Sorbonne',
      'Rue de la Sorbonne',
      'Wikimedia Commons',
    ),
  ],
  'par-train-bleu': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/c/cb/Le_Train_Bleu.jpg',
      'Le Train Bleu',
      'Le Train Bleu',
      'Wikimedia Commons',
    ),
  ],
  'par-trocadero': [
    photo(
      'https://live.staticflickr.com/4010/4175210166_4b92dc7454_b.jpg',
      'Trocadéro',
      'Trocadéro',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-tuileries': [
    photo(
      'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkK49900OAdl00ZSQzk_G0mkEiXKn-gaTwy-4SQr-V3Q7ZTeQsolGuJ9XnFE5hLB-mQk1R93WcHmlMlJEMqD-an9jW4sIxK14PKsbvtvD0zaWRjSliEIhPOuklQ3K2M4Ko2768u=s783-k-no',
      'Tuileries Garden',
      'Tuileries Garden',
      'Google Maps',
    ),
  ],
  'par-vendome': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Place_Vendome%2C_Paris_20_April_2011.jpg/3840px-Place_Vendome%2C_Paris_20_April_2011.jpg',
      'Place Vendôme',
      'Place Vendôme',
      'Wikimedia Commons',
    ),
  ],
  'par-versailles': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vue_a%C3%A9rienne_du_domaine_de_Versailles_par_ToucanWings_-_Creative_Commons_By_Sa_3.0_-_081_%28cropped%29.jpg/1280px-Vue_a%C3%A9rienne_du_domaine_de_Versailles_par_ToucanWings_-_Creative_Commons_By_Sa_3.0_-_081_%28cropped%29.jpg',
      'Château de Versailles — aerial view of the palace and gardens',
      'Château de Versailles — vista aérea do palácio e jardins',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Front_of_the_Palace_of_Versailles.jpg/1280px-Front_of_the_Palace_of_Versailles.jpg',
      'Palace of Versailles — entrance courtyard façade',
      'Palácio de Versalhes — fachada do pátio de entrada',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Garden_facade_of_the_Palace_of_Versailles_1.jpg/1280px-Garden_facade_of_the_Palace_of_Versailles_1.jpg',
      'Palace of Versailles — garden façade',
      'Palácio de Versalhes — fachada dos jardins',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Chateau_Versailles_Galerie_des_Glaces.jpg/1280px-Chateau_Versailles_Galerie_des_Glaces.jpg',
      'Hall of Mirrors (Galerie des Glaces)',
      'Galeria dos Espelhos (Galerie des Glaces)',
      'Wikimedia Commons',
    ),
  ],
  'par-vincennes': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/d/d2/Bois_de_Vincennes_20060816_16.jpg',
      'Bois de Vincennes',
      'Bois de Vincennes',
      'Wikimedia Commons',
    ),
  ],
  'par-vincennes-town': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/4/44/Ch%C3%A2teau_de_Vincennes_Paris_FRA_002.jpg',
      'Vincennes',
      'Vincennes',
      'Wikimedia Commons',
    ),
  ],
  'par-vosges': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/3/3d/Place_des_Vosges_vue_a%C3%A9rienne.png',
      'Place des Vosges',
      'Place des Vosges',
      'Wikimedia Commons',
    ),
  ],

  // —— Rome ——
  'rom-fco': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Rom_Fiumicino_2011-by-RaBoe-02.jpg/1280px-Rom_Fiumicino_2011-by-RaBoe-02.jpg',
      'Fiumicino Airport (FCO)',
      'Aeroporto de Fiumicino (FCO)',
      'Wikimedia Commons',
    ),
  ],
  'rom-termini': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Roma_termini_01.jpg/1280px-Roma_termini_01.jpg',
      'Roma Termini station',
      'Estação Roma Termini',
      'Wikimedia Commons',
    ),
  ],
  'rom-gallina-bianca': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Espaguetis_carbonara.jpg/1280px-Espaguetis_carbonara.jpg',
      'Spaghetti carbonara',
      'Espaguete à carbonara',
      'Wikimedia Commons',
    ),
  ],
  'rom-alfredo-ada': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Pasta_carbonara.jpg/1280px-Pasta_carbonara.jpg',
      'Roman-style pasta plate',
      'Prato de massa à romana',
      'Wikimedia Commons',
    ),
  ],
  'rom-antico-vinaio': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Panino_con_porchetta_01.jpg/1280px-Panino_con_porchetta_01.jpg',
      'Italian stuffed sandwich',
      'Sanduíche italiano recheado',
      'Wikimedia Commons',
    ),
  ],
  'rom-baffetto': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Pizza_romana_03.jpg/1280px-Pizza_romana_03.jpg',
      'Roman-style pizza',
      'Pizza à romana',
      'Wikimedia Commons',
    ),
  ],
  'rom-suppli': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/a/a9/Suppl%C3%AC.jpg',
      'Roman supplì rice balls',
      'Supplì — bolinhos de arroz romanos',
      'Wikimedia Commons',
    ),
  ],
  'rom-norcineria': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Panino_con_porchetta_02.jpg/1280px-Panino_con_porchetta_02.jpg',
      'Porchetta sandwich',
      'Sanduíche de porchetta',
      'Wikimedia Commons',
    ),
  ],
  'rom-said': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Coppette_gelato.jpg/1280px-Coppette_gelato.jpg',
      'Italian gelato cups',
      'Copos de gelato italiano',
      'Wikimedia Commons',
    ),
  ],
  'rom-forno-trevi': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Pistachio-filled_Croissant_-_Milfey_Patisserie_2026-05-30.jpg/1280px-Pistachio-filled_Croissant_-_Milfey_Patisserie_2026-05-30.jpg',
      'Pistachio-filled croissant',
      'Croissant de pistache',
      'Wikimedia Commons',
    ),
  ],
  'rom-colosseum': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/1280px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg',
      'Colosseum, Rome',
      'Coliseu, Roma',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/1280px-Colosseo_2020.jpg',
      'Colosseum exterior',
      'Exterior do Coliseu',
      'Wikimedia Commons',
    ),
  ],
  'rom-forum': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Forum_Romanum_%2814%29.jpg/1280px-Forum_Romanum_%2814%29.jpg',
      'Roman Forum',
      'Fórum Romano',
      'Wikimedia Commons',
    ),
  ],
  'rom-pantheon': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Rome_%28IT%29%2C_Pantheon_--_2013_--_3572.jpg/1280px-Rome_%28IT%29%2C_Pantheon_--_2013_--_3572.jpg',
      'Pantheon, Rome',
      'Panteão, Roma',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Pantheon_%28Rome%29%2C_Dome_interior.jpg/1280px-Pantheon_%28Rome%29%2C_Dome_interior.jpg',
      'Pantheon dome interior and oculus',
      'Interior da cúpula do Panteão e óculo',
      'Wikimedia Commons',
    ),
  ],
  'rom-piazza-venezia': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Piazza_Venezia_-_Il_Vittoriano.jpg/1280px-Piazza_Venezia_-_Il_Vittoriano.jpg',
      'Piazza Venezia and the Vittoriano',
      'Piazza Venezia e o Vittoriano',
      'Wikimedia Commons',
    ),
  ],
  'rom-trevi': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Fontana_di_Trevi_by_TC.jpg/1280px-Fontana_di_Trevi_by_TC.jpg',
      'Trevi Fountain',
      'Fontana di Trevi',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Fuente_de_Trevi%2C_Roma%2C_Italia%2C_2022-09-15%2C_DD_02.jpg/1280px-Fuente_de_Trevi%2C_Roma%2C_Italia%2C_2022-09-15%2C_DD_02.jpg',
      'Trevi Fountain façade',
      'Fachada da Fontana di Trevi',
      'Wikimedia Commons',
    ),
  ],
  'rom-vatican': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Vatican_Museums_Spiral_Staircase_2012.jpg/1280px-Vatican_Museums_Spiral_Staircase_2012.jpg',
      'Vatican Museums spiral staircase',
      'Escada em espiral dos Museus do Vaticano',
      'Wikimedia Commons',
    ),
  ],
  'rom-sistine': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Sistine_Chapel%2C_Vatican_City_%28_Ank_Kumar%2C_Infosys_Limited%29_01.jpg/1280px-Sistine_Chapel%2C_Vatican_City_%28_Ank_Kumar%2C_Infosys_Limited%29_01.jpg',
      'Sistine Chapel exterior / Vatican',
      'Capela Sistina / Vaticano',
      'Wikimedia Commons',
    ),
  ],
  'rom-st-peter': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg/1280px-Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg',
      "St. Peter's Basilica",
      'Basílica de São Pedro',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Basilica_Sancti_Petri_blue_hour.jpg/1280px-Basilica_Sancti_Petri_blue_hour.jpg',
      "St. Peter's at blue hour",
      'São Pedro na blue hour',
      'Wikimedia Commons',
    ),
  ],
  'rom-vittoriano': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Monument_Victor_Emmanuel_II_right_profile%2C_Rome%2C_Italy.jpg/1280px-Monument_Victor_Emmanuel_II_right_profile%2C_Rome%2C_Italy.jpg',
      'Victor Emmanuel II Monument (Vittoriano)',
      'Monumento a Vítor Emanuel II (Vittoriano)',
      'Wikimedia Commons',
    ),
  ],
  'rom-window-on-rome': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Night_life_at_Trastevere%2C_Rome_-_3398.jpg/1280px-Night_life_at_Trastevere%2C_Rome_-_3398.jpg',
      'Trastevere at night — neighborhood vibe near Window on Rome',
      'Trastevere à noite — clima do bairro perto do Window on Rome',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Piazza_Sidney_Sonnino_-_Parrocchia_San_Crisogono_-_panoramio.jpg/1280px-Piazza_Sidney_Sonnino_-_Parrocchia_San_Crisogono_-_panoramio.jpg',
      'Piazza Sidney Sonnino, Trastevere',
      'Piazza Sidney Sonnino, Trastevere',
      'Wikimedia Commons',
    ),
  ],
};

export function photosForPlaceId(id: string): TravelPhoto[] | undefined {
  const list = photosByPlaceId[id];
  return list && list.length > 0 ? list : undefined;
}
